// ============================================================
// PROCESSOS - Feature Module
// ============================================================

import { save } from '../core/storage.js';
import { STORAGE_KEYS } from '../utils/constants.js';

// ─── State ───
let _filter = 'todos';
let _search = '';

// ─── Lookup tables ───
export const TIPOS_ACAO = [
  { value: 'HC',         label: 'Habeas Corpus (HC)' },
  { value: 'MS',         label: 'Mandado de Segurança (MS)' },
  { value: 'AP',         label: 'Ação Penal (AP)' },
  { value: 'AO',         label: 'Ação Ordinária' },
  { value: 'AI',         label: 'Agravo de Instrumento (AI)' },
  { value: 'ARE',        label: 'Agravo em RE (ARE)' },
  { value: 'RE',         label: 'Recurso Extraordinário (RE)' },
  { value: 'REsp',       label: 'Recurso Especial (REsp)' },
  { value: 'RHC',        label: 'Recurso em HC (RHC)' },
  { value: 'AC',         label: 'Apelação Cível (AC)' },
  { value: 'Execucao',   label: 'Execução' },
  { value: 'Inventario', label: 'Inventário' },
  { value: 'Trabalhista',label: 'Trabalhista' },
  { value: 'Outro',      label: 'Outro' },
];

export const FASES = [
  { value: 'pre_processo', label: 'Pré-processual' },
  { value: 'conhecimento', label: 'Conhecimento' },
  { value: 'recurso',      label: 'Recurso' },
  { value: 'execucao',     label: 'Execução' },
];

const STATUS_MAP = {
  ativo:     { color: '#4caf7d', label: 'Ativo' },
  suspenso:  { color: '#e09a3a', label: 'Suspenso' },
  arquivado: { color: '#6b7190', label: 'Arquivado' },
  encerrado: { color: '#e05c5c', label: 'Encerrado' },
};

// ─── Helpers ───
function esc(s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(s || '') : (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function _prazoHTML(dateStr, status) {
  if (status === 'encerrado' || status === 'arquivado') return '<span style="color:var(--text-secondary);font-size:0.8rem;">—</span>';
  if (!dateStr) return '<span style="color:var(--text-secondary);font-size:0.8rem;">Não definido</span>';
  const d = new Date(dateStr + 'T00:00:00');
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - hoje) / 86400000);
  let color = '#4caf7d', badgeColor = '#4caf7d', badgeText = `${diff}d`;
  if (diff < 0)       { color = '#e05c5c'; badgeColor = '#e05c5c'; badgeText = 'Vencido'; }
  else if (diff === 0){ color = '#e05c5c'; badgeColor = '#e05c5c'; badgeText = 'Hoje'; }
  else if (diff <= 3) { color = '#e05c5c'; badgeColor = '#e05c5c'; }
  else if (diff <= 7) { color = '#e09a3a'; badgeColor = '#e09a3a'; }
  return `<span style="font-size:0.82rem;font-weight:600;color:${color};">${d.toLocaleDateString('pt-BR')}</span>
    <span style="padding:2px 6px;background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}55;border-radius:20px;font-size:0.7rem;font-weight:700;margin-left:4px">${badgeText}</span>`;
}

function _statusBadge(status) {
  const s = STATUS_MAP[status] || STATUS_MAP.ativo;
  return `<span style="padding:3px 10px;background:${s.color}22;color:${s.color};border:1px solid ${s.color}55;border-radius:20px;font-size:0.78rem;font-weight:700;">${s.label}</span>`;
}

// ─── Filter logic ───
function _getFiltered() {
  let list = [...(window.processos || [])];
  if (_filter !== 'todos') list = list.filter(p => p.status === _filter);
  if (_search.trim()) {
    const q = _search.trim().toLowerCase();
    list = list.filter(p =>
      (p.numero || '').toLowerCase().includes(q) ||
      (p.autor  || '').toLowerCase().includes(q) ||
      (p.reu    || '').toLowerCase().includes(q) ||
      (p.tribunal|| '').toLowerCase().includes(q) ||
      (p.vara   || '').toLowerCase().includes(q) ||
      (p.tipo   || '').toLowerCase().includes(q)
    );
  }
  // Sort: vencidos → prazo mais próximo → sem prazo
  list.sort((a, b) => {
    if (!a.proximoPrazo && !b.proximoPrazo) return 0;
    if (!a.proximoPrazo) return 1;
    if (!b.proximoPrazo) return -1;
    return new Date(a.proximoPrazo) - new Date(b.proximoPrazo);
  });
  return list;
}

// ─── Main Render ───
export function renderProcessos() {
  // Garantir que window.processos está carregado — fallback para localStorage
  // (resolve timing issue: routing chama renderProcessos antes do _sbLoadAll terminar)
  if (!window.processos || !window.processos.length) {
    try {
      const raw = localStorage.getItem('lex_processos');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) window.processos = parsed;
      }
    } catch {}
  }
  _renderStats();
  _renderTable();
}

function _renderStats() {
  const el = document.getElementById('processosStats');
  if (!el) return;
  const list = window.processos || [];
  const total     = list.length;
  const ativos    = list.filter(p => p.status === 'ativo').length;
  const encerr    = list.filter(p => p.status === 'encerrado' || p.status === 'arquivado').length;
  const hoje      = new Date(); hoje.setHours(0,0,0,0);
  const em7       = new Date(hoje); em7.setDate(hoje.getDate() + 7);
  const urgentes  = list.filter(p => {
    if (!p.proximoPrazo || p.status === 'encerrado' || p.status === 'arquivado') return false;
    const d = new Date(p.proximoPrazo + 'T00:00:00');
    return d <= em7;
  }).length;

  el.innerHTML = `
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Ativos</div><div class="stat-value" style="color:var(--primary)">${ativos}</div></div>
    <div class="stat-card"><div class="stat-label">Prazo em 7 dias</div><div class="stat-value" style="color:${urgentes > 0 ? '#e09a3a' : 'var(--text-primary)'}">${urgentes}</div></div>
    <div class="stat-card"><div class="stat-label">Encerr./Arq.</div><div class="stat-value" style="color:var(--text-secondary)">${encerr}</div></div>
  `;
}

function _renderTable() {
  const tbody = document.getElementById('processosBody');
  const empty = document.getElementById('processosEmpty');
  if (!tbody) return;
  const list = _getFiltered();
  if (!list.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  const canManage = ['admin','socio','advogado'].includes(window.currentUser?.profile);
  tbody.innerHTML = list.map(p => {
    const resp    = (window.members || []).find(m => m.id === p.responsavelId);
    const initials = resp ? resp.name.split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase() : '?';
    const tipoLbl = TIPOS_ACAO.find(t => t.value === p.tipo)?.label || p.tipo || '—';
    const faseLbl = FASES.find(f => f.value === p.fase)?.label || p.fase || '—';
    return `<tr style="cursor:pointer" onclick="openProcessoDetail(${p.id})">
      <td>
        <div style="font-family:monospace;font-size:0.82rem;font-weight:700;color:var(--text-primary);">${esc(p.numero) || '—'}</div>
        ${p.dataDistribuicao ? `<div style="font-size:0.7rem;color:var(--text-secondary);margin-top:2px;">Dist. ${new Date(p.dataDistribuicao+'T00:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
      </td>
      <td>
        <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">${esc(p.autor) || '—'}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;">vs. ${esc(p.reu) || '—'}</div>
      </td>
      <td>
        <div style="font-size:0.82rem;color:var(--text-primary);">${esc(p.tribunal) || '—'}</div>
        ${p.vara ? `<div style="font-size:0.7rem;color:var(--text-secondary);margin-top:2px;">${esc(p.vara)}</div>` : ''}
      </td>
      <td>
        <span style="padding:2px 8px;background:var(--accent);color:var(--text-secondary);border-radius:6px;font-size:0.78rem;font-weight:600;">${p.tipo || '—'}</span>
        <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:3px;">${faseLbl}</div>
      </td>
      <td>
        ${p.ultimaMovimentacao
          ? `<div style="font-size:0.82rem;color:var(--text-primary);">${new Date(p.ultimaMovimentacao+'T00:00:00').toLocaleDateString('pt-BR')}</div>
             ${p.descMovimentacao ? `<div style="font-size:0.7rem;color:var(--text-secondary);margin-top:2px;">${esc(p.descMovimentacao)}</div>` : ''}`
          : '<span style="color:var(--text-secondary);font-size:0.82rem;">—</span>'}
      </td>
      <td>
        ${resp
          ? `<div style="display:flex;align-items:center;gap:6px;">
              <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#d97706);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#000;font-weight:800;font-size:0.7rem;">${initials}</div>
              <span style="font-size:0.82rem;color:var(--text-primary);">${esc(resp.name)}</span>
             </div>`
          : '<span style="color:var(--text-secondary);font-size:0.82rem;">—</span>'}
      </td>
      <td>${_prazoHTML(p.proximoPrazo, p.status)}</td>
      <td>${_statusBadge(p.status || 'ativo')}</td>
      <td onclick="event.stopPropagation()">
        <div style="display:flex;gap:4px;">
          <button class="btn btn-ghost btn-xs" title="Editar" onclick="openProcessoModal(${p.id})">✏️</button>
          ${canManage ? `<button class="btn btn-ghost btn-xs" title="Excluir" style="color:#e05c5c" onclick="confirmDeleteProcesso(${p.id})">🗑</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── Filter & Search ───
export function filterProcessos(status, btn) {
  _filter = status;
  document.querySelectorAll('#processosFilters .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _renderTable();
  _renderStats();
}

export function searchProcessos(query) {
  _search = query;
  _renderTable();
}

// ─── Modal ───
function _populateModal() {
  const respSel = document.getElementById('processoResponsavel');
  if (respSel) {
    respSel.innerHTML = '<option value="">Selecionar responsável...</option>' +
      (window.members || []).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  }
  const munSel = document.getElementById('processoMunicipio');
  if (munSel) {
    munSel.innerHTML = '<option value="">Selecionar município...</option>' +
      (window.municipios || []).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  }
}

function _resetForm() {
  ['processoNumero','processoAutor','processoReu','processoTribunal','processoVara',
   'processoDataDistribuicao','processoUltimaMovimentacao','processoDescMovimentacao',
   'processoProximoPrazo','processoValorCausa','processoObservacoes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['processoTipo','processoFase'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const st = document.getElementById('processoStatus'); if (st) st.value = 'ativo';
  const ei = document.getElementById('processoEditId'); if (ei) ei.value = '';
}

export function openProcessoModal(id = null) {
  const modal = document.getElementById('modalProcesso');
  if (!modal) return;
  _populateModal();
  _resetForm();
  const titleEl = document.getElementById('processoModalTitle');
  if (id) {
    const p = (window.processos || []).find(x => x.id === id);
    if (!p) return;
    if (titleEl) titleEl.textContent = 'Editar Processo';
    document.getElementById('processoEditId').value = id;
    document.getElementById('processoNumero').value = p.numero || '';
    document.getElementById('processoAutor').value  = p.autor  || '';
    document.getElementById('processoReu').value    = p.reu    || '';
    document.getElementById('processoTribunal').value = p.tribunal || '';
    document.getElementById('processoVara').value   = p.vara   || '';
    document.getElementById('processoTipo').value   = p.tipo   || '';
    document.getElementById('processoFase').value   = p.fase   || '';
    document.getElementById('processoStatus').value = p.status || 'ativo';
    const rs = document.getElementById('processoResponsavel'); if (rs) rs.value = p.responsavelId || '';
    const ms = document.getElementById('processoMunicipio');   if (ms) ms.value = p.municipioId   || '';
    document.getElementById('processoDataDistribuicao').value  = p.dataDistribuicao  || '';
    document.getElementById('processoUltimaMovimentacao').value= p.ultimaMovimentacao|| '';
    document.getElementById('processoDescMovimentacao').value  = p.descMovimentacao  || '';
    document.getElementById('processoProximoPrazo').value      = p.proximoPrazo      || '';
    document.getElementById('processoValorCausa').value        = p.valorCausa        || '';
    document.getElementById('processoObservacoes').value       = p.observacoes       || '';
  } else {
    if (titleEl) titleEl.textContent = 'Novo Processo';
  }
  modal.style.display = 'flex';
  modal.classList.add('open');
}

export function openProcessoDetail(id) {
  openProcessoModal(id);
}

// ─── Save ───
export function saveProcesso() {
  const numero = (document.getElementById('processoNumero')?.value || '').trim();
  if (!numero) { alert('Informe o número do processo'); return; }
  if (!window.processos) window.processos = [];
  const editId = parseInt(document.getElementById('processoEditId')?.value) || null;
  const data = {
    numero,
    autor:              (document.getElementById('processoAutor')?.value || '').trim(),
    reu:                (document.getElementById('processoReu')?.value   || '').trim(),
    tribunal:           (document.getElementById('processoTribunal')?.value || '').trim(),
    vara:               (document.getElementById('processoVara')?.value  || '').trim(),
    tipo:               document.getElementById('processoTipo')?.value   || '',
    fase:               document.getElementById('processoFase')?.value   || '',
    status:             document.getElementById('processoStatus')?.value || 'ativo',
    responsavelId:      parseInt(document.getElementById('processoResponsavel')?.value) || null,
    municipioId:        parseInt(document.getElementById('processoMunicipio')?.value)   || null,
    dataDistribuicao:   document.getElementById('processoDataDistribuicao')?.value  || '',
    ultimaMovimentacao: document.getElementById('processoUltimaMovimentacao')?.value || '',
    descMovimentacao:   (document.getElementById('processoDescMovimentacao')?.value  || '').trim(),
    proximoPrazo:       document.getElementById('processoProximoPrazo')?.value       || '',
    valorCausa:         (document.getElementById('processoValorCausa')?.value        || '').trim(),
    observacoes:        (document.getElementById('processoObservacoes')?.value       || '').trim(),
  };
  if (editId) {
    const idx = window.processos.findIndex(x => x.id === editId);
    if (idx > -1) window.processos[idx] = { ...window.processos[idx], ...data };
  } else {
    window.processos.push({ id: Date.now(), ...data, created: new Date().toISOString() });
  }
  save(STORAGE_KEYS.processos, window.processos);
  const modal = document.getElementById('modalProcesso');
  if (modal) { modal.style.display = 'none'; modal.classList.remove('open'); }
  renderProcessos();
}

// ─── Delete ───
export function confirmDeleteProcesso(id) {
  const p = (window.processos || []).find(x => x.id === id);
  if (!p) return;
  openDeleteProcessoModal(id, p);
}

export function openDeleteProcessoModal(id, processo) {
  const modal = document.getElementById('modalDeleteProcesso');
  if (!modal) return;

  // Preencher informações do processo
  const tipoLbl = TIPOS_ACAO.find(t => t.value === processo.tipo)?.label || processo.tipo || '—';
  const statusLbl = STATUS_MAP[processo.status]?.label || 'Ativo';

  document.getElementById('deleteProcessoNumber').textContent = esc(processo.numero) || '—';
  document.getElementById('deleteProcessoAutor').textContent = esc(processo.autor) || '—';
  document.getElementById('deleteProcessoTipo').textContent = tipoLbl;
  document.getElementById('deleteProcessoStatus').textContent = statusLbl;
  document.getElementById('deleteProcessoTribunal').textContent = esc(processo.tribunal) || '—';

  // Botão de confirmar deleção
  document.getElementById('btnConfirmDeleteProcesso').onclick = function() {
    deleteProcessoFinal(id);
  };

  // Abrir modal
  modal.style.display = 'flex';
  modal.classList.add('open');
}

function deleteProcessoFinal(id) {
  window.processos = (window.processos || []).filter(x => x.id !== id);
  save(STORAGE_KEYS.processos, window.processos);

  const modal = document.getElementById('modalDeleteProcesso');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }

  window.showNotification?.('Processo deletado com sucesso', 'success');
  renderProcessos();
}
