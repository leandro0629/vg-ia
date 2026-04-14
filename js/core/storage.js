// ============================================================
// STORAGE & PERSISTENCE MODULE
// ============================================================

import { STORAGE_KEYS } from '../utils/constants.js';

// Supabase reference (será injetado por supabase.js)
export let _sb = null;
export let _sbReady = false;

export function setSBReference(sb, ready) {
  _sb = sb;
  _sbReady = ready;
}

// ─── localStorage Utilities ───
export function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

export function save(key, data) {
  try {
    const now = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(key + '_updated_at', now);
    console.log(`[storage.save] Salvo em localStorage: ${key}`);
  } catch (e) {
    console.error(`[storage.save] Erro ao salvar em localStorage: ${key}`, e);
  }
  // Sincronizar com Supabase se disponível
  if (typeof window._sbSave === 'function') {
    console.log(`[storage.save] Enviando para Supabase: ${key}`);
    window._sbSave(key, data);
  } else {
    console.log(`[storage.save] ⚠️ _sbSave não disponível`);
  }
}

// ─── Attachments (localStorage) ───
export function loadAttachments() {
  try {
    return JSON.parse(localStorage.getItem('lex_attachments')) || {};
  } catch {
    return {};
  }
}

export function saveAttachment(id, data) {
  const attachments = loadAttachments();
  attachments[id] = data;
  localStorage.setItem('lex_attachments', JSON.stringify(attachments));
}

export function deleteAttachment(id) {
  const attachments = loadAttachments();
  delete attachments[id];
  localStorage.setItem('lex_attachments', JSON.stringify(attachments));
}

export function getAttachmentData(id) {
  const attachments = loadAttachments();
  return attachments[id] || null;
}

export function clearAllAttachments() {
  localStorage.removeItem('lex_attachments');
}

// ─── Supabase Sync ───
export async function _sbSave(key, value) {
  if (!_sbReady) return;
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

// ─── Initialize Storage (carregar dados na inicialização) ───
export function initializeStorage() {
  // Carrega todos os dados do localStorage
  const state = {
    tasks: load(STORAGE_KEYS.tasks),
    members: load(STORAGE_KEYS.members),
    prazos: load(STORAGE_KEYS.prazos),
    activity: load(STORAGE_KEYS.activity),
    sharedAC: load(STORAGE_KEYS.sharedAC),
    municipios: load(STORAGE_KEYS.municipios),
    processos: load(STORAGE_KEYS.processos),
  };
  return state;
}
