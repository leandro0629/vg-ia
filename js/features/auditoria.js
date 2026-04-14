// ============================================================
// AUDITORIA - AUDIT PAGE UI MODULE
// ============================================================

import { getAuditLog, getAuditStats, clearAuditLog, downloadAuditLog, formatAuditEntry } from '../core/audit.js';

// ─── State ───
let _currentFilter = 'todas';
let _currentSearch = '';
let _offset = 0;
const ITEMS_PER_PAGE = 25;

// ─── Main Render ───
export function renderAuditoria() {
  console.log('🕵️ Renderizando auditoria...');

  // Reset pagination
  _offset = 0;

  // Render stats
  _renderAuditStats();

  // Render table
  _renderAuditTable();

  // Show/hide clear button (only admin can see)
  const btnClear = document.getElementById('btnClearAudit');
  if (btnClear) {
    if (window.currentUser?.profile === 'admin') {
      btnClear.style.display = 'inline-block';
    } else {
      btnClear.style.display = 'none';
    }
  }
}

// ─── Render Stats Cards ───
function _renderAuditStats() {
  const statsContainer = document.getElementById('auditStats');
  if (!statsContainer) return;

  const logs = getAuditLog();
  const stats = getAuditStats();

  // Count actions today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = logs.filter(l => new Date(l.timestamp) >= today).length;

  // Count unique users
  const uniqueUsers = new Set(logs.map(l => l.userId)).size;

  // Last action time
  const lastAction = stats.lastAction ? new Date(stats.lastAction.timestamp).toLocaleString('pt-BR') : 'Nenhuma';

  const statsHTML = `
    <div class="stat-card">
      <div class="stat-label">Total de Ações</div>
      <div class="stat-value">${stats.totalActions}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Hoje</div>
      <div class="stat-value">${todayCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Usuários Ativos</div>
      <div class="stat-value">${uniqueUsers}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Última Ação</div>
      <div class="stat-value-small">${lastAction}</div>
    </div>
  `;

  statsContainer.innerHTML = statsHTML;
}

// ─── Render Audit Table ───
function _renderAuditTable() {
  const tbody = document.getElementById('auditBody');
  const emptyMsg = document.getElementById('auditEmpty');
  const loadMoreBtn = document.getElementById('auditLoadMore');

  if (!tbody) return;

  // Get filtered logs
  let logs = getAuditLog();

  // Apply category filter
  if (_currentFilter !== 'todas') {
    logs = logs.filter(l => l.category === _currentFilter);
  }

  // Apply search filter
  if (_currentSearch) {
    const q = _currentSearch.toLowerCase();
    logs = logs.filter(l =>
      l.description?.toLowerCase().includes(q) ||
      l.entityTitle?.toLowerCase().includes(q) ||
      l.userName?.toLowerCase().includes(q)
    );
  }

  // Show/hide empty message
  if (logs.length === 0) {
    tbody.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  // Paginate
  const paginatedLogs = logs.slice(0, _offset + ITEMS_PER_PAGE);
  tbody.innerHTML = _renderAuditRows(paginatedLogs);

  // Show/hide load more button
  if (loadMoreBtn) {
    if (paginatedLogs.length < logs.length) {
      loadMoreBtn.style.display = 'block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
}

// ─── Render Audit Rows ───
function _renderAuditRows(logs) {
  return logs.map(entry => {
    const formatted = formatAuditEntry(entry);
    const categoryEmoji = getCategoryEmoji(entry.category);

    return `
      <tr style="border-bottom: 1px solid var(--border-color)">
        <td style="padding: 12px 8px; font-size: 0.9rem; white-space: nowrap">
          <div>${formatted.displayDate}</div>
          <div style="color: var(--text-secondary); font-size: 0.85rem">${formatted.displayTime}</div>
        </td>
        <td style="padding: 12px 8px; font-size: 0.9rem">
          <div style="font-weight: 500">${entry.userName}</div>
          <div style="color: var(--text-secondary); font-size: 0.85rem">${getRoleLabel(entry.userRole)}</div>
        </td>
        <td style="padding: 12px 8px; font-size: 0.9rem">
          <span style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: ${entry.color}22;
            color: ${entry.color};
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
          ">
            ${categoryEmoji} ${formatted.categoryLabel}
          </span>
        </td>
        <td style="padding: 12px 8px; font-size: 0.9rem">
          <span style="color: var(--text-secondary)">${formatted.actionLabel}</span>
        </td>
        <td style="padding: 12px 8px; font-size: 0.9rem">
          ${entry.description}
          ${entry.entityTitle ? `<br><span style="color: var(--text-secondary)">• ${entry.entityTitle}</span>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

// ─── Filter Audit ───
export function filterAudit(category, btn) {
  _currentFilter = category;
  _offset = 0;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
  });
  if (btn) {
    btn.classList.add('active');
  }

  // Re-render table
  _renderAuditTable();
}

// ─── Search Audit ───
export function searchAudit(query) {
  _currentSearch = query;
  _offset = 0;

  // Re-render table
  _renderAuditTable();
}

// ─── Load More ───
export function loadMoreAudit() {
  _offset += ITEMS_PER_PAGE;
  _renderAuditTable();
}

// ─── Confirm Clear Audit ───
export function confirmClearAudit() {
  if (window.currentUser?.profile !== 'admin') {
    window.showNotification?.('Apenas admin pode limpar auditoria', 'error');
    return;
  }

  const confirmed = confirm('⚠️ Tem certeza que deseja limpar todo o log de auditoria? Esta ação não pode ser desfeita.');

  if (confirmed) {
    clearAuditLog();
    renderAuditoria();
    window.showNotification?.('Log de auditoria limpo', 'success');
  }
}

// ─── Helpers ───
function getCategoryEmoji(category) {
  const map = {
    tasks: '📋',
    prazos: '📅',
    members: '👤',
    municipios: '🏢',
    auth: '🔐',
    system: '⚙️',
  };
  return map[category] || '●';
}

function getRoleLabel(role) {
  const map = {
    admin: 'Admin',
    socio: 'Sócio-Gestor',
    advogado: 'Advogado(a)',
    estagiario: 'Estagiário(a)',
  };
  return map[role] || role;
}
