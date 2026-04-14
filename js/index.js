// ============================================================
// KAUSAS - MAIN ENTRY POINT
// ============================================================

// ─── Core Modules ───
import { AUTH_KEY, USERS_KEY, STORAGE_KEYS, PERMISSIONS } from './utils/constants.js';
import { load, save, loadAttachments, saveAttachment, deleteAttachment, getAttachmentData, clearAllAttachments, initializeStorage } from './core/storage.js';
import { initSupabase, _setupRealtime, testSupabase, testRealtime, _sbLoadAll, _sbSave } from './core/supabase.js';
import {
  currentUser as cu,
  setCurrentUser,
  getSession,
  setSession,
  clearSession,
  loadUsers,
  saveUsers,
  initializeUsers,
  quickLogin,
  doLogout,
  startInactivityWatch,
  canDo,
  canSeePage,
  changePassword,
  requestPasswordReset,
  getPendingResetRequests,
  adminResetPassword,
  signupOffice,
  VG_OFFICE_ID,
} from './core/auth.js';

// ─── UI Modules ───
import { openModal, closeModal, isModalOpen, closeAllModals, openAddModal, openTaskModal, openMemberModal, openPrazoModal, openModalNovoUsuario, openModalMunicipio, initModalHandlers } from './ui/modals.js';
import { showNotification, showUndoToast, initNotificationStyles } from './ui/notifications.js';
import { navigate, renderPage, getCurrentPage, toggleSidebarCollapse, toggleSidebarMobile, closeSidebarMobile, closeSidebar, initializeSidebar, switchConfigTab, switchCalendarView, switchMissionView } from './ui/routing.js';

// ─── Utils ───
import { escapeHTML, roleLabel, formatDate, getDaysLeft, getDeadlineStatus, generateId, debounce, throttle, deepClone, slugify } from './utils/helpers.js';

// ─── Audit Module ───
import {
  logAction,
  getAuditLog,
  clearAuditLog,
  exportAuditLog,
  downloadAuditLog,
  getAuditStats,
  formatAuditEntry,
} from './core/audit.js';

// ─── Feature Modules ───
import {
  saveTask,
  deleteTask,
  toggleTaskStatus,
  cycleTaskPriority,
  assignTask,
} from './features/tasks.js';
import {
  saveMember,
  deleteMember,
  editMember,
  previewMemberPhoto,
  removePendingPhoto,
} from './features/members.js';
import {
  savePrazo,
  donePrazo,
  deletePrazo,
  reopenPrazo,
} from './features/prazos.js';
import {
  saveMunicipio,
  deleteMunicipio,
} from './features/municipios.js';
import {
  renderAuditoria,
  filterAudit,
  searchAudit,
  loadMoreAudit,
  confirmClearAudit,
} from './features/auditoria.js';
import {
  renderProcessos,
  filterProcessos,
  searchProcessos,
  openProcessoModal,
  openProcessoDetail,
  saveProcesso,
  confirmDeleteProcesso,
} from './features/processos.js';

// ─── Global State ───
window.currentUser = null;
window.currentPage = 'dashboard';
window.tasks = [];
window.members = [];
window.prazos = [];
window.activity = [];
window.sharedAC = [];
window.municipios = [];
window.processos  = [];
window.notifAlerts = [];

// ─── Feature State ───
window.pendingChecklist = [];
window.pendingAttachments = [];
window.pendingTaskParticipants = [];
window.pendingTaskSubtasks = [];
window.pendingEditPhoto = null;

// ─── Storage Keys ───
window.STORAGE_KEYS = STORAGE_KEYS;
window.PERMISSIONS = PERMISSIONS;

// ─── Core Functions (expose to window) ───
window.load = load;
window.save = save;
window.getSession = getSession;
window.setSession = setSession;
window.clearSession = clearSession;
window.loadUsers = loadUsers;
window.saveUsers = saveUsers;
window.quickLogin = quickLogin;
window.doLogout = doLogout;

// ─── doLogin (chamado pelo HTML) ───
window.doLogin = async function() {
  const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
  const pass = document.getElementById('loginPass')?.value || '';
  const rememberMe = document.getElementById('loginRememberMe')?.checked || false;
  const errorEl = document.getElementById('loginError');
  if (!email || !pass) {
    if (errorEl) { errorEl.textContent = 'Email e senha obrigatórios'; errorEl.classList.add('show'); }
    return;
  }
  const btn = document.getElementById('loginBtn');
  if (btn) btn.disabled = true;
  const r = await quickLogin(email, pass, rememberMe);
  if (btn) btn.disabled = false;
  if (r.error) {
    if (errorEl) { errorEl.textContent = r.error; errorEl.classList.add('show'); }
  } else if (r.user) {
    window.currentUser = r.user;
    if (errorEl) errorEl.classList.remove('show');
    if (!window._sb) await initSupabase();
    document.getElementById('loginScreen')?.classList.add('hidden');
    window._setupRealtime?.();
    startInactivityWatch();
    navigate('dashboard');
  }
};
window.canDo = canDo;
window.canSeePage = canSeePage;
window.changePassword = changePassword;
window.requestPasswordReset = requestPasswordReset;
window.getPendingResetRequests = getPendingResetRequests;
window.adminResetPassword = adminResetPassword;
window.signupOffice = signupOffice;
window.VG_OFFICE_ID = VG_OFFICE_ID;

// ─── Navegação entre Login e Signup ───
window.showSignup = function() {
  document.getElementById('loginScreen')?.classList.add('hidden');
  document.getElementById('signupScreen')?.classList.remove('hidden');
  document.getElementById('signupError').style.display = 'none';
  ['signupOfficeName','signupCNPJ','signupEmail','signupPassword','signupPasswordConfirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
};

window.showLogin = function() {
  document.getElementById('signupScreen')?.classList.add('hidden');
  document.getElementById('loginScreen')?.classList.remove('hidden');
};

// ─── Signup Handler ───
window.doSignup = async function() {
  const officeName = document.getElementById('signupOfficeName')?.value.trim() || '';
  const cnpj       = document.getElementById('signupCNPJ')?.value.trim() || '';
  const email      = document.getElementById('signupEmail')?.value.trim() || '';
  const password   = document.getElementById('signupPassword')?.value || '';
  const confirm    = document.getElementById('signupPasswordConfirm')?.value || '';
  const errorEl    = document.getElementById('signupError');
  const btn        = document.getElementById('signupBtn');
  const btnText    = document.getElementById('signupBtnText');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  };

  if (!officeName) return showError('Informe o nome do escritório');
  if (!email)      return showError('Informe o email do administrador');
  if (!password)   return showError('Informe uma senha');
  if (password !== confirm) return showError('As senhas não coincidem');
  if (password.length < 6) return showError('Senha deve ter no mínimo 6 caracteres');

  errorEl.style.display = 'none';
  btn.disabled = true;
  btnText.textContent = 'Criando...';

  if (!window._sb) await initSupabase();

  const result = await signupOffice({ officeName, cnpj, adminEmail: email, adminPassword: password });

  btn.disabled = false;
  btnText.textContent = 'Criar Escritório';

  if (result.error) return showError(result.error);

  // Login bem-sucedido após signup
  window.currentUser = result.user;
  setCurrentUser(result.user);
  document.getElementById('signupScreen')?.classList.add('hidden');
  window._setupRealtime?.();
  startInactivityWatch();
  navigate('dashboard');
  if (typeof window.updateUIForUser === 'function') window.updateUIForUser(result.user);
  window.showNotification?.('Escritório criado com sucesso! Bem-vindo ao Kausas.', 'success');
};

// ─── Funções do modal "Esqueci minha senha" ───
window.openForgotPassword = function() {
  const overlay = document.getElementById('forgotPasswordOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    document.getElementById('forgotEmail').value = '';
    document.getElementById('forgotStep1').style.display = 'block';
    document.getElementById('forgotStep2').style.display = 'none';
    const errEl = document.getElementById('forgotError');
    if (errEl) errEl.style.display = 'none';
  }
};
window.closeForgotPassword = function() {
  const overlay = document.getElementById('forgotPasswordOverlay');
  if (overlay) overlay.style.display = 'none';
};
window.submitForgotPassword = function() {
  const email = (document.getElementById('forgotEmail')?.value || '').trim().toLowerCase();
  const errEl = document.getElementById('forgotError');
  if (!email) {
    if (errEl) { errEl.textContent = 'Informe seu e-mail'; errEl.style.display = 'block'; }
    return;
  }
  const result = requestPasswordReset(email);
  if (result.error) {
    if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
  } else {
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = 'block';
  }
};

// ─── UI Functions (expose to window) ───
window.openModal = openModal;
window.closeModal = closeModal;
window.isModalOpen = isModalOpen;
window.closeAllModals = closeAllModals;
window.openAddModal = openAddModal;
window.openTaskModal = openTaskModal;
window.openMemberModal = openMemberModal;
window.openPrazoModal = openPrazoModal;
window.openModalNovoUsuario = openModalNovoUsuario;
window.openModalMunicipio = openModalMunicipio;
window.showNotification = showNotification;
window.showUndoToast = showUndoToast;
window.navigate = navigate;
window.renderPage = renderPage;
window.getCurrentPage = getCurrentPage;
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.toggleSidebarMobile = toggleSidebarMobile;
window.closeSidebarMobile = closeSidebarMobile;
window.closeSidebar = closeSidebar;
window.initializeSidebar = initializeSidebar;
window.switchConfigTab = switchConfigTab;
window.switchCalendarView = switchCalendarView;
window.switchMissionView = switchMissionView;

// ─── User Menu Functions ───
// Importar e expor as funções do menu do usuário de legacy.js
window.toggleUserMenu = function() {
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.classList.toggle('open');
  }
};
window.closeUserMenu = function() {
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.classList.remove('open');
  }
};

// ─── Helper Functions ───
window.escapeHTML = escapeHTML;
window.roleLabel = roleLabel;
window.formatDate = formatDate;
window.getDaysLeft = getDaysLeft;
window.getDeadlineStatus = getDeadlineStatus;
window.generateId = generateId;

// ─── Storage Functions ───
window.loadAttachments = loadAttachments;
window.saveAttachment = saveAttachment;
window.deleteAttachment = deleteAttachment;
window.getAttachmentData = getAttachmentData;
window.clearAllAttachments = clearAllAttachments;
window._sbSave = _sbSave;

// ─── Supabase Functions ───
window.initSupabase = initSupabase;
window._setupRealtime = _setupRealtime;
window.testSupabase = testSupabase;
window.testRealtime = testRealtime;
window._sbLoadAll = _sbLoadAll;

// ─── Audit Functions ───
window.logAction = logAction;
window.getAuditLog = getAuditLog;
window.clearAuditLog = clearAuditLog;
window.exportAuditLog = exportAuditLog;
window.downloadAuditLog = downloadAuditLog;
window.getAuditStats = getAuditStats;
window.formatAuditEntry = formatAuditEntry;

// ─── Feature Functions (Tasks) ───
window.saveTask = saveTask;
window.deleteTask = deleteTask;
window.toggleTaskStatus = toggleTaskStatus;
window.cycleTaskPriority = cycleTaskPriority;
window.assignTask = assignTask;

// ─── Feature Functions (Members) ───
window.saveMember = saveMember;
window.deleteMember = deleteMember;
window.editMember = editMember;
window.previewMemberPhoto = previewMemberPhoto;
window.removePendingPhoto = removePendingPhoto;

// ─── Feature Functions (Prazos) ───
window.savePrazo = savePrazo;
window.donePrazo = donePrazo;
window.deletePrazo = deletePrazo;
window.reopenPrazo = reopenPrazo;

// ─── Feature Functions (Municipios) ───
window.saveMunicipio = saveMunicipio;
window.deleteMunicipio = deleteMunicipio;

// ─── Feature Functions (Auditoria) ───
window.renderAuditoria = renderAuditoria;
window.filterAudit = filterAudit;
window.searchAudit = searchAudit;
window.loadMoreAudit = loadMoreAudit;
window.confirmClearAudit = confirmClearAudit;

// ─── Feature Functions (Processos) ───
window.renderProcessos      = renderProcessos;
window.filterProcessos      = filterProcessos;
window.searchProcessos      = searchProcessos;
window.openProcessoModal    = openProcessoModal;
window.openProcessoDetail   = openProcessoDetail;
window.saveProcesso         = saveProcesso;
window.confirmDeleteProcesso = confirmDeleteProcesso;

// ─── Initialize Application ───
async function initializeApp() {
  console.log('🚀 Inicializando KAUSAS...');

  // Reset automático via ?reset na URL
  if (new URLSearchParams(window.location.search).has('reset')) {
    const keys = ['lex_tasks','lex_prazos','lex_members','lex_activity','lex_shared_ac','lex_municipios'];
    keys.forEach(k => { localStorage.removeItem(k); localStorage.removeItem(k + '_updated_at'); });
    console.log('🧹 localStorage limpo via ?reset');
    window.history.replaceState({}, '', window.location.pathname);
  }

  // 1. Inicializar estilos de notificação
  initNotificationStyles();

  // 2. Inicializar usuários
  window.users = await initializeUsers();

  // 3. Carregar dados do localStorage
  const state = initializeStorage();
  window.tasks = state.tasks;
  window.members = state.members;
  window.prazos = state.prazos;
  window.activity = state.activity;
  window.sharedAC = state.sharedAC;
  window.municipios = state.municipios || [];
  window.processos  = state.processos  || [];

  // 4. Verificar sessão anterior
  const session = getSession();
  if (session) {
    window.currentUser = session;
    setCurrentUser(session);
    console.log('✅ Sessão recuperada:', session.name);

    // 5. Inicializar Supabase
    await initSupabase();

    // 6. Inicializar handlers de modal
    initModalHandlers();

    // 7. Inicializar sidebar
    initializeSidebar();

    // 8. Carregar dados do Supabase ANTES de mostrar a app
    console.log('⏳ Carregando dados do Supabase...');
    await _sbLoadAll();
    console.log('✅ Dados carregados do Supabase');

    // 9. Entrar na app
    document.getElementById('loginScreen').classList.add('hidden');
    window._setupRealtime?.();
    startInactivityWatch();
    navigate('dashboard');
    if (typeof window.updateUIForUser === 'function') window.updateUIForUser(session);
  } else {
    console.log('⚠️ Nenhuma sessão ativa');
    document.getElementById('loginScreen').classList.remove('hidden');
    initModalHandlers();
  }

  console.log('✅ KAUSAS inicializado!');
}

// ─── Handle Login Form ───
window.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM loaded, inicializando aplicação...');

  // Inicializar app
  await initializeApp();

  // Handler do botão de login
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPass');
      const errorEl = document.getElementById('loginError');

      const email = emailInput?.value.trim().toLowerCase() || '';
      const password = passInput?.value || '';

      if (!email || !password) {
        if (errorEl) {
          errorEl.textContent = 'Email e senha obrigatórios';
          errorEl.classList.add('show');
        }
        return;
      }

      // Mostrar loading
      loginBtn.disabled = true;
      const loadingBar = document.getElementById('sbLoadingBar');
      if (loadingBar) loadingBar.classList.add('show');

      // Tentar login (com "lembrar de mim")
      const rememberMe = document.getElementById('loginRememberMe')?.checked || false;
      const result = await quickLogin(email, password, rememberMe);

      loginBtn.disabled = false;
      if (loadingBar) loadingBar.classList.remove('show');

      if (result.error) {
        if (errorEl) {
          errorEl.textContent = result.error;
          errorEl.classList.add('show');
        }
        if (passInput) passInput.value = '';
      } else if (result.user) {
        // Login bem-sucedido
        window.currentUser = result.user;
        setCurrentUser(result.user);
        if (errorEl) errorEl.classList.remove('show');

        // Inicializar Supabase se não estiver
        if (!window._sb) {
          await initSupabase();
        }

        // Carregar dados do Supabase ANTES de mostrar a app
        console.log('⏳ Carregando dados do Supabase...');
        await _sbLoadAll();
        console.log('✅ Dados carregados do Supabase');

        // Entrar na app
        document.getElementById('loginScreen').classList.add('hidden');
        window._setupRealtime?.();
        startInactivityWatch();
        navigate('dashboard');
        if (typeof window.updateUIForUser === 'function') window.updateUIForUser(result.user);
      }
    });
  }

  // Suportar Enter para login
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  if (passInput) {
    passInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginBtn?.click();
      }
    });
  }
});

// ─── Export para uso externo ───
export default {
  // Core
  load,
  save,
  quickLogin,
  doLogout,
  canDo,

  // UI
  navigate,
  renderPage,
  openModal,
  closeModal,
  showNotification,

  // Storage
  loadAttachments,
  saveAttachment,

  // Supabase
  initSupabase,
  _setupRealtime,
};
