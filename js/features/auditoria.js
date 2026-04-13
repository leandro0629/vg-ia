// ============================================================
// AUDITORIA FEATURE - INTERFACE VISUAL
// ============================================================

let _currentFilter = 'todas';
let _currentSearch = '';
let _offset = 0;
const _pageSize = 25;

/**
 * Renderiza a aba de auditoria (chamado por renderPage)
 */
export function renderAuditoria() {
  _offset = 0;
  _currentFilter = 'todas';
  _currentSearch = '';

  // Limpar estado dos filtros
  document.querySelectorAll('#auditFilters .filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('#auditFilters .filter-btn:first-child')?.classList.add('active');

  const searchInput = document.getElementById('auditSearch');
  if (searchInput) searchInput.value = '';

  // Mostrar/esconder botão "Limpar" apenas para admin
  const btnClear = document.getElementById('btnClearAudit');
  if (btnClear) {
    btnClear.style.display = window.currentUser?.profile === 'admin' ? '' : 'none';
  }

  _updateAuditView();
}

/**
 * Filtra por categoria
 */
export function filterAudit(category, btn) {
  _currentFilter = category;
  _offset = 0;

  // Atualizar estado dos botões
  document.querySelectorAll('#auditFilters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  _updateAuditView();
}

/**
 * Busca por texto
 */
export function searchAudit(query) {
  _currentSearch = query.toLowerCase();
  _offset = 0;
  _updateAuditView();
}

/**
 * Carregar mais (paginação)
 */
export function loadMoreAudit() {
  _offset += _pageSize;
  _updateAuditView();
}

/**
 * Confirmar e limpar log (apenas admin)
 */
export function confirmClearAudit() {
  if (window.currentUser?.profile !== 'admin') {
    alert('Apenas admin pode limpar o log');
    return;
  }

  if (!confirm('⚠️ Você está prestes a limpar TODO o histórico de auditoria. Isso não pode ser desfeito.\n\nTem certeza?')) {
    return;
  }

  if (typeof window.clearAuditLog === 'function') {
    window.clearAuditLog();
    alert('✅ Log de auditoria limpo');
    _updateAuditView();
  }
}

// ─── Internal Functions ───

/**
 * Atualiza a view inteira (stats + tabela)
 */
function _updateAuditView() {
  const allLogs = window.getAuditLog ? window.getAuditLog() : [];

  // Aplicar filtros
  let filtered = allLogs;

  // Filtro por categoria
  if (_currentFilter !== 'todas') {
    filtered = filtered.filter(log => log.category === _currentFilter);
  }

  // Filtro por busca
  if (_currentSearch) {
    filtered = filtered.filter(log => {
      const query = _currentSearch;
      return (
        log.userName?.toLowerCase().includes(query) ||
        log.description?.toLowerCase().includes(query) ||
        log.entityTitle?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query)
      );
    });
  }

  // Atualizar stats
  _renderAuditStats(allLogs);

  // Atualizar tabela com paginação
  const paginated = filtered.slice(_offset, _offset + _pageSize);
  _renderAuditTable(paginated, filtered.length);
}

/**
 * Renderiza os 4 cards de estatísticas
 */
function _renderAuditStats(allLogs) {
  const stats = window.getAuditStats ? window.getAuditStats() : {};

  // Logs de hoje
  const today = new Date().toISOString().split('T')[0];
  const todayCount = allLogs.filter(log => log.timestamp.startsWith(today)).length;

  // Usuários únicos
  const uniqueUsers = new Set(allLogs.map(log => log.userId)).size;

  const statsHtml = `
    <div class="card" style="padding:16px">
      <div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:8px">📊 Total de Ações</div>
      <div style="font-size:1.8rem;font-weight:600;color:var(--text-primary)">${stats.totalActions || 0}</div>
    </div>
    <div class="card" style="padding:16px">
      <div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:8px">📅 Hoje</div>
      <div style="font-size:1.8rem;font-weight:600;color:var(--text-primary)">${todayCount}</div>
    </div>
    <div class="card" style="padding:16px">
      <div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:8px">👥 Usuários Ativos</div>
      <div style="font-size:1.8rem;font-weight:600;color:var(--text-primary)">${uniqueUsers}</div>
    </div>
    <div class="card" style="padding:16px">
      <div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:8px">⏱️ Última Ação</div>
      <div style="font-size:.9rem;font-weight:500;color:var(--text-primary)">${
        stats.lastAction ? _formatTime(stats.lastAction.timestamp) : '—'
      }</div>
    </div>
  `;

  const statsEl = document.getElementById('auditStats');
  if (statsEl) statsEl.innerHTML = statsHtml;
}

/**
 * Renderiza a tabela com logs
 */
function _renderAuditTable(logs, totalFiltered) {
  const tbody = document.getElementById('auditBody');
  const emptyEl = document.getElementById('auditEmpty');
  const loadMoreEl = document.getElementById('auditLoadMore');

  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    if (loadMoreEl) loadMoreEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  // Renderizar rows
  const html = logs
    .map(log => {
      const formatted = window.formatAuditEntry ? window.formatAuditEntry(log) : log;
      const dotColor = log.color || '#5b8dee';

      return `
        <tr style="border-bottom:1px solid var(--border);hover-background:var(--bg-secondary)">
          <td style="font-size:.85rem">${formatted.displayDateTime || '—'}</td>
          <td>
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dotColor};margin-right:6px"></span>
            ${log.userName || '—'}
          </td>
          <td>${formatted.categoryLabel || log.category || '—'}</td>
          <td>${formatted.actionLabel || log.action || '—'}</td>
          <td style="max-width:250px;word-break:break-word">${log.description || '—'}</td>
        </tr>
      `;
    })
    .join('');

  tbody.innerHTML = html;

  // Mostrar botão "Carregar mais" se há mais itens
  if (loadMoreEl) {
    const hasMore = _offset + _pageSize < totalFiltered;
    loadMoreEl.style.display = hasMore ? 'block' : 'none';
  }
}

/**
 * Formata timestamp para exibição legível
 */
function _formatTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
