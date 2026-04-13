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
let currentUser = null;
let currentPage = null;

export function setSBState(state) {
  ({ tasks, members, prazos, activity, sharedAC, currentUser, currentPage } = state);
}

// ─── Initialize Supabase Client ───
export async function initSupabase() {
  try {
    if (SUPABASE_URL && window.supabase) {
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      _sbReady = true;
      setSBReference(_sb, _sbReady);
      console.log('✅ Supabase inicializado com real-time sync ativado!');
      return _sb;
    } else {
      console.warn('⚠️ Supabase não configurado - usando localStorage apenas');
      return null;
    }
  } catch (e) {
    console.warn('❌ Supabase init error:', e);
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

// ─── Setup Real-time Listeners ───
export function _setupRealtime() {
  if (!_sb || !_sbReady) return;
  if (_realtimeSetup) return; // Previne duplicação

  console.log('🔄 Configurando real-time sync...');
  _realtimeSetup = true;

  _sb.channel('kausas-app-data')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
      const { key, new: newData } = payload;

      // Atualizar estado local e localStorage baseado na chave
      if (newData && newData.data) {
        // Verificar se os dados realmente mudaram (evita re-renders desnecessários)
        const currentJson = JSON.stringify(key === 'lex_tasks' ? tasks :
                                         key === 'lex_members' ? members :
                                         key === 'lex_prazos' ? prazos :
                                         key === 'lex_activity' ? activity :
                                         key === 'lex_shared_ac' ? sharedAC : []);
        const newJson = JSON.stringify(newData.data);

        if (currentJson !== newJson) {
          // Dados realmente mudaram
          try {
            localStorage.setItem(key, newJson);
          } catch {}

          // Atualizar variáveis globais
          if (key === 'lex_tasks') tasks = newData.data;
          else if (key === 'lex_members') members = newData.data;
          else if (key === 'lex_prazos') prazos = newData.data;
          else if (key === 'lex_activity') activity = newData.data;
          else if (key === 'lex_shared_ac') sharedAC = newData.data;

          // Notificar usuário
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

          // Re-renderizar página se necessário
          if (currentPage && typeof window.renderPage === 'function') {
            window.renderPage(currentPage);
          }
        }
      }

      console.log('✅ Real-time update recebido:', key);
    })
    .subscribe((status) => {
      console.log('✅ Real-time sync ativado!');
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
