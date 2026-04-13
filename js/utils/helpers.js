// ============================================================
// HELPER FUNCTIONS
// ============================================================

import { ROLE_COLORS, LABEL_COLORS, PRIORITY_COLORS, STATUS_COLORS } from './constants.js';

export function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function roleLabel(role) {
  const map = {
    admin: 'Admin Geral',
    socio: 'Sócio-Gestor',
    gestor: 'Gestor',
    advogado: 'Advogado(a)',
    assistente: 'Assistente',
    estagiario: 'Estagiário(a)',
  };
  return map[role] || role;
}

export function getRoleColor(role) {
  return ROLE_COLORS[role] || '#5b8dee';
}

export function getLabelColor(label) {
  return LABEL_COLORS[label] || '#5b8dee';
}

export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || '#5b8dee';
}

export function getStatusInfo(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.todo;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Sem data';
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function getDaysLeft(dueDate) {
  if (!dueDate) return null;
  try {
    const due = new Date(dueDate + 'T12:00:00');
    const today = new Date();
    const diff = Math.ceil((due - today) / 86400000);
    return diff;
  } catch {
    return null;
  }
}

export function getDeadlineStatus(dueDate) {
  const daysLeft = getDaysLeft(dueDate);
  if (daysLeft === null) return null;
  if (daysLeft < 0) return 'overdue';
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  if (daysLeft <= 3) return 'soon';
  return 'upcoming';
}

export function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

export function mergeObjects(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      result[key] = source[key];
    }
  }
  return result;
}

export function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
