// ============================================================
// SUPABASE INTEGRATION & REAL-TIME SYNC MODULE — Multi-Tenant
// ============================================================

import { SUPABASE_URL, SUPABASE_KEY } from '../utils/constants.js';
import { setSBReference } from './storage.js';

let _sb = null;
let _sbReady = false;
let _realtimeSetup = false;

// Global state references (injected)
let tasks = [];
let members = [];
let prazos = [];
let activity = [];
let sharedAC = [];
let processos = [];
let currentUser = null;
let currentPage = null;

export function setSBState(state) {
  ({ tasks, members, prazos, activity, sharedAC, processos, currentUser, currentPage } = state);
}

// Retorna o office_id do usuário atual (com fallback para VG)
function _getOfficeId() {
  return (window.currentUser?.officeId) || 'vg-advocacia';
}

// ─── Initialize Supabase Client ───
export async function initSupabase() {
  try {
    if (SUPABASE_URL && window.supabase) {
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      _sbReady = true;
      setSBReference(_sb, _sbReady);
      window._sb = _sb;
      console.log('✅ Supabase inicializado!');
      return _sb;
    } else {
      console.error('❌ Supabase não configurado!');
      return null;
    }
  } catch (e) {
    console.error('❌ Supabase init error:', e);
    return null;
  }
}

// ─── Salvar para Supabase com office_id ───
export async function _sbSave(key, value) {
  if (!_sbReady || !_sb) return;
  const officeId = _getOfficeId();
  try {
    const timestamp = new Date().toISOString();

    // Tentar com office_id (novo schema multi-tenant)
    const { error } = await _sb.from('app_data').upsert(
      { office_id: officeId, key, data: value, updated_at: timestamp },
      { onConflict: 'office_id,key' }
    );

    if (error) {
      // Fallback: salvar sem office_id (schema antigo — antes de executar o SQL)
      const { error: e2 } = await _sb.from('app_data').upsert(
        { key, data: value, updated_at: timestamp },
        { onConflict: 'key' }
      );
      if (e2) console.error('❌ Erro ao salvar:', e2);
    }
  } catch (e) {
    console.error('❌ Erro:', e);
  }
}

// ─── Carregar dados do Supabase com office_id ───
export async function _sbLoadAll() {
  if (!_sbReady || !_sb) return;
  const officeId = _getOfficeId();

  try {
    const keys = ['lex_tasks', 'lex_members', 'lex_prazos', 'lex_activity', 'lex_shared_ac', 'lex_municipios', 'lex_processos', 'lex_reset_requests', 'lex_password_overrides'];

    // Tentar carregar com filtro de office_id
    let data, error;
    const result = await _sb
      .from('app_data')
      .select('key, data, updated_at')
      .eq('office_id', officeId)
      .in('key', keys);
    data = result.data;
    error = result.error;

    // Fallback: sem filtro (schema antigo)
    if (error || !data?.length) {
      const r2 = await _sb.from('app_data').select('key, data, updated_at').in('key', keys);
      data = r2.data;
      error = r2.error;
    }

    if (error) { console.error('❌ Erro ao carregar:', error); window._sbLoadAllDone = true; return; }
    if (!data || !data.length) { window._sbLoadAllDone = true; return; }

    let shouldRerender = false;
    data.forEach(({ key, data: value, updated_at: sbUpdatedAt }) => {
      if (!value) return;

      let useSupabase = true;
      try {
        const localRaw = localStorage.getItem(key);
        if (localRaw) {
          const localMeta = localStorage.getItem(key + '_updated_at');
          if (!sbUpdatedAt) {
            useSupabase = false;
          } else if (localMeta) {
            const localTime = new Date(localMeta).getTime();
            const sbTime = new Date(sbUpdatedAt).getTime();
            if (!isNaN(localTime) && !isNaN(sbTime) && localTime >= sbTime) {
              useSupabase = false;
            }
          }
        }
      } catch {}

      if (!useSupabase) return;

      shouldRerender = true;
      try {
        localStorage.setItem(key, JSON.stringify(value));
        if (sbUpdatedAt) localStorage.setItem(key + '_updated_at', sbUpdatedAt);
      } catch {}

      if      (key === 'lex_tasks')              { window.tasks = value; tasks = value; }
      else if (key === 'lex_members')            { window.members = value; members = value; }
      else if (key === 'lex_prazos')             { window.prazos = value; prazos = value; }
      else if (key === 'lex_activity')           { window.activity = value; activity = value; }
      else if (key === 'lex_shared_ac')          { window.sharedAC = value; sharedAC = value; }
      else if (key === 'lex_municipios')         { window.municipios = value; }
      else if (key === 'lex_processos')          { processos = value; window.processos = value; }
      else if (key === 'lex_reset_requests')     { localStorage.setItem('lex_reset_requests', JSON.stringify(value)); }
      else if (key === 'lex_password_overrides') { localStorage.setItem('lex_password_overrides', JSON.stringify(value)); }
    });

    window._sbLoadAllDone = true;

    if (shouldRerender) {
      const pageToRender = window.currentPage || currentPage;
      if (pageToRender && typeof window.renderPage === 'function') {
        window.renderPage(pageToRender);
      } else if (typeof window.renderPage === 'function') {
        const _waitForPage = setInterval(() => {
          const p = window.currentPage || currentPage;
          if (p) { clearInterval(_waitForPage); window.renderPage(p); }
        }, 300);
        setTimeout(() => clearInterval(_waitForPage), 5000);
      }
    }
  } catch (e) {
    console.error('❌ Erro ao carregar dados:', e);
    window._sbLoadAllDone = true;
  }
}

// ─── Setup Real-time Listeners ───
export function _setupRealtime() {
  if (!_sb || !_sbReady || _realtimeSetup) return;
  _realtimeSetup = true;

  const officeId = _getOfficeId();
  const channel = _sb.channel(`kausas-${officeId}`);

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
      const newDataRow = payload.new;
      if (!newDataRow) return;

      // Ignorar updates de outros escritórios
      if (newDataRow.office_id && newDataRow.office_id !== officeId) return;

      const key = newDataRow.key;
      const newData = newDataRow.data;

      if (newData) {
        let currentData;
        if      (key === 'lex_tasks')     currentData = tasks;
        else if (key === 'lex_members')   currentData = members;
        else if (key === 'lex_prazos')    currentData = prazos;
        else if (key === 'lex_activity')  currentData = activity;
        else if (key === 'lex_shared_ac') currentData = sharedAC;
        else if (key === 'lex_processos') currentData = processos;
        else {
          try { currentData = JSON.parse(localStorage.getItem(key) || 'null'); } catch { currentData = null; }
        }

        if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
          try { localStorage.setItem(key, JSON.stringify(newData)); } catch {}

          if      (key === 'lex_tasks')              { tasks = newData; window.tasks = newData; }
          else if (key === 'lex_members')            { members = newData; window.members = newData; }
          else if (key === 'lex_prazos')             { prazos = newData; window.prazos = newData; }
          else if (key === 'lex_activity')           { activity = newData; window.activity = newData; }
          else if (key === 'lex_shared_ac')          { sharedAC = newData; window.sharedAC = newData; }
          else if (key === 'lex_municipios')         { window.municipios = newData; }
          else if (key === 'lex_processos')          { processos = newData; window.processos = newData; }
          else if (key === 'lex_reset_requests')     {
            localStorage.setItem('lex_reset_requests', JSON.stringify(newData));
            if (typeof window.updateNotifBadgeFromAlerts === 'function') window.updateNotifBadgeFromAlerts();
          }
          else if (key === 'lex_password_overrides') {
            localStorage.setItem('lex_password_overrides', JSON.stringify(newData));
          }

          const hasOpenModal = document.querySelector('.modal-overlay.open') ||
                               document.querySelector('.modal-overlay[style*="display: flex"]');
          const pageToRender = window.currentPage || currentPage;
          if (!hasOpenModal && pageToRender && typeof window.renderPage === 'function') {
            window.renderPage(pageToRender);
          }
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('🔥 Realtime ativo para office:', officeId);
    });
}

// ─── Test Functions ───
export function testSupabase() {
  console.log('✅ Supabase client:', !!_sb, '| Ready:', _sbReady, '| Office:', _getOfficeId());
}

export function testRealtime() {
  if (!_sb || !_sbReady) { console.error('Supabase não está pronto'); return; }
  _sbSave('test_realtime', { test: 'data', timestamp: new Date().toISOString() });
}

export { _sb, _sbReady };
