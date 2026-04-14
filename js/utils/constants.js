// ============================================================
// CONSTANTES GLOBAIS - KAUSAS
// ============================================================

// Auth & Storage Keys
export const AUTH_KEY = 'lex_session';
export const USERS_KEY = 'lex_users';

export const STORAGE_KEYS = {
  tasks: 'lex_tasks',
  members: 'lex_members',
  prazos: 'lex_prazos',
  activity: 'lex_activity',
  sharedAC: 'lex_shared_ac',
  municipios: 'lex_municipios',
  users: 'lex_users',
  dailyChecklist: 'lex_daily_checklist',
  processos: 'lex_processos',
};

// Pages
export const ALL_PAGES = [
  'dashboard',
  'equipe',
  'missoes',
  'atividades',
  'municipios',
  'usuarios',
  'estagiarios',
  'relatorios',
  'calendario',
];

// Permissions Matrix
export const PERMISSIONS = {
  admin: {
    pages: ['dashboard', 'equipe', 'missoes', 'atividades', 'municipios', 'processos', 'usuarios', 'estagiarios', 'relatorios', 'calendario', 'configuracoes', 'auditoria'],
    canAddMembers: true,
    canDeleteMembers: true,
    canDeleteTasks: true,
    canSeeAllTasks: true,
    canAddPrazos: true,
    canDelegate: true,
    canManageUsers: true,
    label: 'Admin Geral',
    pillClass: 'role-admin',
  },
  socio: {
    pages: ['dashboard', 'equipe', 'missoes', 'atividades', 'municipios', 'processos', 'usuarios', 'estagiarios', 'relatorios', 'calendario', 'configuracoes', 'auditoria'],
    canAddMembers: true,
    canDeleteMembers: true,
    canDeleteTasks: true,
    canSeeAllTasks: true,
    canAddPrazos: true,
    canDelegate: true,
    canManageUsers: true,
    label: 'Sócio-Gestor',
    pillClass: 'role-socio',
  },
  advogado: {
    pages: ['dashboard', 'equipe', 'missoes', 'atividades', 'municipios', 'processos', 'relatorios', 'calendario', 'configuracoes'],
    canAddMembers: false,
    canDeleteMembers: false,
    canDeleteTasks: true,
    canSeeAllTasks: true,
    canAddPrazos: true,
    canDelegate: true,
    canManageUsers: false,
    label: 'Advogado(a)',
    pillClass: 'role-advogado',
  },
  estagiario: {
    pages: ['dashboard', 'equipe', 'missoes', 'atividades', 'municipios', 'processos', 'relatorios', 'calendario', 'configuracoes'],
    canAddMembers: false,
    canDeleteMembers: false,
    canDeleteTasks: false,
    canSeeAllTasks: true,
    canAddPrazos: false,
    canDelegate: false,
    canManageUsers: false,
    label: 'Estagiário(a)',
    pillClass: 'role-estagiario',
  },
};

// Kanban Columns
export const KANBAN_COLS = [
  { id: 'todo', label: 'A Fazer', emoji: '○' },
  { id: 'doing', label: 'Em Andamento', emoji: '▶' },
  { id: 'review', label: 'Em Revisão', emoji: '◎' },
  { id: 'done', label: 'Concluído', emoji: '✓' },
];

// Session Timeout
export const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas
export const SESSION_WARNING_MS = 1 * 60 * 1000; // aviso 1 min antes

// Supabase Config
export const SUPABASE_URL = 'https://eelhcdhefkkjvfirmwmi.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlbGhjZGhlZmtranZmaXJtd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTM4NDEsImV4cCI6MjA5MDU4OTg0MX0.SRSUBguizunIqmbrFIT2DfYW3aQfxaYcuBS-NNMT86c';

// Teams
export const TEAMS = [
  { id: 1, name: 'Equipe Fogo', emoji: '🔥', color: '#e05c5c' },
  { id: 2, name: 'Equipe Água', emoji: '💧', color: '#5b8dee' },
  { id: 3, name: 'Equipe Terra', emoji: '🌿', color: '#4caf7d' },
  { id: 4, name: 'Equipe Vento', emoji: '💨', color: '#e0a44a' },
];

// Role Colors
export const ROLE_COLORS = {
  socio: '#f59e0b',
  gestor: '#8b5cf6',
  advogado: '#3b82f6',
  assistente: '#10b981',
  estagiario: '#64748b',
};

// Label Colors
export const LABEL_COLORS = {
  'Prazo': '#e05c5c',
  'Audiência': '#ff6b6b',
  'Petição': '#4caf7d',
  'Contrato': '#5b8dee',
  'Recurso': '#9c27b0',
  'Consultoria': '#ffa94d',
  'Diligência': '#e09a3a',
  'Intimação': '#74b9ff',
};

// Priority Colors
export const PRIORITY_COLORS = {
  urgente: '#e05c5c',
  normal: '#5b8dee',
  baixa: '#4caf7d',
};

// Status Colors for Kanban
export const STATUS_COLORS = {
  todo: { color: '#6b7190', bg: '#6b719022', border: '#6b719055', icon: '○', label: 'A Fazer' },
  doing: { color: '#5b8dee', bg: '#5b8dee22', border: '#5b8dee55', icon: '▶', label: 'Em Andamento' },
  review: { color: '#e0a44a', bg: '#e0a44a22', border: '#e0a44a55', icon: '◎', label: 'Em Revisão' },
  done: { color: '#4caf7d', bg: '#4caf7d22', border: '#4caf7d55', icon: '✓', label: 'Concluído' },
};
