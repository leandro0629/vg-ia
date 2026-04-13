// ============================================================
// ROUTING MODULE
// ============================================================

import { canSeePage } from '../core/auth.js';

let currentPage = 'dashboard';

export function navigate(page) {
  // Validar se usuário pode ver essa página
  if (!canSeePage(page)) {
    console.warn(`❌ Você não tem permissão para acessar: ${page}`);
    return;
  }

  // Atualizar estado
  currentPage = page;

  // Atualizar sidebar
  document.querySelectorAll('.sidebar-item').forEach((item) => {
    item.classList.remove('active');
  });
  const activeItem = document.querySelector(`[data-page="${page}"]`);
  if (activeItem) activeItem.classList.add('active');

  // Renderizar página
  renderPage(page);

  // Fechar sidebar em mobile
  closeSidebarMobile();
}

export function renderPage(page) {
  // Esconder todas as páginas
  document.querySelectorAll('.page').forEach((p) => {
    p.classList.remove('active');
  });

  // Mostrar página selecionada
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) {
    pageEl.classList.add('active');
  }

  // Chamar função de renderização específica
  if (typeof window[`render${capitalize(page)}`] === 'function') {
    window[`render${capitalize(page)}`]();
  }
}

export function getCurrentPage() {
  return currentPage;
}

// ─── Sidebar ───
export function toggleSidebarCollapse() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
  }
}

export function toggleSidebarMobile() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-hidden');
  }
}

export function closeSidebarMobile() {
  if (window.innerWidth < 768) {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('mobile-hidden');
    }
  }
}

export function closeSidebar() {
  closeSidebarMobile();
}

export function initializeSidebar() {
  // Restaurar estado do sidebar
  const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && collapsed) {
    sidebar.classList.add('collapsed');
  }

  // Event listeners dos itens do sidebar
  document.querySelectorAll('.sidebar-item').forEach((item) => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      if (page) navigate(page);
    });
  });

  // Toggle collapse button
  const collapseBtn = document.querySelector('.sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebarCollapse);
  }

  // Hamburger button
  const toggleBtn = document.querySelector('.sidebar-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebarMobile);
  }
}

// ─── Utilitários ───
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function switchConfigTab(tab) {
  // Esconder todos os tabs
  document.querySelectorAll('.config-tab').forEach((el) => {
    el.classList.remove('active');
  });

  // Mostrar tab selecionado
  const tabEl = document.getElementById(`config-${tab}`);
  if (tabEl) {
    tabEl.classList.add('active');
  }

  // Atualizar botões de tab
  document.querySelectorAll('.missao-tab').forEach((btn) => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`tab-config-${tab}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

export function switchCalendarView(view) {
  // Esconder todas as views
  document.querySelectorAll('[id^="calendario-"]').forEach((el) => {
    el.style.display = 'none';
  });

  // Mostrar view selecionada
  const viewEl = document.getElementById(`calendario-${view}`);
  if (viewEl) {
    viewEl.style.display = 'block';
  }

  // Atualizar botões
  document.querySelectorAll('[id^="tab-calendario-"]').forEach((btn) => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`tab-calendario-${view}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Renderizar conteúdo
  if (view === 'mes' && typeof window.renderCalendario === 'function') {
    window.renderCalendario();
  } else if (view === 'prazos' && typeof window.renderPrazos === 'function') {
    window.renderPrazos();
  }
}

export function switchMissionView(view) {
  // Renderizar conteúdo da aba de missões
  if (typeof window[`render${capitalize(view)}`] === 'function') {
    window[`render${capitalize(view)}`]();
  }
}
