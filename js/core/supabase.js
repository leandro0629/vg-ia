// ============================================================
// SUPABASE INTEGRATION & REAL-TIME SYNC MODULE
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

// ─── Initialize Supabase Client ───
export async function initSupabase() {
  try {
    console.log('📦 initSupabase: Verificando dependências...');
    console.log('  SUPABASE_URL:', !!SUPABASE_URL);
    console.log('  window.supabase:', !!window.supabase);

    if (SUPABASE_URL && window.supabase) {
      console.log('✅ Criando cliente Supabase...');
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      _sbReady = true;
      setSBReference(_sb, _sbReady);
      console.log('✅ Supabase inicializado com real-time sync ativado!');
      console.log('   Cliente:', !!_sb, '| Ready:', _sbReady);
      return _sb;
    } else {
      console.error('❌ Supabase não configurado!');
      console.error('   SUPABASE_URL:', SUPABASE_URL);
      console.error('   window.supabase:', window.supabase);
      return null;
    }
  } catch (e) {
    console.error('❌ Supabase init error:', e);
    return null;
  }
}

// ─── Salvar para Supabase (app_data table com upsert) ───
export async function _sbSave(key, value) {
  if (!_sbReady || !_sb) return;
  try {
    const timestamp = new Date().toISOString();
    const { error } = await _sb.from('app_data').upsert(
      { key, data: value, updated_at: timestamp },
      { onConflict: 'key' }
    );
    if (error) console.error('❌ Erro ao salvar:', error);
    else console.log('✅ Sincronizado com Supabase:', key);
  } catch (e) {
    console.error('❌ Erro:', e);
  }
}

// ─── Carregar dados do Supabase na inicialização (APENAS se localStorage vazio) ───
export async function _sbLoadAll() {
  if (!_sbReady || !_sb) return;
  try {
    const keys = ['lex_tasks', 'lex_members', 'lex_prazos', 'lex_activity', 'lex_shared_ac', 'lex_municipios', 'lex_processos', 'lex_reset_requests'];
    const { data, error } = await _sb.from('app_data').select('key, data').in('key', keys);
    if (error) { console.error('❌ Erro ao carregar do Supabase:', error); return; }
    if (!data || !data.length) return;

    let shouldRerender = false;
    data.forEach(({ key, data: value, updated_at: sbUpdatedAt }) => {
      if (!value) return;

      // Comparar timestamp do Supabase com o localStorage para decidir qual é mais recente
      let useSupabase = true;
      try {
        const localRaw = localStorage.getItem(key);
        if (localRaw && sbUpdatedAt) {
          const localMeta = localStorage.getItem(key + '_updated_at');
          if (localMeta && new Date(localMeta) >= new Date(sbUpdatedAt)) {
            useSupabase = false; // localStorage é mais recente, manter local
          }
        }
      } catch {}

      if (!useSupabase) return;

      shouldRerender = true;
      // Salvar no localStorage + timestamp
      try {
        localStorage.setItem(key, JSON.stringify(value));
        if (sbUpdatedAt) localStorage.setItem(key + '_updated_at', sbUpdatedAt);
      } catch {}
      // Atualizar window globals
      if (key === 'lex_tasks')           { window.tasks = value; tasks = value; }
      else if (key === 'lex_members')    { window.members = value; members = value; }
      else if (key === 'lex_prazos')     { window.prazos = value; prazos = value; }
      else if (key === 'lex_activity')   { window.activity = value; activity = value; }
      else if (key === 'lex_shared_ac')  { window.sharedAC = value; sharedAC = value; }
      else if (key === 'lex_municipios') { window.municipios = value; }
      else if (key === 'lex_processos')      { processos = value; window.processos = value; }
      else if (key === 'lex_reset_requests') { localStorage.setItem('lex_reset_requests', JSON.stringify(value)); }
    });

    if (shouldRerender) {
      console.log('✅ Dados carregados do Supabase');
      if (window.currentPage && typeof window.renderPage === 'function') {
        window.renderPage(window.currentPage);
      }
    }
  } catch (e) {
    console.error('❌ Erro ao carregar dados:', e);
  }
}

// ─── Setup Real-time Listeners ───
export function _setupRealtime() {
  if (!_sb || !_sbReady) {
    console.error('❌ _setupRealtime: Supabase não está pronto');
    return;
  }
  if (_realtimeSetup) {
    console.log('⚠️ _setupRealtime: Já configurado, pulando');
    return;
  }

  console.log('🔄 Configurando real-time sync... Supabase cliente:', !!_sb);
  _realtimeSetup = true;

  const channel = _sb.channel('kausas-app-data');
  console.log('📡 Canal criado:', !!channel);

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
    console.log('📨 Evento realtime recebido:', payload);
      const newDataRow = payload.new;
      if (!newDataRow) {
        console.log('⚠️ Realtime: payload.new ausente', payload);
        return;
      }

      const key = newDataRow.key;
      const newData = newDataRow.data;
      console.log('📡 Realtime update:', key, '| Data:', newData ? `${Array.isArray(newData) ? newData.length : 'object'} items` : 'null');

      // Atualizar estado local e localStorage baseado na chave
      if (newData) {
        // Verificar se os dados realmente mudaram (evita re-renders desnecessários)
        const currentJson = JSON.stringify(key === 'lex_tasks' ? tasks :
                                         key === 'lex_members' ? members :
                                         key === 'lex_prazos' ? prazos :
                                         key === 'lex_activity' ? activity :
                                         key === 'lex_shared_ac' ? sharedAC :
                                         key === 'lex_processos' ? processos : []);
        const newJson = JSON.stringify(newData);

        if (currentJson !== newJson) {
          // Dados realmente mudaram
          try {
            localStorage.setItem(key, newJson);
          } catch {}

          // Atualizar variáveis globais (módulo + window)
          if (key === 'lex_tasks')           { tasks = newData; window.tasks = newData; }
          else if (key === 'lex_members')    { members = newData; window.members = newData; }
          else if (key === 'lex_prazos')     { prazos = newData; window.prazos = newData; }
          else if (key === 'lex_activity')   { activity = newData; window.activity = newData; }
          else if (key === 'lex_shared_ac')  { sharedAC = newData; window.sharedAC = newData; }
          else if (key === 'lex_municipios') { window.municipios = newData; }
          else if (key === 'lex_processos')      { processos = newData; window.processos = newData; }
          else if (key === 'lex_reset_requests') {
            localStorage.setItem('lex_reset_requests', JSON.stringify(newData));
            // Atualizar badge do sino em tempo real
            if (typeof window.updateNotifBadgeFromAlerts === 'function') window.updateNotifBadgeFromAlerts();
          }

          // Notificações desativadas - sync silencioso
          // (remover comentário abaixo para reativar notificações)
          /*
          const messages = {
            'lex_tasks': '📡 Tarefas sincronizadas',
            'lex_members': '📡 Membros sincronizados',
            'lex_prazos': '📡 Prazos sincronizados',
            'lex_activity': '📡 Atividades sincronizadas',
            'lex_shared_ac': '📡 Atividades compartilhadas sincronizadas',
          };

          if (messages[key]) {
            showNotification(messages[key], 'success');
          }
          */

          // Re-renderizar página se necessário (APENAS se nenhum modal está aberto)
          const hasOpenModal = document.querySelector('.modal-overlay.open') ||
                               document.querySelector('.modal-overlay[style*="display: flex"]');

          const pageToRender = window.currentPage || currentPage;
          if (!hasOpenModal && pageToRender && typeof window.renderPage === 'function') {
            console.log('🔄 Re-renderizando página:', pageToRender);
            window.renderPage(pageToRender);
          } else {
            console.log('⏭️ Re-render pulado - Modal aberto:', hasOpenModal);
          }
        }
      }

      console.log('✅ Real-time update processado:', key);
    })
    .subscribe((status) => {
      console.log('✅ Real-time subscribe status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('🔥 REALTIME ATIVO - Escutando mudanças!');
      }
    });
}

// ─── Test Functions (debug) ───
export function testSupabase() {
  if (!_sb || !_sbReady) {
    console.error('Supabase não está pronto');
    return;
  }
  console.log('✅ Supabase client disponível:', !!_sb);
  console.log('✅ Supabase ready:', _sbReady);
}

export function testRealtime() {
  if (!_sb || !_sbReady) {
    console.error('Supabase não está pronto');
    return;
  }
  console.log('🧪 Testando real-time sync...');
  // Salvar dados de teste
  const testData = { test: 'data', timestamp: new Date().toISOString() };
  _sbSave('test_realtime', testData);
}

// ─── Notificação (placeholder - será substituída) ───
function showNotification(msg, type) {
  // Será implementada em ui/notifications.js
  if (typeof window.showNotification === 'function') {
    window.showNotification(msg, type);
  } else {
    console.log('📢', msg);
  }
}

export { _sb, _sbReady };
