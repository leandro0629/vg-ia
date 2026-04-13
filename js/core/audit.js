// ============================================================
// AUDIT & LOGGING MODULE
// ============================================================

const AUDIT_STORAGE_KEY = 'lex_audit';
const MAX_AUDIT_ENTRIES = 500;

// ─── Log Action ───
export function logAction(params) {
  const {
    action,           // ex: 'task.create', 'task.delete'
    category,         // ex: 'tasks', 'prazos', 'members'
    description,      // ex: 'Tarefa "Petição ao TRF" criada'
    entityId,         // ID do item afetado (taskId, prazoId, etc)
    entityTitle,      // Nome/título do item
    color = '#5b8dee' // cor para timeline
  } = params;

  if (!window.currentUser) {
    console.warn('⚠️ Nenhum usuário logado para auditoria');
    return null;
  }

  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId: window.currentUser.id,
    userName: window.currentUser.name,
    userRole: window.currentUser.profile,
    action,
    category,
    description,
    entityId,
    entityTitle,
    color,
  };

  // Salvar localmente
  const logs = getAuditLog();
  logs.unshift(entry); // Adiciona no topo
  if (logs.length > MAX_AUDIT_ENTRIES) {
    logs.pop(); // Remove o mais antigo se exceder limite
  }

  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('❌ Erro ao salvar auditoria:', e);
  }

  // Sync com Supabase se disponível
  if (typeof window._sbSave === 'function') {
    window._sbSave(AUDIT_STORAGE_KEY, logs).catch((e) => {
      console.warn('⚠️ Sync auditoria com Supabase falhou:', e);
    });
  }

  console.log('📋 Ação registrada:', action, description);
  return entry;
}

// ─── Get Audit Log ───
export function getAuditLog(filters = {}) {
  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    return applyAuditFilters(logs, filters);
  } catch {
    return [];
  }
}

// ─── Apply Filters ───
function applyAuditFilters(logs, filters) {
  let result = [...logs];

  // Filtrar por usuário
  if (filters.userId) {
    result = result.filter((l) => l.userId === filters.userId);
  }

  // Filtrar por categoria
  if (filters.category) {
    result = result.filter((l) => l.category === filters.category);
  }

  // Filtrar por action
  if (filters.action) {
    result = result.filter((l) => l.action === filters.action);
  }

  // Filtrar por data (fromDate até toDate)
  if (filters.fromDate) {
    const from = new Date(filters.fromDate).getTime();
    result = result.filter((l) => new Date(l.timestamp).getTime() >= from);
  }

  if (filters.toDate) {
    const to = new Date(filters.toDate).getTime();
    result = result.filter((l) => new Date(l.timestamp).getTime() <= to);
  }

  // Busca por texto
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.description?.toLowerCase().includes(q) ||
        l.entityTitle?.toLowerCase().includes(q) ||
        l.userName?.toLowerCase().includes(q)
    );
  }

  // Limitar resultados
  const limit = filters.limit || 100;
  return result.slice(0, limit);
}

// ─── Clear Audit Log (apenas admin) ───
export function clearAuditLog() {
  if (window.currentUser?.profile !== 'admin') {
    console.warn('❌ Apenas admin pode limpar auditoria');
    return false;
  }

  logAction({
    action: 'audit.clear',
    category: 'system',
    description: 'Log de auditoria limpo',
    color: '#e05c5c',
  });

  localStorage.removeItem(AUDIT_STORAGE_KEY);
  return true;
}

// ─── Export Audit Log ───
export function exportAuditLog(format = 'json') {
  const logs = getAuditLog();

  if (format === 'csv') {
    let csv = 'Data,Hora,Usuário,Ação,Categoria,Descrição,Item ID,Item Nome\n';
    logs.forEach((l) => {
      const date = new Date(l.timestamp);
      const dateStr = date.toLocaleDateString('pt-BR');
      const timeStr = date.toLocaleTimeString('pt-BR');
      csv += `${dateStr},${timeStr},"${l.userName}","${l.action}","${l.category}","${l.description}","${l.entityId || ''}","${l.entityTitle || ''}"\n`;
    });
    return csv;
  } else if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  return null;
}

// ─── Download Audit Log ───
export function downloadAuditLog(format = 'csv') {
  const content = exportAuditLog(format);
  const ext = format === 'csv' ? 'csv' : 'json';
  const filename = `auditoria_${new Date().toISOString().split('T')[0]}.${ext}`;

  const blob = new Blob([content], { type: `text/${ext}; charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logAction({
    action: 'audit.export',
    category: 'system',
    description: `Auditoria exportada em ${format.toUpperCase()}`,
    color: '#4caf7d',
  });
}

// ─── Get Statistics ───
export function getAuditStats() {
  const logs = getAuditLog();
  const stats = {
    totalActions: logs.length,
    actionsByCategory: {},
    actionsByUser: {},
    actionsByType: {},
    lastAction: logs[0] || null,
  };

  logs.forEach((l) => {
    stats.actionsByCategory[l.category] = (stats.actionsByCategory[l.category] || 0) + 1;
    stats.actionsByUser[l.userName] = (stats.actionsByUser[l.userName] || 0) + 1;
    stats.actionsByType[l.action] = (stats.actionsByType[l.action] || 0) + 1;
  });

  return stats;
}

// ─── Format Log Entry for Display ───
export function formatAuditEntry(entry) {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    ...entry,
    displayDate: dateStr,
    displayTime: timeStr,
    displayDateTime: `${dateStr} ${timeStr}`,
    categoryLabel: getCategoryLabel(entry.category),
    actionLabel: getActionLabel(entry.action),
  };
}

// ─── Labels ───
function getCategoryLabel(category) {
  const map = {
    tasks: '📋 Tarefas',
    prazos: '📅 Prazos',
    members: '👤 Membros',
    municipios: '🏢 Contratos',
    auth: '🔐 Autenticação',
    system: '⚙️ Sistema',
  };
  return map[category] || category;
}

function getActionLabel(action) {
  const [category, verb] = action.split('.');
  const map = {
    create: 'Criou',
    edit: 'Editou',
    delete: 'Deletou',
    move: 'Moveu',
    complete: 'Concluiu',
    reopen: 'Reabre',
    assign: 'Atribuiu',
    clear: 'Limpou',
    export: 'Exportou',
    login: 'Login',
    logout: 'Logout',
  };
  return map[verb] || action;
}
