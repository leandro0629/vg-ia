// ============================================================
// KAUSAS LEGACY - UI Functions & Render Logic
// All functions auto-exposed to global scope for inline onclick
// ============================================================

// ─── Update UI for logged-in user (sidebar name/role/avatar, nav visibility) ───
function updateUIForUser(user) {
  if (!user) return;
  const perms = PERMISSIONS[user.profile] || PERMISSIONS['estagiario'];
  const avatarEl = document.getElementById('sidebarAvatar');
  const member = members && members.find(m => m.name === user.name);
  let photoUrl = member?.photo || user.photo || null;
  if (!photoUrl) {
    const pKey = 'vgai_user_profile_' + (user?.id || user?.memberId || 'guest');
    const profileData = JSON.parse(localStorage.getItem(pKey) || '{}');
    if (profileData.foto) photoUrl = profileData.foto;
  }
  if (avatarEl) {
    if (photoUrl) {
      avatarEl.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      avatarEl.textContent = user.name ? user.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() : '?';
    }
  }
  const nameEl = document.getElementById('sidebarName');
  const roleEl = document.getElementById('sidebarRole');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = perms.label;
  const officeNameEl = document.getElementById('officeNameTopbar');
  if (officeNameEl && window.currentOffice) {
    officeNameEl.textContent = '📍 ' + window.currentOffice.name;
  }
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const page = item.dataset.page;
    item.style.display = perms.pages.includes(page) ? '' : 'none';
  });
  const cadastrosLabel = document.getElementById('navLabelCadastros');
  if (cadastrosLabel) cadastrosLabel.style.display = (user.profile === 'socio' || user.profile === 'admin') ? '' : 'none';
  updateAddButton();
}

// Stubs para funções de notificação/email (não bloqueiam o fluxo principal)
function _sbPushNotif(toMemberId, taskId, msg) {
  // notificação via Supabase — implementar se necessário
  console.log('[notif]', toMemberId, msg);
}

// Helpers para formatação de email
function _formatStatusPT(status) {
  const map = {
    'todo': 'A Fazer',
    'doing': 'Em Andamento',
    'review': 'Em Revisão',
    'done': 'Concluído',
    'in-progress': 'Em Progresso',
    'blocked': 'Bloqueado'
  };
  return map[status] || (status.charAt(0).toUpperCase() + status.slice(1));
}

function _formatDatePT(dateStr) {
  if (!dateStr) return '';
  // Converte YYYY-MM-DD para DD/MM/YYYY
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function _capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function _enviarEmailMissao(task, tipo) {
  if (!task || !task.assignee) {
    console.warn('[email] Task sem assignee, pulando email');
    return;
  }

  // Encontrar membro responsável
  const member = members.find(m => m.id === task.assignee);
  if (!member || !member.email) {
    console.warn('[email] Membro não encontrado ou sem email:', task.assignee);
    return;
  }

  // Construir payload com formatação
  const payload = {
    destinatario_email: member.email,
    tipo_notificacao: tipo, // 'criada', 'status_mudou', etc
    titulo: _capitalize(task.title),
    responsavel: member.name,
    status: _formatStatusPT(task.kanbanStatus || 'todo'),
    prioridade: _capitalize(task.priority || 'normal'),
    data_vencimento: _formatDatePT(task.due || ''),
    link_tarefa: `${window.location.origin}/#tasks/${task.id}`,
  };

  console.log('[email] Enviando notificação:', payload);

  // Fazer chamada em background (non-blocking)
  fetch(
    'https://leandro0629.app.n8n.cloud/webhook/email-notificacao-nova-tarefa',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
    .then(response => {
      console.log('📧 Resposta webhook:', response.status);
      return response.text().catch(() => '');
    })
    .then(text => {
      if (text) console.log('📧 Webhook response:', text);
      console.log('✅ Email enviado para:', member.email);
    })
    .catch(err => {
      console.error('❌ Erro ao chamar webhook:', err.message);
    });
}

// Enviar email para todos os participantes (membros) de uma tarefa
function _enviarEmailParticipantesTask(task, tipo, novosIds) {
  if (!task || !task.participants || !task.participants.length) return;

  // Se novosIds fornecido, só notifica os novos; senão notifica todos
  const ids = novosIds || task.participants.map(p => p.memberId);
  if (!ids.length) return;

  const delegatorMember = currentUser ? members.find(m => m.id === currentUser.memberId) : null;
  const delegadorNome = delegatorMember?.name || currentUser?.name || 'Equipe';

  const destinatarios = ids
    .map(id => members.find(m => m.id === id))
    .filter(m => m && m.email);

  if (!destinatarios.length) {
    console.warn('[email-task-members] Nenhum participante com email');
    return;
  }

  destinatarios.forEach(member => {
    const payload = {
      destinatario_email: member.email,
      tipo_notificacao: tipo || 'atividade_criada',
      titulo: _capitalize(task.title),
      responsavel: member.name,
      descricao: _capitalize(task.desc || ''),
      processo: _capitalize(task.process || ''),
      prioridade: _capitalize(task.priority || 'normal'),
      data_vencimento: _formatDatePT(task.due || ''),
      delegado_por: delegadorNome,
      total_participantes: task.participants.length,
      link_tarefa: `${window.location.origin}/#tasks/${task.id}`,
    };

    console.log('[email-task-members] Enviando para:', member.email, payload);

    fetch(
      'https://leandro0629.app.n8n.cloud/webhook/email-notificacao-nova-tarefa',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
      .then(r => r.text().catch(() => ''))
      .then(() => console.log('✅ Email membro tarefa enviado para:', member.email))
      .catch(err => console.error('❌ Erro email membro tarefa:', err.message));
  });
}

// Enviar email para todos os participantes de uma atividade compartilhada
function _enviarEmailAC(ac, tipo) {
  if (!ac || !ac.participants || !ac.participants.length) return;

  const delegator = members.find(m => m.id === ac.delegator);
  const delegatorName = delegator?.name || 'Equipe';

  // Coleta todos os membros participantes com email
  const destinatarios = ac.participants
    .map(p => members.find(m => m.id === p.memberId))
    .filter(m => m && m.email);

  if (!destinatarios.length) {
    console.warn('[email-ac] Nenhum participante com email encontrado');
    return;
  }

  destinatarios.forEach(member => {
    const payload = {
      destinatario_email: member.email,
      tipo_notificacao: tipo || 'atividade_criada',
      titulo: _capitalize(ac.title),
      responsavel: member.name,
      descricao: _capitalize(ac.desc || ''),
      processo: _capitalize(ac.process || ''),
      prioridade: _capitalize(ac.priority || 'normal'),
      data_vencimento: _formatDatePT(ac.due || ''),
      delegado_por: delegatorName,
      total_participantes: ac.participants.length,
      link_tarefa: `${window.location.origin}/#atividades`,
    };

    console.log('[email-ac] Enviando para:', member.email, payload);

    fetch(
      'https://leandro0629.app.n8n.cloud/webhook/email-notificacao-nova-tarefa',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
      .then(r => r.text().catch(() => ''))
      .then(() => console.log('✅ Email AC enviado para:', member.email))
      .catch(err => console.error('❌ Erro email AC:', err.message));
  });
}

// DB stub - operations handled via window._sbSave from module
const DB = {
  async deleteTask(id) { /* data already removed from array; Supabase sync via _sbSave */ },
  async deletePrazo(id) { /* data already removed from array; Supabase sync via _sbSave */ },
  async saveMember(m) { if (window._sbSave) window._sbSave('lex_members', members); },
  async deleteMember(id) { if (window._sbSave) window._sbSave('lex_members', members); },
};

function updateAddButton() {
  if (!currentUser) return;
  const perms = PERMISSIONS[currentUser.profile];
  if (!perms) return;
  const addBtn = document.getElementById('addBtn');
  if (!addBtn) return;

  // Páginas que têm botão próprio ou não precisam do botão principal
  const hideBtn = (
    currentPage === 'atividades' ||
    currentPage === 'municipios' ||
    currentPage === 'calendario' ||
    currentPage === 'relatorios' ||
    currentPage === 'auditoria' ||
    currentPage === 'configuracoes' ||
    currentPage === 'convites' ||
    ((currentPage === 'equipe' || currentPage === 'estagiarios') && !perms.canAddMembers)
  );
  addBtn.style.display = hideBtn ? 'none' : '';

  const btnAC = document.getElementById('btnNovaAC');
  if (btnAC) btnAC.style.display = (currentPage === 'atividades' && canDo('canDelegate')) ? '' : 'none';
  const btnMun = document.getElementById('btnNovoMunicipio');
  if (btnMun) btnMun.style.display = (currentPage === 'municipios' && canDo('canAddMembers')) ? '' : 'none';
}

function getUserTasks() {
  if (!currentUser) return tasks;
  if (canDo('canSeeAllTasks')) return tasks;
  // Filter to own tasks
  return tasks.filter(t => {
    const m = members.find(m => m.id === t.assignee);
    return m && (m.email === currentUser.email || t.assignee === currentUser.memberId);
  });
}

// Change password
function showChangePassword() {
  closeUserMenu();
  document.getElementById('pwNew').value = '';
  document.getElementById('pwConfirm').value = '';
  document.getElementById('pwError').classList.remove('show');
  document.getElementById('modalPassword').classList.add('open');
}

function toggleUserMenu() {
  document.getElementById('userMenu').classList.toggle('open');
}
function closeUserMenu() {
  document.getElementById('userMenu').classList.remove('open');
}
document.addEventListener('click', e => {
  const wrap = document.querySelector('.user-menu-wrap');
  const profile = document.querySelector('.sidebar-profile');
  if (wrap && !wrap.contains(e.target) && !profile?.contains(e.target)) closeUserMenu();
});

function navigate(page) {
  // Check permission
  if (currentUser) {
    const perms = PERMISSIONS[currentUser.profile];
    if (!perms.pages.includes(page)) {
      // Show access denied
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-dashboard').classList.add('active');
      renderDashboard();
      return;
    }
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  currentPage = page;
  const titles = { dashboard:'Dashboard', equipe:'Equipe', missoes:'Missões', atividades:'Atividades Compartilhadas', prazos:'Prazos Processuais', municipios:'Contratos', advogados:'Advogados', estagiarios:'Estagiários', relatorios:'Relatórios', usuarios:'Usuários', calendario:'Calendário Jurídico', configuracoes:'Configurações', auditoria:'Auditoria', processos:'Processos', convites:'Convites' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  updateAddButton();
  renderPage(page);
  closeSidebar();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'equipe') renderTeam('equipes');
  else if (page === 'missoes') { missionView === 'lista' ? renderTasks('todas') : renderKanban(); }
  else if (page === 'atividades') renderAC('todas');
  else if (page === 'estagiarios') renderEstagiarios();
  else if (page === 'usuarios') renderPage_usuarios();
  else if (page === 'municipios') renderMunicipios();
  else if (page === 'relatorios') renderRelatorios();
  else if (page === 'calendario') switchCalendarView('mes');
  else if (page === 'configuracoes') loadConfigPage();
  else if (page === 'auditoria'  && typeof window.renderAuditoria  === 'function') window.renderAuditoria();
  else if (page === 'processos'  && typeof window.renderProcessos  === 'function') window.renderProcessos();
  else if (page === 'convites'   && typeof window.loadInviteCodes   === 'function') window.loadInviteCodes();
}

// ============================================================
// SIDEBAR - MODERN CONTROLS
// ============================================================
const SIDEBAR_COLLAPSED_KEY = 'vgai_sidebar_collapsed';

// Desktop: Toggle collapse/expand
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main');
  const isCollapsed = sidebar.classList.contains('collapsed');

  if (isCollapsed) {
    sidebar.classList.remove('collapsed');
    sidebar.classList.add('expanded');
    main.style.marginLeft = '280px';
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'false');
  } else {
    sidebar.classList.add('collapsed');
    sidebar.classList.remove('expanded');
    main.style.marginLeft = '80px';
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
  }
}

// Mobile: Toggle mobile menu
function toggleSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  sidebar.classList.toggle('mobile-visible');
  overlay.classList.toggle('visible');
}

// Mobile: Close menu
function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (window.innerWidth < 768) {
    sidebar.classList.remove('mobile-visible');
    overlay.classList.remove('visible');
  }
}

// Legacy compatibility
function toggleSidebar() { toggleSidebarMobile(); }
function closeSidebar() { closeSidebarMobile(); }

// Initialize sidebar state from localStorage
function initializeSidebar() {
  const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main');

  if (isCollapsed && window.innerWidth >= 768) {
    sidebar.classList.add('collapsed');
    sidebar.classList.remove('expanded');
    main.style.marginLeft = '80px';
  } else {
    main.style.marginLeft = '280px';
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      document.getElementById('sidebarOverlay').classList.remove('visible');
      sidebar.classList.remove('mobile-visible');
    } else {
      main.style.marginLeft = '0px';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeSidebar);

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const pending = tasks.filter(t => !t.done).length;
  const urgent = tasks.filter(t => t.priority === 'urgente' && !t.done).length;
  const overdue = prazos.filter(p => !p.done && new Date(p.date) < new Date()).length;

  // Stat: Prazos em Risco (≤ 7 dias)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const prazoEmRisco = prazos.filter(p => {
    if (p.done) return false;
    const d = new Date(p.date + 'T00:00:00');
    const days = Math.round((d - today) / 86400000);
    return days <= 7;
  }).length;
  const prazoVencido = prazos.filter(p => !p.done && new Date(p.date) < today).length;

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card gold"><div class="stat-icon">👥</div><div class="stat-label">Membros</div><div class="stat-value">${members.length}</div></div>
    <div class="stat-card blue"><div class="stat-icon">✓</div><div class="stat-label">Tarefas Abertas</div><div class="stat-value">${pending}</div></div>
    <div class="stat-card red"><div class="stat-icon">⚠</div><div class="stat-label">Urgentes</div><div class="stat-value">${urgent}</div></div>
    <div class="stat-card green"><div class="stat-icon">🤝</div><div class="stat-label">At. Compartilhadas</div><div class="stat-value">${sharedAC.filter(a=>a.status!=='concluida').length}</div></div>
    <div class="stat-card red" style="cursor:pointer" onclick="navigate('calendario');switchCalendarView('prazos')"><div class="stat-icon">⚖️</div><div class="stat-label">⚠️ Prazos em Risco</div><div class="stat-value">${prazoEmRisco}</div><div class="stat-value-small" style="color:#e05c5c;margin-top:4px">${prazoVencido > 0 ? prazoVencido + ' vencido(s)' : 'nenhum vencido'}</div></div>
  `;
  checkDeadlineNotifications();
  updateNotifBadge(urgent + overdue);

  // Pending tasks
  const myTasks = getUserTasks();
  const pendingTasks = myTasks.filter(t => !t.done).slice(0,5);
  document.getElementById('dashTasks').innerHTML = pendingTasks.length ? pendingTasks.map(t => taskItemHTML(t, true)).join('') : emptyState('Nenhuma tarefa pendente');

  // Deadlines
  const upcomingPrazos = prazos.filter(p=>!p.done).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,4);
  document.getElementById('dashDeadlines').innerHTML = upcomingPrazos.length ? upcomingPrazos.map(p => {
    const d = new Date(p.date + 'T12:00:00');
    const days = Math.ceil((d - new Date()) / 86400000);
    const urgClass = days <= 1 ? 'badge-danger' : days <= 3 ? 'badge-warn' : 'badge-info';
    return `<div class="deadline-item">
      <div class="deadline-date"><div class="deadline-day">${d.getDate()}</div><div class="deadline-month">${d.toLocaleString('pt',{month:'short'})}</div></div>
      <div class="deadline-info"><div class="deadline-title">${p.title}</div><div class="deadline-sub">${memberName(p.resp)}</div></div>
      <span class="badge ${urgClass}">${days <= 0 ? 'Venceu' : days === 1 ? 'Amanhã' : days + 'd'}</span>
    </div>`;
  }).join('') : `<div class="empty"><div class="empty-icon">📅</div><div class="empty-text">Nenhum prazo próximo</div></div>`;

  // Team summary – show per team
  document.getElementById('dashTeam').innerHTML = [1,2,3,4].map(teamId => {
    const teamMembers = members.filter(m => (m.teams||[m.team]).includes(teamId));
    const mt = tasks.filter(t => teamMembers.some(m => m.id === t.assignee) && !t.done).length;
    const info = TEAM_NAMES[teamId] || { name: 'Equipe ' + teamId, icon: teamId };
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1.1rem">${info.icon||teamId}</div>
      <div style="flex:1"><div style="font-size:0.85rem;font-weight:500">${info.name}</div><div style="font-size:0.72rem;color:var(--text-secondary)">${info.area} · ${teamMembers.length} membros</div></div>
      <span class="badge ${mt>4?'badge-danger':mt>2?'badge-warn':'badge-success'}">${mt} tarefas</span>
    </div>`;
  }).join('');

  // Render daily checklist
  renderDailyChecklist();
}

// ============================================================
// TEAM
// ============================================================
const TEAM_NAMES = {
  1: { name: 'Equipe Fogo',  area: 'IGEPPS', icon: '🔥', color: 'var(--danger)',
       municipios: ['São Miguel do Guamá – Prefeitura','São Miguel do Guamá – Câmara','Irituia – Prefeitura','Irituia – Câmara','Uruará – Prefeitura'] },
  2: { name: 'Equipe Água',  area: 'IASEP',  icon: '💧', color: 'var(--info)',
       municipios: ['Conceição do Araguaia – Prefeitura','Rio Maria – Prefeitura','Pau D\'Arco – Prefeitura','Pau D\'Arco – Câmara','Redenção – Prefeitura','Ourilândia – Câmara','Canaã dos Carajás – Câmara'] },
  3: { name: 'Equipe Terra', area: 'TCM',    icon: '🌍', color: 'var(--success)',
       municipios: ['Colares – Prefeitura','Maracanã – Câmara','Nova Timboteua – Prefeitura'] },
  4: { name: 'Equipe Vento', area: 'TCE',    icon: '💨', color: 'var(--primary)',
       municipios: ['Marituba – Prefeitura','Água Azul do Norte – Prefeitura','Mãe do Rio – Prefeitura','Mãe do Rio – Câmara','Bonito – Prefeitura'] },
};

let teamFilter = 'equipes';
function renderTeam(filter) {
  teamFilter = filter;
  const container = document.getElementById('teamGrid');
  if (filter === 'equipes') {
    container.className = 'teams-grid';
    container.innerHTML = [1,2,3,4].map(teamId => {
      const teamMembers = members.filter(m => (m.teams || [m.team]).includes(teamId));
      const socios      = teamMembers.filter(m => m.role === 'socio');
      const advSenior   = teamMembers.filter(m => m.role === 'advogado' && m.seniority === 'senior');
      const advJunior   = teamMembers.filter(m => m.role === 'advogado' && m.seniority !== 'senior');
      const estagiarios = teamMembers.filter(m => m.role === 'estagiario');
      const teamTasks  = tasks.filter(t => teamMembers.some(m => m.id === t.assignee) && !t.done).length;
      const teamPrazos = prazos.filter(p => teamMembers.some(m => m.id === p.resp) && !p.done).length;
      const info = TEAM_NAMES[teamId] || { name: 'Equipe ' + teamId, area: '', municipios: [] };
      const tc = ['team-1','team-2','team-3','team-4'][teamId-1];
      return `<div class="team-card">
        <div class="team-card-header">
          <div class="team-number ${tc}" style="font-size:1.3rem">${info.icon||teamId}</div>
          <div style="flex:1">
            <div class="team-name">${info.name}</div>
            <div class="team-area">Órgão: <strong>${info.area}</strong></div>
          </div>
          <span class="badge badge-muted">${teamMembers.length} membros</span>
        </div>
        <div class="team-card-body">
          ${socios.map(m => `
          <div class="team-member-row" onclick="showProfile(${m.id})">
            <div style="display:flex;align-items:center">${getAvatarHTML(m, 'small', true)}</div>
            <div class="team-member-info">
              <div class="team-member-name">${m.name} <span class="badge badge-warn" style="font-size:.6rem">Sócio</span></div>
              <div class="team-member-sub">👑 Sócio-Gestor</div>
            </div>
            <span class="badge badge-info">${tasks.filter(t=>t.assignee===m.id&&!t.done).length}</span>
          </div>`).join('')}
          ${advSenior.map(m => `
          <div class="team-member-row" onclick="showProfile(${m.id})">
            <div style="display:flex;align-items:center">${getAvatarHTML(m, 'small', true)}</div>
            <div class="team-member-info">
              <div class="team-member-name">${m.name} <span class="badge badge-warn" style="font-size:.6rem">Sênior</span></div>
              <div class="team-member-sub">👑 Líder de Equipe</div>
            </div>
            <span class="badge badge-info">${tasks.filter(t=>t.assignee===m.id&&!t.done).length}</span>
          </div>`).join('')}
          ${advJunior.map(m => `
          <div class="team-member-row" onclick="showProfile(${m.id})">
            <div style="display:flex;align-items:center">${getAvatarHTML(m, 'small')}</div>
            <div class="team-member-info">
              <div class="team-member-name">${m.name} <span class="badge badge-info" style="font-size:.6rem">Júnior</span></div>
              <div class="team-member-sub">⚖ Advogado(a)</div>
            </div>
            <span class="badge badge-info">${tasks.filter(t=>t.assignee===m.id&&!t.done).length}</span>
          </div>`).join('')}
          ${estagiarios.map(m => `
          <div class="team-member-row" onclick="showProfile(${m.id})">
            <div style="display:flex;align-items:center">${getAvatarHTML(m, 'small')}</div>
            <div class="team-member-info">
              <div class="team-member-name">${m.name}</div>
              <div class="team-member-sub">🎓 Estagiário(a)</div>
            </div>
            <span class="badge badge-success">${tasks.filter(t=>t.assignee===m.id&&!t.done).length}</span>
          </div>`).join('')}
          ${info.municipios && info.municipios.length ? `
          <div style="padding:10px 12px;border-top:1px solid var(--border)">
            <div style="font-size:.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">📍 Municípios</div>
            ${info.municipios.map(mun => {
              const [city, entity] = mun.split(' – ');
              return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(37,42,56,.5)">
                <span style="font-size:.78rem;color:var(--text-primary);flex:1">${city}</span>
                <span class="badge badge-muted" style="font-size:.65rem;flex-shrink:0">${entity || 'Prefeitura'}</span>
              </div>`;
            }).join('')}
          </div>` : ''}
        </div>
        <div class="team-card-footer">
          <div class="team-stat">📋 <strong>${teamTasks}</strong> tarefas abertas</div>
          <div class="team-stat">📅 <strong>${teamPrazos}</strong> prazos</div>
        </div>
      </div>`;
    }).join('');
  } else {
    container.className = 'member-grid';
    const filtered = filter === 'todos' ? members : members.filter(m => m.role === filter);
    container.innerHTML = filtered.length ? filtered.map(memberCardHTML).join('') : emptyState('Nenhum membro encontrado');
  }
}
function filterTeam(f, btn) {
  document.querySelectorAll('#page-equipe .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTeam(f);
}
function memberCardHTML(m) {
  const mt = tasks.filter(t => t.assignee === m.id && !t.done).length;
  const pct = Math.min(100, (m.workload || 0) * 10);
  const barClass = pct < 40 ? 'bar-low' : pct < 70 ? 'bar-mid' : 'bar-high';
  const avatarHtml = m.photo
    ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">${initials(m.name)}</div>`;
  return `<div class="member-card" onclick="showProfile(${m.id})">
    <div class="member-head">
      <div class="member-avatar ${avatarClass(m.role)}">${avatarHtml}</div>
      <div>
        <div class="member-name">${m.name} ${seniorityBadge(m)}</div>
        <div class="member-role">${roleLabel(m.role)}${m.oab ? ' · ' + m.oab : ''}${m.inst ? ' · ' + m.inst : ''}</div>
        <div class="chip-group">
          ${m.area ? `<span class="chip">${m.area}</span>` : ''}
          ${m.team ? `<span class="chip">Equipe ${m.team}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="member-stats">
      <div class="member-stat"><div class="member-stat-val">${m.workload || 0}</div><div class="member-stat-lbl">Processos</div></div>
      <div class="member-stat"><div class="member-stat-val">${mt}</div><div class="member-stat-lbl">Tarefas</div></div>
      <div class="member-stat"><div class="member-stat-val">${tasks.filter(t=>t.assignee===m.id&&t.done).length}</div><div class="member-stat-lbl">Concluídas</div></div>
    </div>
    <div class="workload-bar">
      <div class="workload-label"><span>Carga de trabalho</span><span>${pct}%</span></div>
      <div class="bar-track"><div class="bar-fill ${barClass}" style="width:${pct}%"></div></div>
    </div>
  </div>`;
}

// ============================================================
// TASKS
// ============================================================
let taskFilter = 'todas', taskSearch = '';
function renderTasks(filter) {
  taskFilter = filter;
  applyTaskFilter();
}
function applyTaskFilter() {
  let filtered = [...getUserTasks()];
  if (taskFilter === 'pendente') filtered = filtered.filter(t => !t.done);
  else if (taskFilter === 'concluida') filtered = filtered.filter(t => t.done);
  else if (taskFilter === 'urgente') filtered = filtered.filter(t => t.priority === 'urgente' && !t.done);
  if (taskSearch) filtered = filtered.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()));
  filtered.sort((a,b) => (a.done?1:-1) || (a.priority==='urgente'?-1:1));
  document.getElementById('taskList').innerHTML = filtered.length ? filtered.map(t => taskItemHTML(t, false)).join('') : emptyState('Nenhuma tarefa encontrada');
}
function filterTasks(f, btn) {
  document.querySelectorAll('#missoes-lista .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks(f);
}
function searchTasks(val) {
  taskSearch = val;
  applyTaskFilter();
}
function taskItemHTML(t, compact) {
  const due = t.due ? new Date(t.due + 'T12:00:00') : null;
  const days = due ? Math.ceil((due - new Date()) / 86400000) : null;
  const urgBadge = t.priority === 'urgente' && !t.done ? `<span class="badge badge-danger">Urgente</span>` : '';
  const dueBadge = days !== null && !t.done ? `<span class="badge ${days <= 0 ? 'badge-danger' : days <= 2 ? 'badge-warn' : 'badge-muted'}">${days <= 0 ? 'Vencida' : days === 1 ? 'Amanhã' : due.toLocaleDateString('pt-BR')}</span>` : '';
  const tipoBadge = t.tipo ? `<span class="tipo-badge">${tipoLabel(t.tipo)}</span>` : '';
  const cl = t.checklist || [];
  const clBadge = cl.length ? `<span class="checklist-progress">✓ ${cl.filter(c=>c.done).length}/${cl.length}</span>` : '';
  const participantCount = (t.participants || []).length;
  const sharedBadge = participantCount > 0 ? `<span class="badge" style="background:rgba(74,175,125,.2);color:#4caf7d">🤝 ${participantCount} participante${participantCount !== 1 ? 's' : ''}</span>` : '';
  // Labels/Etiquetas
  const labelColors = { 'Prazo': '#e05c5c', 'Audiência': '#ff6b6b', 'Petição': '#4caf7d', 'Contrato': '#5b8dee', 'Recurso': '#9c27b0', 'Consultoria': '#ffa94d', 'Diligência': '#e09a3a', 'Intimação': '#74b9ff', ...(t.customLabels || {}) };
  const labelsBadge = t.labels && t.labels.length > 0 ? t.labels.map(l => `<span class="badge" style="background: ${labelColors[l] || '#5b8dee'}; color: white; font-size: 0.7rem; padding: 2px 6px;">${l}</span>`).join('') : '';

  return `<div class="task-item">
    ${!compact ? `<div class="task-check ${t.done?'done':''}" onclick="toggleTask(${t.id})">${t.done?'✓':''}</div>` : ''}
    <div class="task-info" onclick="${compact ? `event.stopPropagation(); openTaskDetail(${t.id})` : ''}" style="${compact ? 'cursor:pointer' : ''}">
      <div class="task-title ${t.done?'done-text':''}">${tipoBadge}${t.title}</div>
      <div class="task-meta">${memberName(t.assignee)}${t.process?' · '+t.process:''} ${urgBadge} ${dueBadge} ${labelsBadge} ${clBadge} ${sharedBadge}</div>
    </div>
    ${!compact ? `<div style="display:flex;gap:4px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" onclick="openEditTask(${t.id})" title="Editar">✏️</button>
      ${canDo('canDeleteTasks') ? `<button class="btn btn-ghost btn-sm" onclick="deleteTask(${t.id})" title="Remover">✕</button>` : ''}
    </div>` : `<div style="flex-shrink:0">
      <button class="btn btn-primary btn-sm" onclick="openTaskDetail(${t.id})" title="Ver detalhes">VER</button>
    </div>`}
  </div>`;
}
function openEditTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  fillAssigneeSelect('taskAssignee');
  fillMunicipioSelect();
  document.getElementById('taskEditId').value = id;
  document.getElementById('taskTitle').value   = t.title || '';
  document.getElementById('taskAssignee').value = t.assignee || '';
  document.getElementById('taskPriority').value = t.priority || 'normal';
  document.getElementById('taskDue').value      = t.due || '';
  document.getElementById('taskProcess').value  = t.process || '';
  document.getElementById('taskDesc').value     = t.desc || '';
  document.getElementById('taskTipo').value     = t.tipo || '';
  document.getElementById('taskMunicipio').value = t.municipio || '';
  document.getElementById('modalTaskTitle').textContent = 'Editar Tarefa';
  // Checklist
  pendingChecklist = (t.checklist || []).map(c => ({ ...c, text: c.text || c.item || '' }));
  renderChecklistItems();
  // Membros
  pendingTaskParticipants = (t.participants || []).map(p => p.memberId).filter(m => m !== t.assignee);
  initTaskMembers();
  // Comments + history
  renderTaskComments(t);
  document.getElementById('taskCommentsSection').style.display = '';
  pendingAttachments = [];
  renderAttachPreview();
  const modalTask = document.getElementById('modalTask');
  modalTask.style.display = 'flex';
  modalTask.classList.add('open');
}
function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  save(STORAGE_KEYS.tasks, tasks);
  _sbSave('lex_tasks', tasks);
  addActivity(t.done ? `Tarefa "${t.title.substring(0,30)}..." concluída` : `Tarefa reaberta`, '#4caf7d');
  renderPage(currentPage);
}

// ============================================================
// DAILY CHECKLIST
// ============================================================
// Daily checklist operations handled via addEventListener in renderDailyChecklist()

function renderDailyChecklist() {
  const container = document.getElementById('dailyChecklist');
  if (!container) return;

  if (!Array.isArray(dailyChecklist)) dailyChecklist = [];

  let html = '';
  if (dailyChecklist.length > 0) {
    html = dailyChecklist.map(item => {
      const safeTitle = String(item.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const opacity = item.done ? 'opacity:0.6;' : '';
      const strike = item.done ? 'text-decoration:line-through;' : '';
      const color = item.done ? 'color:var(--text-secondary);' : '';
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);${opacity}" class="checklist-item" data-item-id="${item.id}">
        <input type="checkbox" class="checklist-checkbox" ${item.done?'checked':''} data-item-id="${item.id}" style="cursor:pointer;width:18px;height:18px">
        <div style="flex:1;font-size:0.9rem;${strike}${color}">${safeTitle}</div>
        <button class="btn btn-ghost btn-xs checklist-delete-btn" data-item-id="${item.id}" style="color:#f44336">×</button>
      </div>`;
    }).join('');
  } else {
    html = '<div class="empty" style="text-align:center;padding:20px"><div class="empty-icon">✅</div><div class="empty-text">Sem obrigações. Adicione uma!</div></div>';
  }

  html += '<div style="margin-top:12px;display:flex;gap:8px;width:100%">' +
    '<input type="text" id="checklistInput" placeholder="Nova obrigação..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-secondary);color:var(--text);font-size:0.9rem">' +
    '<button class="btn btn-primary btn-sm" id="checklistAddBtn" style="white-space:nowrap" type="button">Adicionar</button>' +
    '</div>';

  container.innerHTML = html;

  const inputEl = document.getElementById('checklistInput');
  const btnEl = document.getElementById('checklistAddBtn');

  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') _addChecklistItemFromInput(); });
    inputEl.focus();
  }
  if (btnEl) {
    btnEl.addEventListener('click', (e) => { e.preventDefault(); _addChecklistItemFromInput(); });
  }

  document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const itemId = parseInt(e.target.dataset.itemId);
      const item = dailyChecklist.find(i => i.id === itemId);
      if (item) {
        item.done = !item.done;
        save(STORAGE_KEYS.dailyChecklist, dailyChecklist);
        renderDailyChecklist();
      }
    });
  });

  document.querySelectorAll('.checklist-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const itemId = parseInt(e.target.dataset.itemId);
      dailyChecklist = dailyChecklist.filter(i => i.id !== itemId);
      save(STORAGE_KEYS.dailyChecklist, dailyChecklist);
      renderDailyChecklist();
    });
  });
}

function _addChecklistItemFromInput() {
  const inp = document.getElementById('checklistInput');
  if (!inp || !inp.value.trim()) return;
  if (!Array.isArray(dailyChecklist)) dailyChecklist = [];
  dailyChecklist.push({ id: Date.now(), title: inp.value.trim(), done: false, created: new Date().toISOString() });
  save(STORAGE_KEYS.dailyChecklist, dailyChecklist);
  renderDailyChecklist();
  inp.value = '';
}

// ============================================================
// UNDO TOAST SYSTEM
// ============================================================
const _undoQueue = {};

function showUndoToast({ label, title, duration = 5000, onUndo, onExpire }) {
  const toastId = 'toast_' + Date.now();
  const container = document.getElementById('undoToastContainer');

  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const toast = document.createElement('div');
  toast.className = 'undo-toast';
  toast.id = toastId;
  toast.innerHTML = `
    <div class="undo-toast-text">
      <div class="undo-toast-label">${label}</div>
      <div class="undo-toast-title" title="${safeTitle}">${safeTitle}</div>
    </div>
    <button class="undo-btn" onclick="_triggerUndo('${toastId}')">↩ Desfazer</button>
    <div class="undo-progress" id="uprog_${toastId}" style="width:100%"></div>
  `;
  container.appendChild(toast);

  // Kick off progress bar shrink on next paint so the transition actually runs
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const bar = document.getElementById('uprog_' + toastId);
    if (bar) {
      bar.style.transition = `width ${duration}ms linear`;
      bar.style.width = '0%';
    }
  }));

  const timer = setTimeout(() => {
    _dismissToast(toastId);
    onExpire();
  }, duration);

  _undoQueue[toastId] = { timer, onUndo };
}

function _triggerUndo(toastId) {
  const entry = _undoQueue[toastId];
  if (!entry) return;
  clearTimeout(entry.timer);
  _dismissToast(toastId);
  entry.onUndo();
}

function _dismissToast(toastId) {
  const el = document.getElementById(toastId);
  if (el) {
    el.style.transition = 'opacity .2s, transform .2s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 220);
  }
  delete _undoQueue[toastId];
}

function deleteTask(id) {
  console.log('[deleteTask] Iniciando deleção da tarefa:', id);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) { console.log('[deleteTask] Tarefa não encontrada'); return; }
  const removed = tasks.splice(idx, 1)[0];
  console.log('[deleteTask] Tarefa removida do array:', removed.title);

  // Salvar IMEDIATAMENTE para Supabase (não esperar undo timeout)
  try {
    save(STORAGE_KEYS.tasks, tasks);
    console.log('[deleteTask] Salvo em localStorage/Supabase');
  } catch (e) {
    console.error('[deleteTask] Erro ao salvar:', e);
  }

  // Auditoria (não bloqueia)
  if (typeof logAction === 'function') {
    try {
      logAction({
        action: 'task.delete',
        category: 'tasks',
        description: `Tarefa "${removed.title.substring(0,50)}" deletada`,
        entityId: id,
        entityTitle: removed.title,
        color: '#e05c5c'
      });
    } catch (e) {
      console.log('[deleteTask] Aviso: logAction falhou', e.message);
    }
  }

  console.log('[deleteTask] Re-renderizando página');
  renderPage(currentPage);

  showUndoToast({
    label: 'Tarefa removida',
    title: removed.title,
    onUndo: () => {
      console.log('[deleteTask] Desfazendo deleção');
      tasks.splice(idx, 0, removed);
      save(STORAGE_KEYS.tasks, tasks);
      renderPage(currentPage);
    },
    onExpire: () => {
      console.log('[deleteTask] Undo expirou, finalizando deleção');
      DB.deleteTask(id);
      addActivity(`Tarefa "${removed.title.substring(0, 30)}..." removida`, '#e05c5c');
    }
  });
}

// ============================================================
// PRAZOS
// ============================================================
function renderPrazos() {
  const sorted = [...prazos].sort((a,b) => new Date(a.date) - new Date(b.date));
  document.getElementById('prazoBody').innerHTML = sorted.length ? sorted.map(p => {
    const d = new Date(p.date + 'T12:00:00');
    const days = Math.ceil((d - new Date()) / 86400000);
    const badge = p.done ? `<span class="badge badge-success">Concluído</span>`
      : days <= 0 ? `<span class="badge badge-danger">Venceu</span>`
      : days <= 2 ? `<span class="badge badge-danger">${days}d</span>`
      : days <= 5 ? `<span class="badge badge-warn">${days}d</span>`
      : `<span class="badge badge-muted">${days}d</span>`;
    return `<tr>
      <td><div class="td-name">${p.title}</div></td>
      <td><div style="font-size:0.78rem;color:var(--text-secondary)">${p.process || '–'}</div></td>
      <td>${memberName(p.resp)}</td>
      <td>${d.toLocaleDateString('pt-BR')}</td>
      <td>${badge}</td>
      <td>
        ${!p.done ? `<button class="btn btn-ghost btn-sm" onclick="donePrazo(${p.id})">✓</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="deletePrazo(${p.id})">✕</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6">${emptyState('Nenhum prazo cadastrado')}</td></tr>`;
}
function donePrazo(id) {
  const p = prazos.find(p => p.id === id);
  if (p) { p.done = true; save(STORAGE_KEYS.prazos, prazos); addActivity(`Prazo "${p.title.substring(0,30)}" cumprido`, '#4caf7d'); renderPrazos(); }
}
function deletePrazo(id) {
  const idx = prazos.findIndex(p => p.id === id);
  if (idx === -1) return;
  const removed = prazos.splice(idx, 1)[0];

  // Salvar IMEDIATAMENTE para Supabase (não esperar undo timeout)
  save(STORAGE_KEYS.prazos, prazos);
  logAction({
    action: 'prazo.delete',
    category: 'prazos',
    description: `Prazo "${removed.title.substring(0,50)}" deletado`,
    entityId: id,
    entityTitle: removed.title,
    color: '#e05c5c'
  });

  renderPrazos();

  showUndoToast({
    label: 'Prazo removido',
    title: removed.title,
    onUndo: () => {
      prazos.splice(idx, 0, removed);
      save(STORAGE_KEYS.prazos, prazos);
      renderPrazos();
    },
    onExpire: () => {
      DB.deletePrazo(id);
      addActivity(`Prazo "${removed.title.substring(0, 30)}" removido`, '#e05c5c');
    }
  });
}

// ============================================================
// ADVOGADOS / ESTAGIÁRIOS
// ============================================================
function renderEstagiarios() {
  const est = members.filter(m => m.role === 'estagiario');
  document.getElementById('estGrid').innerHTML = est.length ? est.map(memberCardHTML).join('') : emptyState('Nenhum estagiário cadastrado');
}

// ============================================================
// PROFILE MODAL
// ============================================================
function showProfile(id) {
  const m = members.find(m => m.id === id);
  if (!m) return;
  const mt = tasks.filter(t => t.assignee === m.id);
  const sup = m.supervisor ? members.find(x => x.id === m.supervisor) : null;
  document.getElementById('profileBody').innerHTML = `
    <div class="profile-header">
      <div style="display:flex;justify-content:center">${getAvatarHTML(m, 'large')}</div>
      <div>
        <div class="profile-name">${m.name} ${seniorityBadge(m)}</div>
        <div class="profile-role">${roleLabel(m.role)}${m.oab?' · '+m.oab:''}</div>
        ${m.email ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">${m.email}</div>` : ''}
      </div>
    </div>
    <div class="grid-2" style="gap:12px;margin-bottom:20px">
      ${m.inst ? `<div class="card"><div class="card-body"><div class="stat-label">Instituição</div><div style="font-size:0.9rem;font-weight:500">${m.inst}</div></div></div>` : ''}
      ${sup ? `<div class="card"><div class="card-body"><div class="stat-label">Responsável</div><div style="font-size:0.9rem;font-weight:500">${sup.name}</div></div></div>` : ''}
      <div class="card"><div class="card-body"><div class="stat-label">Carga</div><div style="font-size:0.9rem;font-weight:500">${m.workload || 0} processos</div></div></div>
    </div>
    <div class="section-header"><span class="section-title">Tarefas (${mt.length})</span></div>
    ${mt.length ? mt.map(t => taskItemHTML(t, true)).join('') : emptyState('Nenhuma tarefa')}
  `;
  currentEditingMemberId = id;
  const isOwnProfile = currentUser && currentUser.memberId === id;
  document.getElementById('editPhotoBtn').style.display = isOwnProfile ? '' : 'none';
  document.getElementById('deleteMemberBtn').onclick = () => deleteMember(id);
  document.getElementById('deleteMemberBtn').style.display = canDo('canDeleteMembers') ? '' : 'none';
  const modalProfile = document.getElementById('modalProfile');
  modalProfile.style.display = 'flex';
  modalProfile.classList.add('open');
}
function deleteMember(id) {
  if (!confirm('Remover membro e todas as suas tarefas?')) return;
  members = members.filter(m => m.id !== id);
  tasks = tasks.filter(t => t.assignee !== id);
  save(STORAGE_KEYS.members, members);
  save(STORAGE_KEYS.tasks, tasks);
  closeModal('modalProfile');
  renderPage(currentPage);
}

let currentEditingMemberId = null;
let pendingEditPhoto = null;

function openEditPhotoModal() {
  const m = members.find(x => x.id === currentEditingMemberId);
  if (!m) return;

  pendingEditPhoto = null;
  document.getElementById('editPhotoInput').value = '';
  document.getElementById('editPhotoImg').style.display = 'none';
  document.getElementById('editPhotoPlaceholder').style.display = '';
  document.getElementById('editPhotoRemoveBtn').style.display = 'none';

  // Carrega a foto atual se existir
  if (m.photo) {
    const img = document.getElementById('editPhotoImg');
    img.src = m.photo;
    img.style.display = '';
    document.getElementById('editPhotoPlaceholder').style.display = 'none';
    pendingEditPhoto = m.photo;
    document.getElementById('editPhotoRemoveBtn').style.display = '';
  }

  document.getElementById('modalEditPhoto').classList.add('open');
}

function previewEditPhoto() {
  const file = document.getElementById('editPhotoInput').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    pendingEditPhoto = e.target.result;
    const img = document.getElementById('editPhotoImg');
    const placeholder = document.getElementById('editPhotoPlaceholder');
    const removeBtn = document.getElementById('editPhotoRemoveBtn');

    img.src = pendingEditPhoto;
    img.style.display = '';
    placeholder.style.display = 'none';
    removeBtn.style.display = '';
  };
  reader.readAsDataURL(file);
}

function removeEditPhoto() {
  pendingEditPhoto = null;
  document.getElementById('editPhotoInput').value = '';
  document.getElementById('editPhotoImg').style.display = 'none';
  document.getElementById('editPhotoPlaceholder').style.display = '';
  document.getElementById('editPhotoRemoveBtn').style.display = 'none';
}

function saveEditPhoto() {
  const m = members.find(x => x.id === currentEditingMemberId);
  if (!m) return;

  m.photo = pendingEditPhoto || null;
  save(STORAGE_KEYS.members, members);
  addActivity(`Foto de perfil de ${m.name} atualizada`, '#5b8dee');
  closeModal('modalEditPhoto');
  showProfile(currentEditingMemberId);
}

// ============================================================
// ADD MODAL LOGIC
// ============================================================
function openAddModal() {
  const pagesWithMenu = ['dashboard', 'processos', 'calendario'];
  if (pagesWithMenu.includes(currentPage)) {
    toggleAddDropdown();
    return;
  }
  if (currentPage === 'missoes') openTaskModal();
  else if (currentPage === 'municipios') openModalMunicipio();
  else if (currentPage === 'usuarios') window.openModalNovoUsuario?.();
  else if (currentPage === 'equipe' || currentPage === 'estagiarios') openMemberModal();
}

function toggleAddDropdown() {
  const dropdown = document.getElementById('addDropdown');
  if (!dropdown) return;
  if (dropdown.style.display !== 'none') {
    dropdown.style.display = 'none';
    return;
  }

  const options = [];
  options.push({ icon: '📝', label: 'Nova Tarefa',    fn: 'openTaskModal()' });
  options.push({ icon: '⚖️',  label: 'Novo Processo',  fn: 'window.openProcessoModal?.()' });
  if (window.canDo?.('canAddPrazos'))
    options.push({ icon: '📅', label: 'Novo Prazo',      fn: 'openPrazoModalDirect()' });
  if (window.canDo?.('canDelegate'))
    options.push({ icon: '🤝', label: 'Nova Atividade',  fn: 'openNovaACModal()' });
  if (window.canDo?.('canAddMembers')) {
    options.push({ icon: '👤', label: 'Novo Membro',     fn: 'openMemberModal()' });
    options.push({ icon: '🏛️', label: 'Novo Contrato',   fn: 'openModalMunicipio()' });
  }
  if (window.canDo?.('canCreateInvites'))
    options.push({ icon: '🎟️', label: 'Gerar Convite',   fn: "navigate('convites')" });

  dropdown.innerHTML = options.map(o => `
    <div onclick="${o.fn}; document.getElementById('addDropdown').style.display='none';"
         style="display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:8px; cursor:pointer; font-size:0.9rem; color:var(--text-primary); transition:background 0.15s;"
         onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background=''">
      <span style="font-size:1rem;">${o.icon}</span>
      <span>${o.label}</span>
    </div>
  `).join('');

  dropdown.style.display = 'block';
}

function openPrazoModalDirect() {
  if (typeof window.openPrazoModal === 'function') window.openPrazoModal();
  else if (typeof openModal === 'function') openModal('modalPrazo');
}

function openNovaACModal() {
  const btn = document.getElementById('btnNovaAC');
  if (btn) btn.click();
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', e => {
  const dropdown = document.getElementById('addDropdown');
  const addBtn = document.getElementById('addBtn');
  if (dropdown && addBtn && !dropdown.contains(e.target) && !addBtn.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});
function openTaskModal() {
  fillAssigneeSelect('taskAssignee');
  fillMunicipioSelect();
  clearTaskForm();
  const modalTask = document.getElementById('modalTask');
  modalTask.style.display = 'flex';
  modalTask.classList.add('open');
}
function openMemberModal(type) {
  const title = currentPage === 'estagiarios' ? 'Novo Estagiário' : 'Novo Membro';
  document.getElementById('memberModalTitle').textContent = title;
  if (currentPage === 'estagiarios') document.getElementById('memberRole').value = 'estagiario';
  updateMemberForm();
  fillSupervisorSelect();
  document.getElementById('modalMember').classList.add('open');
}
function openPrazoModal() {
  fillAssigneeSelect('prazoResp');
  document.getElementById('modalPrazo').classList.add('open');
}
document.getElementById('memberRole').addEventListener('change', updateMemberForm);
function updateMemberForm() {
  const role = document.getElementById('memberRole').value;
  document.getElementById('oabGroup').style.display        = role === 'advogado'  ? '' : 'none';
  document.getElementById('areaGroup').style.display       = role === 'advogado'  ? '' : 'none';
  document.getElementById('seniorityGroup').style.display  = role === 'advogado'  ? '' : 'none';
  document.getElementById('instGroup').style.display       = role === 'estagiario'? '' : 'none';
  document.getElementById('supervisorGroup').style.display = role === 'estagiario'? '' : 'none';
}

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { alert('Informe o título da tarefa'); return; }
  const editId = parseInt(document.getElementById('taskEditId').value) || null;
  if (editId) {
    // Edit existing task
    const t = tasks.find(x => x.id === editId);
    if (t) {
      const oldAssignee = t.assignee;
      const oldParticipantIds = (t.participants || []).map(p => p.memberId);
      t.title    = title;
      t.assignee = parseInt(document.getElementById('taskAssignee').value);
      t.priority = document.getElementById('taskPriority').value;
      t.due      = document.getElementById('taskDue').value;
      t.process  = document.getElementById('taskProcess').value;
      t.desc     = document.getElementById('taskDesc').value;
      t.tipo     = document.getElementById('taskTipo').value;
      t.municipio = document.getElementById('taskMunicipio').value;
      t.checklist = pendingChecklist.slice();
      t.participants = pendingTaskParticipants.map(memberId => ({
        memberId
      }));
      if (pendingAttachments.length) {
        pendingAttachments.forEach(a => { if (a._data) saveAttachment(a.id, a._data); });
        const meta = pendingAttachments.map(({id, name, type, size}) => ({id, name, type, size}));
        t.attachments = (t.attachments || []).concat(meta);
      }
      save(STORAGE_KEYS.tasks, tasks);
      addActivity(`Tarefa "${title.substring(0,30)}..." editada`, '#c8a96e');
      // Notificar novo responsável se mudou
      if (t.assignee !== oldAssignee && t.assignee !== currentUser?.memberId) {
        _sbPushNotif(t.assignee, t.id, `${currentUser.name} atribuiu a missão "${title.substring(0,40)}" a você`);
      }
      // 📧 Email para novos membros adicionados
      const novosIds = pendingTaskParticipants.filter(id => !oldParticipantIds.includes(id));
      if (novosIds.length) {
        _enviarEmailParticipantesTask(t, 'atividade_criada', novosIds);
      }
    }
  } else {
    // New task
    const kanbanCol = document.getElementById('modalTask').dataset.kanbanCol || 'todo';
    const t = {
      id: Date.now(), title,
      assignee: parseInt(document.getElementById('taskAssignee').value),
      priority: document.getElementById('taskPriority').value,
      due: document.getElementById('taskDue').value,
      process: document.getElementById('taskProcess').value,
      desc: document.getElementById('taskDesc').value,
      tipo: document.getElementById('taskTipo').value,
      municipio: document.getElementById('taskMunicipio').value,
      checklist: pendingChecklist.slice(),
      comments: [],
      attachments: (() => {
        pendingAttachments.forEach(a => { if (a._data) saveAttachment(a.id, a._data); });
        return pendingAttachments.map(({id, name, type, size}) => ({id, name, type, size}));
      })(),
      kanbanStatus: kanbanCol,
      done: false,
      created: new Date().toISOString(),
      participants: pendingTaskParticipants.map(memberId => ({
        memberId
      }))
    };
    tasks.push(t);
    console.log('[Task] Nova tarefa criada:', t);
    save(STORAGE_KEYS.tasks, tasks);
    addActivity(`Tarefa "${title.substring(0,30)}..." criada`, '#5b8dee');
    // Enviar notificação para o responsável
    if (t.assignee && currentUser && t.assignee !== currentUser.memberId) {
      _sbPushNotif(t.assignee, t.id, `${currentUser.name} atribuiu a missão "${title.substring(0,40)}" a você`);
    }
    // 📧 Email notificação - missão criada (responsável)
    _enviarEmailMissao(t, 'criada');
    // 📧 Email notificação - membros adicionados à tarefa
    if (t.participants && t.participants.length > 0) {
      _enviarEmailParticipantesTask(t, 'atividade_criada');
    }
  }
  closeModal('modalTask');
  clearTaskForm();
  renderPage(currentPage);
}
function clearTaskForm() {
  ['taskTitle','taskDue','taskProcess','taskDesc','taskEditId'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('taskPriority').value = 'normal';
  document.getElementById('taskTipo').value = '';
  document.getElementById('taskMunicipio').value = '';
  document.getElementById('modalTaskTitle').textContent = 'Nova Tarefa';
  pendingChecklist = [];
  renderChecklistItems();
  document.getElementById('taskCommentsSection').style.display = 'none';
  document.getElementById('taskCommentList').innerHTML = '';
  document.getElementById('taskCommentInput').value = '';
  pendingAttachments = [];
  renderAttachPreview();
  pendingTaskParticipants = [];
  initTaskMembers();
}

let pendingMemberPhoto = null;

function previewMemberPhoto() {
  const file = document.getElementById('memberPhotoInput').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    pendingMemberPhoto = e.target.result;
    const img = document.getElementById('memberPhotoImg');
    const placeholder = document.getElementById('memberPhotoPlaceholder');
    const removeBtn = document.getElementById('memberPhotoRemoveBtn');

    img.src = pendingMemberPhoto;
    img.style.display = '';
    placeholder.style.display = 'none';
    removeBtn.style.display = '';
  };
  reader.readAsDataURL(file);
}

function removeMemberPhoto() {
  pendingMemberPhoto = null;
  document.getElementById('memberPhotoInput').value = '';
  document.getElementById('memberPhotoImg').style.display = 'none';
  document.getElementById('memberPhotoPlaceholder').style.display = '';
  document.getElementById('memberPhotoRemoveBtn').style.display = 'none';
}

function saveMember() {
  const name = document.getElementById('memberName').value.trim();
  if (!name) { alert('Informe o nome'); return; }
  const role = document.getElementById('memberRole').value;
  const m = {
    id: Date.now(), name, role,
    oab: document.getElementById('memberOAB').value,
    area: document.getElementById('memberArea').value,
    inst: document.getElementById('memberInst').value,
    supervisor: parseInt(document.getElementById('memberSupervisor').value) || null,
    email: document.getElementById('memberEmail').value,
    seniority: role === 'advogado' ? (document.getElementById('memberSeniority').value || null) : null,
    photo: pendingMemberPhoto || null,
    workload: 0, tasks: 0
  };
  members.push(m);
  save(STORAGE_KEYS.members, members);
  addActivity(`${name} adicionado(a) como ${roleLabel(role)}`, '#c8a96e');
  closeModal('modalMember');
  ['memberName','memberOAB','memberArea','memberInst','memberEmail'].forEach(id => document.getElementById(id).value = '');
  pendingMemberPhoto = null;
  document.getElementById('memberPhotoInput').value = '';
  document.getElementById('memberPhotoImg').style.display = 'none';
  document.getElementById('memberPhotoPlaceholder').style.display = '';
  document.getElementById('memberPhotoRemoveBtn').style.display = 'none';
  renderPage(currentPage);
}

function savePrazo() {
  const title = document.getElementById('prazoTitle').value.trim();
  const date = document.getElementById('prazoDate').value;
  if (!title || !date) { alert('Preencha título e data'); return; }
  const p = {
    id: Date.now(), title, date,
    process: document.getElementById('prazoProcess').value,
    resp: parseInt(document.getElementById('prazoResp').value),
    urgency: document.getElementById('prazoUrgency').value,
    done: false
  };
  prazos.push(p);
  save(STORAGE_KEYS.prazos, prazos);
  addActivity(`Prazo "${title.substring(0,30)}" cadastrado`, '#e0a44a');
  closeModal('modalPrazo');
  ['prazoTitle','prazoProcess','prazoDate'].forEach(id => document.getElementById(id).value = '');
  renderPage(currentPage);
}

// ============================================================
// ATIVIDADES COMPARTILHADAS
// ============================================================
let acFilter = 'todas';

function renderAC(filter) {
  acFilter = filter;
  let list = [...sharedAC];

  // Admin e sócio veem tudo; outros membros só veem atividades em que participam
  const isManager = currentUser?.profile === 'admin' || currentUser?.profile === 'socio';
  if (!isManager) {
    const mid = currentUser?.memberId;
    list = list.filter(a =>
      a.delegator === mid ||
      a.owner === mid ||
      a.participants.some(p => p.memberId === mid)
    );
  }

  if (filter === 'ativas')     list = list.filter(a => a.status !== 'concluida');
  if (filter === 'concluidas') list = list.filter(a => a.status === 'concluida');
  if (filter === 'minhas') {
    const mid = currentUser?.memberId;
    list = list.filter(a => a.delegator === mid || a.owner === mid || a.participants.some(p => p.memberId === mid));
  }
  const container = document.getElementById('acList');
  if (!list.length) {
    container.innerHTML = `<div class="ac-empty"><div class="ac-empty-icon">🤝</div><div style="font-size:.9rem">Nenhuma atividade compartilhada encontrada</div></div>`;
    return;
  }
  container.innerHTML = list.map(ac => acCardHTML(ac)).join('');
}

function acCardHTML(ac) {
  const allSubs = ac.participants.flatMap(p => p.subtasks);
  const doneSubs = allSubs.filter(s => s.done).length;
  const pct = allSubs.length ? Math.round(doneSubs / allSubs.length * 100) : 0;
  const due = ac.due ? new Date(ac.due + 'T12:00:00') : null;
  const days = due ? Math.ceil((due - new Date()) / 86400000) : null;
  const prioColor = { urgente:'var(--danger)', critica:'var(--danger)', normal:'var(--info)', baixa:'var(--text-secondary)' }[ac.priority] || 'var(--text-secondary)';
  const prioBadge = { urgente:'badge-danger', critica:'badge-danger', normal:'badge-info', baixa:'badge-muted' }[ac.priority];
  const delegator = members.find(m => m.id === ac.delegator);
  const canEdit = currentUser && (currentUser.profile === 'socio' || currentUser.memberId === ac.delegator || currentUser.memberId === ac.owner);

  const participantsHTML = ac.participants.map(p => {
    const m = members.find(x => x.id === p.memberId);
    if (!m) return '';
    const done = p.subtasks.filter(s => s.done).length;
    const total = p.subtasks.length;
    const pPct = total ? Math.round(done/total*100) : 0;
    const myPart = currentUser && (currentUser.memberId === p.memberId || canEdit);
    return `<div class="ac-participant-block">
      <div class="ac-participant-header" onclick="toggleParticipantBlock(this)">
        ${getAvatarHTML(m, 'small')}
        <span class="ac-p-name">${m.name} <span style="font-size:.72rem;color:var(--text-secondary);font-weight:400">${roleLabel(m.role)}</span></span>
        <span class="ac-p-progress">${done}/${total} subtarefas</span>
        <div class="bar-track" style="width:60px;margin:0 8px"><div class="bar-fill ${pPct===100?'bar-low':pPct>50?'bar-mid':'bar-high'}" style="width:${pPct}%"></div></div>
        <span class="collapse-arrow open">▼</span>
      </div>
      <div class="ac-subtasks">
        ${p.subtasks.map(s => `
          <div class="ac-subtask">
            <div class="ac-subtask-check ${s.done?'done':''}" onclick="${myPart?`toggleSubtask('${ac.id}',${p.memberId},'${s.id}')`:''}" style="${myPart?'':'cursor:default;opacity:.5'}">${s.done?'✓':''}</div>
            <span class="ac-subtask-title ${s.done?'done-text':''}">${s.title}</span>
            <span class="ac-subtask-status"><span class="badge ${s.done?'badge-success':'badge-muted'}">${s.done?'Feito':'Pendente'}</span></span>
          </div>`).join('')}
        ${p.subtasks.length === 0 ? '<div style="font-size:.78rem;color:var(--text-secondary);padding:4px 0">Sem subatividades</div>' : ''}
      </div>
    </div>`;
  }).join('');

  const commentsHTML = ac.comments.slice(-3).map(c => {
    const cm = members.find(m => m.id === c.author);
    return `<div class="ac-comment-item">
      <div class="ac-comment-avatar ${avatarClass(cm?.role||'advogado')}">${initials(cm?.name||'?')}</div>
      <div class="ac-comment-bubble">
        <div class="ac-comment-author">${cm?.name||'–'}</div>
        <div class="ac-comment-text">${c.text}</div>
        <div class="ac-comment-time">${c.time}</div>
      </div>
    </div>`;
  }).join('');

  return `<div class="ac-card" id="ac-${ac.id}">
    <div class="ac-card-header" onclick="toggleACBody('${ac.id}')">
      <div class="ac-priority-dot" style="background:${prioColor}"></div>
      <div class="ac-info">
        <div class="ac-title">${ac.title}</div>
        <div class="ac-meta">
          <span>👤 Delegado por: <strong>${delegator?.name.split(' ').slice(0,2).join(' ')||'–'}</strong></span>
          <span style="display:flex;align-items:center;gap:6px">👥
            <div style="display:flex;gap:-4px;align-items:center">
              ${ac.participants.map(p => {
                const m = members.find(x => x.id === p.memberId);
                return m ? `<div title="${m.name}" style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--bg-secondary);border:1px solid var(--border);font-size:0.65rem;font-weight:700;margin-left:-8px">${initials(m.name)}</div>` : '';
              }).join('')}
            </div>
            ${ac.participants.length} ${ac.participants.length === 1 ? 'participante' : 'participantes'}
          </span>
          ${ac.process ? `<span>📄 ${ac.process}</span>` : ''}
          ${days !== null ? `<span style="color:${days<=1?'var(--danger)':days<=3?'var(--warn)':'var(--text-secondary)'}">📅 ${days<=0?'Vencida':days===1?'Amanhã':due.toLocaleDateString('pt-BR')}</span>` : ''}
        </div>
      </div>
      <div class="ac-header-right">
        <span class="badge ${prioBadge}">${ac.priority}</span>
        <span class="badge ${ac.status==='concluida'?'badge-success':'badge-info'}">${ac.status==='concluida'?'Concluída':'Ativa'}</span>
        ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openDetalheAC('${ac.id}')">⚙</button>` : ''}
        <span class="collapse-arrow open" id="arrow-${ac.id}">▼</span>
      </div>
    </div>
    <div class="ac-progress-wrap">
      <div class="ac-progress-label"><span>Progresso geral</span><span>${pct}%  (${doneSubs}/${allSubs.length} subtarefas)</span></div>
      <div class="ac-progress-track"><div class="ac-progress-fill ${pct===100?'done-full':''}" style="width:${pct}%"></div></div>
    </div>
    <div class="ac-body" id="acbody-${ac.id}">
      ${ac.desc ? `<div style="padding:12px 20px;font-size:.84rem;color:var(--text-secondary);border-bottom:1px solid var(--border)">${ac.desc}</div>` : ''}
      <div class="ac-participants">${participantsHTML}</div>
      <div class="ac-comments">
        <div class="ac-comment-title">💬 Comentários e Atualizações</div>
        <div id="ac-comments-${ac.id}">${commentsHTML}</div>
        <div class="ac-comment-form">
          <input class="ac-comment-input" id="ac-comment-input-${ac.id}" placeholder="Adicionar atualização ou comentário..." onkeydown="if(event.key==='Enter')addComment('${ac.id}')">
          <button class="btn btn-primary btn-sm" onclick="addComment('${ac.id}')">Enviar</button>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleACBody(id) {
  const body = document.getElementById('acbody-' + id);
  const arrow = document.getElementById('arrow-' + id);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (arrow) arrow.classList.toggle('open', !isOpen);
}

function toggleParticipantBlock(header) {
  const subtasks = header.nextElementSibling;
  const arrow = header.querySelector('.collapse-arrow');
  if (!subtasks) return;
  const isOpen = subtasks.style.display !== 'none';
  subtasks.style.display = isOpen ? 'none' : '';
  if (arrow) arrow.classList.toggle('open', !isOpen);
}

function toggleSubtask(acId, memberId, subtaskId) {
  const ac = sharedAC.find(a => a.id === acId);
  if (!ac) return;
  const participant = ac.participants.find(p => p.memberId === memberId);
  if (!participant) return;
  const st = participant.subtasks.find(s => s.id === subtaskId);
  if (!st) return;
  // Permission: only the participant themselves, or delegator/owner/socio can toggle
  const isOwner = currentUser && (currentUser.profile === 'socio' || currentUser.memberId === ac.delegator || currentUser.memberId === ac.owner);
  const isSelf = currentUser && currentUser.memberId === memberId;
  if (!isOwner && !isSelf) return;
  st.done = !st.done;
  // Auto-conclude if all done
  const allDone = ac.participants.flatMap(p => p.subtasks).every(s => s.done);
  if (allDone) ac.status = 'concluida';
  else if (ac.status === 'concluida') ac.status = 'ativa';
  save(STORAGE_KEYS.sharedAC, sharedAC);
  addActivity(`Subtarefa "${st.title.substring(0,25)}..." ${st.done?'concluída':'reaberta'}`, st.done?'#4caf7d':'#e0a44a');
  renderAC(acFilter);
}

function addComment(acId) {
  const input = document.getElementById('ac-comment-input-' + acId);
  if (!input || !input.value.trim()) return;
  const ac = sharedAC.find(a => a.id === acId);
  if (!ac) return;
  const now = new Date();
  ac.comments.push({
    author: currentUser?.memberId || 0,
    text: input.value.trim(),
    time: 'Hoje, ' + now.toTimeString().slice(0,5)
  });
  save(STORAGE_KEYS.sharedAC, sharedAC);
  input.value = '';
  renderAC(acFilter);
}

function filterAC(f, btn) {
  document.querySelectorAll('#missoes-atividades .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAC(f);
}

// ---- MODAL NOVA AC ----
let acParticipantsSelected = [];

function openModalNovaAC() {
  acParticipantsSelected = [];
  document.getElementById('acTitle').value = '';
  document.getElementById('acDesc').value = '';
  document.getElementById('acProcess').value = '';
  document.getElementById('acDue').value = '';
  document.getElementById('acPriority').value = 'normal';
  // Fill owner select (socio + advogados)
  const eligible = members.filter(m => m.role === 'advogado');
  document.getElementById('acOwner').innerHTML = eligible.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  // Participants picker
  renderParticipantsPicker();
  document.getElementById('acSubtasksSection').style.display = 'none';
  document.getElementById('modalNovaAC').classList.add('open');
}

function renderParticipantsPicker() {
  const eligible = members; // all members can participate
  document.getElementById('acParticipantsPicker').innerHTML = eligible.map(m => `
    <div class="participant-pick ${acParticipantsSelected.includes(m.id)?'selected':''}" onclick="toggleParticipant(${m.id})">
      <input type="checkbox" ${acParticipantsSelected.includes(m.id)?'checked':''} onclick="event.stopPropagation();toggleParticipant(${m.id})">
      <div class="member-avatar ${avatarClass(m.role)}" style="width:28px;height:28px;font-size:.65rem">${initials(m.name)}</div>
      <span class="participant-pick-name">${m.name}</span>
      <span class="participant-pick-role">${roleLabel(m.role)}</span>
    </div>`).join('');
}

function toggleParticipant(memberId) {
  const idx = acParticipantsSelected.indexOf(memberId);
  if (idx === -1) acParticipantsSelected.push(memberId);
  else acParticipantsSelected.splice(idx, 1);
  renderParticipantsPicker();
  renderSubtasksEditor();
  document.getElementById('acSubtasksSection').style.display = acParticipantsSelected.length ? '' : 'none';
}

function renderSubtasksEditor() {
  const editor = document.getElementById('acSubtasksEditor');
  editor.innerHTML = acParticipantsSelected.map(mid => {
    const m = members.find(x => x.id === mid);
    if (!m) return '';
    return `<div class="subtask-participant-group" id="stgroup-${mid}">
      <div class="subtask-group-label">
        <div class="member-avatar ${avatarClass(m.role)}" style="width:22px;height:22px;font-size:.55rem">${initials(m.name)}</div>
        ${m.name.split(' ').slice(0,2).join(' ')} — Subatividades
      </div>
      <div id="stlist-${mid}"></div>
      <button class="btn-add-subtask" onclick="addSubtaskField(${mid})">+ Adicionar subatividade</button>
    </div>`;
  }).join('');
  // Add one default field per participant
  acParticipantsSelected.forEach(mid => addSubtaskField(mid));
}

function addSubtaskField(mid) {
  const list = document.getElementById('stlist-' + mid);
  if (!list) return;
  const idx = list.children.length;
  const row = document.createElement('div');
  row.className = 'subtask-row';
  row.innerHTML = `<input class="subtask-input" placeholder="Descreva a subatividade..." data-member="${mid}" data-idx="${idx}">
    <button class="btn-icon" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}

function saveNovaAC() {
  const title = document.getElementById('acTitle').value.trim();
  const due   = document.getElementById('acDue').value;
  if (!title || !due) { alert('Preencha título e prazo.'); return; }
  if (!acParticipantsSelected.length) { alert('Selecione ao menos um participante.'); return; }

  const ownerId = parseInt(document.getElementById('acOwner').value);
  const delegatorId = currentUser?.memberId || ownerId;

  // Collect subtasks per participant
  const participants = acParticipantsSelected.map(mid => {
    const inputs = document.querySelectorAll(`[data-member="${mid}"]`);
    const subtasks = [];
    inputs.forEach((inp, i) => {
      const v = inp.value.trim();
      if (v) subtasks.push({ id: `st-${Date.now()}-${mid}-${i}`, title: v, done: false });
    });
    return { memberId: mid, subtasks };
  });

  const ac = {
    id: 'ac' + Date.now(),
    title,
    desc: document.getElementById('acDesc').value.trim(),
    process: document.getElementById('acProcess').value.trim(),
    due,
    priority: document.getElementById('acPriority').value,
    delegator: delegatorId,
    owner: ownerId,
    status: 'ativa',
    createdAt: new Date().toISOString().split('T')[0],
    participants,
    comments: [],
    delegationLog: [{
      from: delegatorId,
      to: acParticipantsSelected,
      at: 'Hoje, ' + new Date().toTimeString().slice(0,5),
      note: 'Atividade criada e delegada.'
    }]
  };

  sharedAC.unshift(ac);
  save(STORAGE_KEYS.sharedAC, sharedAC);
  addActivity(`Atividade compartilhada "${title.substring(0,30)}" criada`, '#c8a96e');
  _enviarEmailAC(ac, 'atividade_criada');
  closeModal('modalNovaAC');
  renderAC(acFilter);
}

// ---- MODAL DETALHE AC ----
function openDetalheAC(acId) {
  const ac = sharedAC.find(a => a.id === acId);
  if (!ac) return;
  const canEdit = currentUser && (currentUser.profile === 'socio' || currentUser.memberId === ac.delegator || currentUser.memberId === ac.owner);
  document.getElementById('detalheACTitle').textContent = '⚙ ' + ac.title;

  const allSubs = ac.participants.flatMap(p => p.subtasks);
  const doneSubs = allSubs.filter(s => s.done).length;
  const pct = allSubs.length ? Math.round(doneSubs/allSubs.length*100) : 0;

  const delegationLogHTML = ac.delegationLog.map(l => {
    const from = members.find(m => m.id === l.from);
    const tos = l.to.map(id => memberName(id)).join(', ');
    return `<div style="font-size:.8rem;padding:6px 0;border-bottom:1px solid var(--border)">
      <strong>${from?.name||'–'}</strong> → ${tos} <span style="color:var(--text-secondary)">· ${l.at}</span>
      ${l.note ? `<div style="color:var(--text-secondary);font-size:.75rem">${l.note}</div>` : ''}
    </div>`;
  }).join('');

  document.getElementById('detalheACBody').innerHTML = `
    <div class="grid-2" style="gap:12px;margin-bottom:16px">
      <div class="card"><div class="card-body"><div class="stat-label">Progresso</div><div style="font-size:1.4rem;font-weight:700;color:var(--primary)">${pct}%</div><div style="font-size:.75rem;color:var(--text-secondary)">${doneSubs}/${allSubs.length} subtarefas</div></div></div>
      <div class="card"><div class="card-body"><div class="stat-label">Status</div><div style="margin-top:4px"><span class="badge ${ac.status==='concluida'?'badge-success':'badge-info'}" style="font-size:.8rem">${ac.status==='concluida'?'Concluída':'Ativa'}</span></div></div></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="stat-label" style="margin-bottom:8px">Histórico de Delegação</div>
      ${delegationLogHTML || '<div style="font-size:.8rem;color:var(--text-secondary)">Sem histórico</div>'}
    </div>
    ${canEdit ? `
    <div style="margin-bottom:16px">
      <div class="stat-label" style="margin-bottom:8px">Reatribuir / Adicionar Participante</div>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="form-select" id="reattribMember" style="flex:1">${members.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" onclick="addParticipantToAC('${ac.id}')">+ Adicionar</button>
      </div>
    </div>` : ''}
  `;

  document.getElementById('detalheACFooter').innerHTML = canEdit ? `
    <button class="btn btn-danger btn-sm" onclick="deleteAC('${ac.id}')">Excluir Atividade</button>
    ${ac.status !== 'concluida' ? `<button class="btn btn-ghost btn-sm" onclick="concludeAC('${ac.id}')">✓ Marcar Concluída</button>` : `<button class="btn btn-ghost btn-sm" onclick="reopenAC('${ac.id}')">↩ Reabrir</button>`}
    <button class="btn btn-ghost" onclick="closeModal('modalDetalheAC')">Fechar</button>
  ` : `<button class="btn btn-ghost" onclick="closeModal('modalDetalheAC')">Fechar</button>`;

  document.getElementById('modalDetalheAC').classList.add('open');
}

function addParticipantToAC(acId) {
  const ac = sharedAC.find(a => a.id === acId);
  if (!ac) return;
  const mid = parseInt(document.getElementById('reattribMember').value);
  if (ac.participants.some(p => p.memberId === mid)) { alert('Participante já vinculado.'); return; }
  ac.participants.push({ memberId: mid, subtasks: [] });
  const m = members.find(x => x.id === mid);
  ac.delegationLog.push({
    from: currentUser?.memberId || 0,
    to: [mid],
    at: 'Hoje, ' + new Date().toTimeString().slice(0,5),
    note: `${m?.name||''} adicionado(a) como participante.`
  });
  save(STORAGE_KEYS.sharedAC, sharedAC);
  addActivity(`${m?.name} adicionado(a) à atividade "${ac.title.substring(0,25)}"`, '#5b8dee');
  closeModal('modalDetalheAC');
  renderAC(acFilter);
}

function concludeAC(acId) {
  const ac = sharedAC.find(a => a.id === acId);
  if (!ac) return;
  ac.status = 'concluida';
  save(STORAGE_KEYS.sharedAC, sharedAC);
  addActivity(`Atividade "${ac.title.substring(0,30)}" concluída`, '#4caf7d');
  closeModal('modalDetalheAC');
  renderAC(acFilter);
}
function reopenAC(acId) {
  const ac = sharedAC.find(a => a.id === acId);
  if (!ac) return;
  ac.status = 'ativa';
  save(STORAGE_KEYS.sharedAC, sharedAC);
  closeModal('modalDetalheAC');
  renderAC(acFilter);
}
function deleteAC(acId) {
  if (!confirm('Excluir esta atividade compartilhada?')) return;
  sharedAC = sharedAC.filter(a => a.id !== acId);
  save(STORAGE_KEYS.sharedAC, sharedAC);
  closeModal('modalDetalheAC');
  renderAC(acFilter);
}

// ============================================================
// HELPERS
// ============================================================
function fillAssigneeSelect(id) {
  document.getElementById(id).innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}
function fillSupervisorSelect() {
  const adv = members.filter(m => m.role === 'advogado');
  document.getElementById('memberSupervisor').innerHTML = `<option value="">– Selecione –</option>` + adv.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('open');
  modal.style.display = 'none';
}
function memberName(id) { const m = members.find(m => m.id === id); return m ? m.name.split(' ').slice(0,2).join(' ') : '–'; }
function initials(name) { return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function getAvatarHTML(member, size = 'normal', showBorder = false) {
  if (!member) return '';
  const sizeMap = { small: '30px', normal: '46px', large: '64px' };
  const sz = sizeMap[size] || sizeMap.normal;
  const border = showBorder ? `border:2px solid var(--primary);` : '';
  const baseStyle = `width:${sz};height:${sz};border-radius:50%;flex-shrink:0;${border}`;
  return member.photo
    ? `<img src="${member.photo}" style="${baseStyle}object-fit:cover">`
    : `<div class="member-avatar ${avatarClass(member.role)}" style="${baseStyle}font-size:${size === 'small' ? '0.68rem' : '0.85rem'};">${initials(member.name)}</div>`;
}
function roleLabel(r) { return r === 'socio' ? 'Sócio-Gestor' : r === 'advogado' ? 'Advogado(a)' : r === 'estagiario' ? 'Estagiário(a)' : 'Administrativo'; }
function avatarClass(r) { return r === 'socio' ? 'avatar-gold' : r === 'advogado' ? 'avatar-blue' : r === 'estagiario' ? 'avatar-green' : 'avatar-green'; }
function seniorityBadge(m) {
  return '';
}
function emptyState(msg) { return `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">${msg}</div></div>`; }
function updateNotifBadge(n) { document.getElementById('notifCount').textContent = n; }
function addActivity(text, color) {
  const now = new Date();
  activity.unshift({ text, color, time: 'Hoje, ' + now.toTimeString().slice(0,5) });
  if (activity.length > 50) activity.pop();
  save(STORAGE_KEYS.activity, activity);
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function toggleNotifPanel() {
  document.getElementById('notifPanel').classList.toggle('open');
  document.getElementById('notifOverlay').classList.toggle('open');
  if (document.getElementById('notifPanel').classList.contains('open')) renderNotifPanel();
}
function renderNotifPanel() {
  const _notifAlerts = (function(){ try { return JSON.parse(localStorage.getItem('vgai_notif_alerts')) || []; } catch { return []; } })();
  const unreadAlerts = _notifAlerts.filter(a => !a.read);
  const urgent = tasks.filter(t => t.priority === 'urgente' && !t.done);
  const overdue = prazos.filter(p => !p.done && new Date(p.date + 'T12:00:00') < new Date());
  // Pedidos de reset pendentes (apenas admin/socio)
  const isAdmin = currentUser?.profile === 'admin' || currentUser?.profile === 'socio';
  const resetRequests = isAdmin && typeof getPendingResetRequests === 'function'
    ? getPendingResetRequests() : [];
  const resetItems = resetRequests.map(r => ({
    icon: '🔑', iconClass: 'notif-icon-warn',
    title: 'Pedido de recuperação de senha',
    desc: `${r.userName} (${r.userEmail})`,
    time: new Date(r.createdAt).toLocaleString('pt-BR'),
    unread: true,
    resetUserId: r.userId,
  }));

  const items = [
    ...resetItems,
    ...unreadAlerts.filter(a => a.type === 'task_assign').map(a => ({ icon: '📋', iconClass: 'notif-icon-info', title: 'Tarefa atribuída a você', desc: a.title, time: a.time || 'Agora', unread: true })),
    ...unreadAlerts.filter(a => a.type === 'prazo').map(a => ({ icon: '⏰', iconClass: 'notif-icon-danger', title: `Prazo em ${a.days <= 0 ? 'vencido' : a.days + ' dia(s)'}`, desc: a.title, time: 'Alerta automático', unread: true })),
    ...urgent.map(t => ({ icon: '⚠️', iconClass: 'notif-icon-danger', title: 'Tarefa urgente', desc: t.title, time: 'Prazo: ' + (t.due ? new Date(t.due+'T12:00:00').toLocaleDateString('pt-BR') : '—'), unread: true })),
    ...overdue.map(p => ({ icon: '📅', iconClass: 'notif-icon-warn', title: 'Prazo vencido', desc: p.title, time: new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR'), unread: true })),
    ...activity.slice(0,5).map(a => ({ icon: '🔔', iconClass: 'notif-icon-info', title: 'Atividade', desc: a.text, time: a.time, unread: false })),
  ];
  const list = document.getElementById('notifList');
  if (!items.length) {
    list.innerHTML = '<div class="notif-empty"><div class="notif-empty-icon">🔔</div>Nenhuma notificação</div>';
    return;
  }
  list.innerHTML = items.map(n => `
    <div class="notif-item ${n.unread?'unread':''}">
      <div class="notif-icon ${n.iconClass}">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.time}</div>
        ${n.resetUserId ? `<button onclick="openResetPasswordModal('${n.resetUserId}')" style="margin-top:6px;padding:4px 10px;background:var(--primary);color:#000;border:none;border-radius:6px;font-size:0.78rem;font-weight:700;cursor:pointer;">🔑 Resetar Senha</button>` : ''}
      </div>
    </div>`).join('');
}
function markAllRead() {
  try {
    const alerts = JSON.parse(localStorage.getItem('vgai_notif_alerts')) || [];
    alerts.forEach(a => a.read = true);
    localStorage.setItem('vgai_notif_alerts', JSON.stringify(alerts));
  } catch {}
  updateNotifBadge(0);
  renderNotifPanel();
}

// ============================================================
// USUÁRIOS
// ============================================================
function openResetPasswordModal(userId) {
  // Fechar painel de notificações
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('notifOverlay')?.classList.remove('open');

  const u = users.find(x => x.id === userId);
  if (!u) return;

  // Remover modal anterior se existir
  document.getElementById('resetPasswordModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'resetPasswordModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999';
  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:28px;width:400px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">🔑 Resetar Senha</div>
        <button onclick="document.getElementById('resetPasswordModal').remove()" style="background:none;border:none;color:var(--text-secondary);font-size:1.2rem;cursor:pointer">✕</button>
      </div>
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:16px;font-size:0.88rem;color:var(--text-secondary)">
        Definindo nova senha para <strong style="color:var(--text-primary)">${u.name}</strong> (${u.email})
      </div>
      <div class="form-group">
        <label class="form-label">Nova Senha</label>
        <input id="resetNewPass" type="password" class="form-input" placeholder="Mínimo 6 caracteres">
      </div>
      <div class="form-group">
        <label class="form-label">Confirmar Nova Senha</label>
        <input id="resetConfirmPass" type="password" class="form-input" placeholder="Repetir senha">
      </div>
      <div id="resetPassError" style="display:none;color:#e05c5c;font-size:0.85rem;margin-bottom:12px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
        <button onclick="document.getElementById('resetPasswordModal').remove()" class="btn btn-ghost">Cancelar</button>
        <button onclick="confirmResetPassword('${userId}')" class="btn btn-primary">Salvar Nova Senha</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function confirmResetPassword(userId) {
  const newPass = document.getElementById('resetNewPass')?.value || '';
  const confirmPass = document.getElementById('resetConfirmPass')?.value || '';
  const errEl = document.getElementById('resetPassError');

  if (newPass.length < 6) {
    if (errEl) { errEl.textContent = 'A senha deve ter no mínimo 6 caracteres'; errEl.style.display = 'block'; }
    return;
  }
  if (newPass !== confirmPass) {
    if (errEl) { errEl.textContent = 'As senhas não coincidem'; errEl.style.display = 'block'; }
    return;
  }

  const result = await adminResetPassword(userId, newPass);
  if (result.error) {
    if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
    return;
  }

  document.getElementById('resetPasswordModal')?.remove();
  showNotification?.('✅ Senha redefinida com sucesso!', 'success');
  renderPage_usuarios();
  updateNotifBadgeFromAlerts();
}

function renderPage_usuarios() {
  const tbody = document.getElementById('usuariosBody');
  if (!tbody) return;

  // Banner de pedidos de reset pendentes (admin/socio)
  const isAdmin = currentUser?.profile === 'admin' || currentUser?.profile === 'socio';
  const resetBanner = document.getElementById('resetRequestsBanner');
  if (isAdmin && typeof getPendingResetRequests === 'function') {
    const pending = getPendingResetRequests();
    if (resetBanner) {
      if (pending.length > 0) {
        resetBanner.style.display = 'block';
        resetBanner.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-weight:700;color:#e09a3a;margin-bottom:4px">🔑 ${pending.length} pedido(s) de recuperação de senha pendente(s)</div>
              <div style="font-size:0.85rem;color:var(--text-secondary)">${pending.map(r => r.userName).join(', ')}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${pending.map(r => `<button class="btn btn-primary btn-sm" onclick="openResetPasswordModal('${r.userId}')">Resetar: ${r.userName}</button>`).join('')}
            </div>
          </div>
        `;
      } else {
        resetBanner.style.display = 'none';
      }
    }
  }
  const avatarColors = { socio: 'avatar-gold', advogado: 'avatar-blue', estagiario: 'avatar-green' };
  // Deduplica por ID (remove duplicatas vindas do Supabase)
  const seen = new Set();
  const dedupedUsers = users.filter(u => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
  tbody.innerHTML = dedupedUsers.map(u => {
    const perms = PERMISSIONS[u.profile] || {};
    const linked = u.memberId ? members.find(m => m.id === u.memberId) : null;
    const canEdit = canDo('canManageUsers');
    return `<tr>
      <td>
        <div class="user-row-avatar ${avatarColors[u.profile]||'avatar-gold'}">${initials(u.name)}</div>
        <strong>${u.name}</strong>
      </td>
      <td>${u.email}</td>
      <td><span class="role-pill ${perms.pillClass||''}">${perms.label||u.profile}</span></td>
      <td>${linked ? linked.name : '<span style="color:var(--text-secondary)">—</span>'}</td>
      <td><span class="user-status-active"><span class="user-status-dot"></span> Ativo</span></td>
      <td>
        <div style="display:flex;gap:6px;align-items:center;justify-content:flex-end">
          ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="openEditUser('${u.id}')">✏️ Editar</button>` : ''}
          ${canEdit && u.id !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Remover</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function deleteUser(uid) {
  if (!confirm('Remover usuário?')) return;
  users = users.filter(u => u.id !== uid);
  saveUsers(users);
  renderPage_usuarios();
}

function openEditUser(uid) {
  const u = users.find(x => x.id === uid);
  if (!u) return;

  const teamOptions = [1,2,3,4].map(t => {
    const info = typeof TEAM_NAMES !== 'undefined' ? (TEAM_NAMES[t] || {}) : {};
    const linked = members.find(m => m.id === u.memberId);
    const currentTeam = linked ? (linked.team || '') : '';
    return `<option value="${t}" ${currentTeam == t ? 'selected' : ''}>${info.name || 'Equipe '+t}</option>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'editUserModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999';
  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:28px;width:400px;max-width:95vw">
      <div style="font-size:1rem;font-weight:600;margin-bottom:20px">✏️ Editar Usuário</div>
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input id="editUserNome" class="form-control" value="${u.name}">
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input id="editUserEmail" class="form-control" value="${u.email}">
      </div>
      <div class="form-group">
        <label class="form-label">Equipe</label>
        <select id="editUserTeam" class="form-control">
          <option value="">— Sem equipe —</option>
          ${teamOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Nova Senha <span style="color:var(--text-secondary);font-size:0.75rem">(deixe em branco para não alterar)</span></label>
        <input id="editUserSenha" class="form-control" type="password" placeholder="••••••••">
      </div>
      <div class="form-group">
        <label class="form-label">Confirmar Senha</label>
        <input id="editUserSenhaConfirm" class="form-control" type="password" placeholder="••••••••">
      </div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn btn-primary" style="flex:1" onclick="saveEditUser('${uid}')">Salvar</button>
        <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('editUserModal').remove()">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function saveEditUser(uid) {
  const u = users.find(x => x.id === uid);
  if (!u) return;

  const nome   = document.getElementById('editUserNome').value.trim();
  const email  = document.getElementById('editUserEmail').value.trim();
  const team   = parseInt(document.getElementById('editUserTeam').value) || null;
  const senha  = document.getElementById('editUserSenha').value;
  const senha2 = document.getElementById('editUserSenhaConfirm').value;

  if (!nome || !email) { alert('Nome e e-mail são obrigatórios'); return; }
  if (senha && senha !== senha2) { alert('As senhas não coincidem'); return; }
  if (senha && senha.length < 6) { alert('A senha deve ter pelo menos 6 caracteres'); return; }

  // Atualiza usuário
  u.name  = nome;
  u.email = email;
  if (senha) u.password = senha;

  // Atualiza membro vinculado
  if (u.memberId) {
    const m = members.find(x => x.id === u.memberId);
    if (m) {
      m.name  = nome;
      m.email = email;
      if (team) m.team = team;
      save(STORAGE_KEYS.members, members);
    }
  }

  saveUsers(users); // salva e sincroniza Supabase

  document.getElementById('editUserModal').remove();
  renderPage_usuarios();
  showNotification('✅ Usuário atualizado!', 'success');
}

let editingUserId = null;
function openModalNovoUsuario(uid) {
  editingUserId = uid || null;
  document.getElementById('nuNome').value = '';
  document.getElementById('nuEmail').value = '';
  document.getElementById('nuSenha').value = '';
  document.getElementById('nuOab').value = '';
  document.getElementById('nuArea').value = '';
  document.getElementById('nuInst').value = '';
  document.getElementById('nuPerfil').value = 'socio';
  document.getElementById('nuEquipe').value = '';
  document.getElementById('nuError').classList.remove('show');
  document.getElementById('novoUsuarioTitle').textContent = uid ? '✏️ Editar Usuário' : '👤 Novo Usuário';
  // Fill supervisor select
  const adv = members.filter(m => m.role === 'advogado');
  document.getElementById('nuSupervisor').innerHTML = `<option value="">— Selecione —</option>` + adv.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  updateNovoUsuarioForm();
  document.getElementById('modalNovoUsuario').classList.add('open');
}

function updateNovoUsuarioForm() {
  const perfil = document.getElementById('nuPerfil').value;
  document.getElementById('nuOabGroup').style.display  = perfil === 'advogado' ? '' : 'none';
  document.getElementById('nuAreaGroup').style.display = perfil === 'advogado' ? '' : 'none';
  document.getElementById('nuInstGroup').style.display = perfil === 'estagiario' ? '' : 'none';
  document.getElementById('nuSupervisorGroup').style.display = perfil === 'estagiario' ? '' : 'none';
}

function salvarNovoUsuario() {
  const nome   = document.getElementById('nuNome').value.trim();
  const email  = document.getElementById('nuEmail').value.trim().toLowerCase();
  const senha  = document.getElementById('nuSenha').value;
  const perfil = document.getElementById('nuPerfil').value;
  const err    = document.getElementById('nuError');

  if (!nome || !email || !senha) { err.textContent = 'Preencha nome, e-mail e senha.'; err.classList.add('show'); return; }
  if (users.find(u => u.email === email)) { err.textContent = 'Este e-mail já está cadastrado.'; err.classList.add('show'); return; }

  // Create linked member
  const memberId = Date.now();
  const newMember = {
    id: memberId,
    name: nome,
    role: perfil === 'socio' ? 'advogado' : perfil,
    oab:  document.getElementById('nuOab').value,
    area: document.getElementById('nuArea').value,
    inst: document.getElementById('nuInst').value,
    supervisor: parseInt(document.getElementById('nuSupervisor').value) || null,
    email,
    workload: 0,
    team: parseInt(document.getElementById('nuEquipe').value) || null,
  };
  members.push(newMember);
  save(STORAGE_KEYS.members, members);

  const newUser = { id: 'u' + memberId, email, password: senha, profile: perfil, name: nome, memberId };
  users.push(newUser);
  saveUsers(users);

  addActivity(`Usuário "${nome}" criado`, '#c8a96e');
  closeModal('modalNovoUsuario');
  renderPage_usuarios();
}

// ============================================================
// KANBAN
// ============================================================
const KANBAN_COLS = [
  { id: 'todo',    label: 'A Fazer',       color: '#6b7190' },
  { id: 'doing',   label: 'Em Andamento',  color: '#5b8dee' },
  { id: 'review',  label: 'Em Revisão',    color: '#e0a44a' },
  { id: 'done',    label: 'Concluído',     color: '#4caf7d' },
];

const PRIO_COLOR = { urgente: '#e05c5c', normal: '#5b8dee', baixa: '#6b7190' };

let kanbanFilter = 'todas';
let kanbanTeamFilter = '';   // '' = Missões Gerais, '1'..'4' = equipe específica
let dragSrcId = null;

function setKanbanTeam(teamId, btn) {
  kanbanTeamFilter = teamId;
  document.querySelectorAll('.missao-scope-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // Reset member select ao trocar de equipe
  const sel = document.getElementById('kanbanMemberFilter');
  if (sel) { sel.innerHTML = '<option value="">Todos os membros</option>'; }
  renderKanban();
}

function getTaskStatus(t) {
  if (t.kanbanStatus) return t.kanbanStatus;
  return t.done ? 'done' : 'todo';
}

function setTaskStatus(id, status) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  const statusAnterior = t.kanbanStatus;
  t.kanbanStatus = status;
  t.done = (status === 'done');
  save(STORAGE_KEYS.tasks, tasks);
  _sbSave('lex_tasks', tasks);
  // 📧 Email notificação - status mudou
  if (statusAnterior !== status) _enviarEmailMissao(t, 'status_mudou');
}

function filterKanban(f, btn) {
  kanbanFilter = f;
  document.querySelectorAll('#missoes-quadro .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderKanban();
}

function renderKanban() {
  // Determina membros da equipe selecionada
  const teamId = kanbanTeamFilter ? parseInt(kanbanTeamFilter) : null;
  const teamMembers = teamId
    ? members.filter(m => (m.teams || [m.team]).includes(teamId))
    : members;

  // Preenche select de membros filtrado pela equipe
  const sel = document.getElementById('kanbanMemberFilter');
  if (sel) {
    const cur = parseInt(sel.value) || null;
    sel.innerHTML = '<option value="">Todos os membros</option>';
    teamMembers.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.name.split(' ').slice(0,2).join(' ');
      if (m.id === cur) o.selected = true;
      sel.appendChild(o);
    });
  }
  const memberFilter = sel ? parseInt(sel.value) || null : null;

  // Info bar da equipe
  const infoBar = document.getElementById('kanbanTeamInfo');
  if (teamId && infoBar) {
    const info = TEAM_NAMES[teamId];
    const teamColors = { 1:'rgba(224,92,92,.08)', 2:'rgba(91,141,238,.08)', 3:'rgba(76,175,125,.08)', 4:'rgba(200,169,110,.08)' };
    const teamBorders = { 1:'rgba(224,92,92,.25)', 2:'rgba(91,141,238,.25)', 3:'rgba(76,175,125,.25)', 4:'rgba(200,169,110,.25)' };
    const avatarsHTML = teamMembers.map(m =>
      m.photo
        ? `<div class="kan-mini-avatar" title="${m.name}" style="overflow:hidden"><img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></div>`
        : `<div class="kan-mini-avatar ${avatarClass(m.role)}" title="${m.name}">${initials(m.name)}</div>`
    ).join('');
    const municipiosHTML = (info.municipios || []).map(mu =>
      `<span class="chip" style="font-size:.68rem">${mu}</span>`
    ).join('');
    infoBar.style.display = '';
    infoBar.style.background = teamColors[teamId] || 'var(--bg-secondary)';
    infoBar.style.border = `1px solid ${teamBorders[teamId] || 'var(--border)'}`;
    infoBar.innerHTML = `
      <span style="font-size:1.6rem">${info.icon}</span>
      <div>
        <div class="kanban-team-info-name">${info.name}</div>
        <div class="kanban-team-info-area">Órgão: ${info.area} · ${teamMembers.length} membros</div>
        ${info.municipios?.length ? `<div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">${municipiosHTML}</div>` : ''}
      </div>
      <div class="kanban-team-info-members" style="margin-left:auto">${avatarsHTML}</div>
    `;
  } else if (infoBar) {
    infoBar.style.display = 'none';
  }

  let pool = [...getUserTasks()];
  // Filtra pela equipe primeiro
  if (teamId) pool = pool.filter(t => teamMembers.some(m => m.id === t.assignee));

  if (kanbanFilter === 'minhas') {
    const mid = currentUser?.memberId;
    pool = pool.filter(t => t.assignee === mid);
  } else if (kanbanFilter === 'urgente') {
    pool = pool.filter(t => t.priority === 'urgente');
  }
  if (memberFilter) pool = pool.filter(t => t.assignee === memberFilter);

  const board = document.getElementById('kanbanBoard');
  board.innerHTML = KANBAN_COLS.map(col => {
    const colTasks = pool.filter(t => getTaskStatus(t) === col.id);
    return `
    <div class="kanban-col" id="kancol-${col.id}">
      <div class="kanban-col-header">
        <div class="kanban-col-title">
          <div class="kanban-col-dot" style="background:${col.color}"></div>
          ${col.label}
        </div>
        <span class="kanban-col-count">${colTasks.length}</span>
      </div>
      <div class="kanban-col-body"
        id="kanbody-${col.id}"
        ondragover="kanDragOver(event,'${col.id}')"
        ondragleave="kanDragLeave(event)"
        ondrop="kanDrop(event,'${col.id}')">
        ${colTasks.map(t => kanCardHTML(t)).join('')}
      </div>
      <div class="kanban-col-footer">
        <button class="kanban-add-card" onclick="openKanbanAdd('${col.id}')">+ Adicionar cartão</button>
      </div>
    </div>`;
  }).join('');

  // Attach drag events
  board.querySelectorAll('.kanban-card').forEach(card => {
    // Evitar adicionar listeners múltiplas vezes
    if (card.dataset.dragListenerAdded) return;
    card.dataset.dragListenerAdded = 'true';

    card.addEventListener('dragstart', e => {
      dragSrcId = parseInt(card.dataset.id);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
}

function kanCardHTML(t) {
  const m = members.find(x => x.id === t.assignee);
  const due = t.due ? new Date(t.due + 'T12:00:00') : null;
  const days = due ? Math.ceil((due - new Date()) / 86400000) : null;
  const dueClass = days === null ? '' : days < 0 ? 'overdue' : days <= 2 ? 'soon' : '';
  const dueText = days === null ? '' : days < 0 ? 'Vencida' : days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : due.toLocaleDateString('pt-BR');
  const attachCount = (t.attachments || []).length;
  const cl = t.checklist || [];
  const clDone = cl.filter(c => c.done).length;
  const prioColor = PRIO_COLOR[t.priority] || '#6b7190';

  // Labels/Etiquetas
  const labelColors = { 'Prazo': '#e05c5c', 'Audiência': '#ff6b6b', 'Petição': '#4caf7d', 'Contrato': '#5b8dee', 'Recurso': '#9c27b0', 'Consultoria': '#ffa94d', 'Diligência': '#e09a3a', 'Intimação': '#74b9ff', ...(t.customLabels || {}) };
  const labelsHTML = t.labels && t.labels.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">${t.labels.map(l =>
        `<span style="padding:1px 7px;background:${labelColors[l]||'#5b8dee'}22;color:${labelColors[l]||'#5b8dee'};border:1px solid ${labelColors[l]||'#5b8dee'}44;border-radius:3px;font-size:.6rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase">${l}</span>`
      ).join('')}</div>`
    : '';

  // Meta chips
  const metaChips = [];
  if (t.tipo) metaChips.push(`<span class="kc-meta-chip">${tipoLabel(t.tipo)}</span>`);
  if (t.process) metaChips.push(`<span class="kc-meta-chip" title="${t.process}">📁 ${t.process.length > 20 ? t.process.slice(0,18)+'…' : t.process}</span>`);
  if (cl.length) metaChips.push(`<span class="kc-meta-chip">✓ ${clDone}/${cl.length}</span>`);
  if (attachCount) metaChips.push(`<span class="kc-meta-chip" onclick="event.stopPropagation();openAttachments(${t.id})" style="cursor:pointer">📎 ${attachCount}</span>`);
  const metaHTML = metaChips.length ? `<div class="kc-meta">${metaChips.join('')}</div>` : '';

  // Avatar
  const avatarHTML = m
    ? (m.photo
        ? `<img src="${m.photo}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.1)">`
        : `<div class="kanban-card-avatar ${avatarClass(m.role)}">${initials(m.name)}</div>`)
    : '';

  return `<div class="kanban-card" draggable="true" data-id="${t.id}" onclick="event.stopPropagation(); openTaskDetail(${t.id})" style="cursor:pointer">
    <div class="kanban-card-prio-bar" style="background:${prioColor}"></div>
    ${labelsHTML}
    <div class="kanban-card-top">
      <div class="kanban-card-title">${t.title}</div>
    </div>
    ${metaHTML}
    <div class="kanban-card-footer">
      <div class="kanban-card-assignee">
        ${avatarHTML}
        ${m ? `<span class="kanban-card-name">${m.name.split(' ')[0]}</span>` : '<span class="kanban-card-name" style="opacity:.35">Sem responsável</span>'}
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        ${due ? `<span class="kc-meta-chip ${dueClass}">⏱ ${dueText}</span>` : ''}
        <div class="kc-actions">
          <button class="kc-action-btn" onclick="event.stopPropagation();openEditTask(${t.id})" title="Editar">✏</button>
          <button class="kc-action-btn del" onclick="event.stopPropagation();deleteTask(${t.id})" title="Deletar">✕</button>
        </div>
      </div>
    </div>
  </div>`;
}

function kanDragOver(e, colId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.kanban-col-body').forEach(b => b.classList.remove('drag-over'));
  document.getElementById('kanbody-' + colId)?.classList.add('drag-over');
}
function kanDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}
function kanDrop(e, colId) {
  e.preventDefault();
  document.querySelectorAll('.kanban-col-body').forEach(b => b.classList.remove('drag-over'));
  if (dragSrcId === null) return;
  const t = tasks.find(x => x.id === dragSrcId);
  if (t) {
    const fromStatus = getTaskStatus(t);
    const fromLabel = KANBAN_COLS.find(c => c.id === fromStatus)?.label || fromStatus;
    const toLabel = KANBAN_COLS.find(c => c.id === colId)?.label || colId;
    if (!t.kanbanHistory) t.kanbanHistory = [];
    t.kanbanHistory.push({ from: fromStatus, to: colId, fromLabel, toLabel, by: currentUser?.memberId || null, at: new Date().toLocaleString('pt-BR') });
    if (t.kanbanHistory.length > 15) t.kanbanHistory = t.kanbanHistory.slice(-15);
  }
  setTaskStatus(dragSrcId, colId);
  addActivity(`Tarefa movida para "${KANBAN_COLS.find(c=>c.id===colId)?.label}"`, '#5b8dee');
  dragSrcId = null;
  renderKanban();
}

// ============================================================
// FILE ATTACHMENTS
// ============================================================
let pendingAttachments = [];

function handleFileSelect(input) {
  Array.from(input.files).forEach(file => {
    if (file.size > 1.5 * 1024 * 1024) { alert(`"${file.name}" é maior que 1.5 MB.\n\nOs anexos usam armazenamento local do navegador. Se ficar sem espaço, use Configurações > Sistema > Limpar Anexos.`); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const attachId = 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      // Store only metadata in the task; binary data goes to separate storage
      pendingAttachments.push({ id: attachId, name: file.name, type: file.type, size: file.size, _data: e.target.result });
      renderAttachPreview();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderAttachPreview() {
  const el = document.getElementById('attachPreview');
  if (!el) return;
  if (!pendingAttachments.length) {
    el.innerHTML = '<span class="attach-hint">📎 Clique ou arraste arquivos aqui</span>';
    return;
  }
  el.innerHTML = pendingAttachments.map((a, i) => `
    <div class="attach-item">
      <span class="attach-icon">${attachIcon(a.type)}</span>
      <span class="attach-name" title="${a.name}">${a.name}</span>
      <span class="attach-size">${formatBytes(a.size)}</span>
      <button class="attach-remove" onclick="removeAttach(${i});event.stopPropagation()">✕</button>
    </div>
  `).join('');
}

function removeAttach(i) {
  pendingAttachments.splice(i, 1);
  renderAttachPreview();
}

function attachIcon(type) {
  if (!type) return '📎';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return '📊';
  if (type.includes('zip') || type.includes('rar') || type.includes('compress')) return '🗜️';
  return '📎';
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

function openAttachments(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  const list = document.getElementById('attachmentsList');
  const atts = t.attachments || [];
  if (!atts.length) { list.innerHTML = '<span class="attach-hint">Nenhum anexo nesta tarefa.</span>'; }
  else {
    list.innerHTML = atts.map((a) => {
      const data = a.data || getAttachmentData(a.id);
      const dlBtn = data
        ? `<a href="${data}" download="${a.name}" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:.72rem">Baixar</a>`
        : `<span style="font-size:.72rem;color:var(--text-secondary)">indisponível</span>`;
      return `<div class="attach-item">
        <span class="attach-icon">${attachIcon(a.type)}</span>
        <span class="attach-name" title="${a.name}">${a.name}</span>
        <span class="attach-size">${formatBytes(a.size)}</span>
        ${dlBtn}
        <button class="attach-remove" onclick="removeTaskAttachment(${taskId},'${a.id}')">✕</button>
      </div>`;
    }).join('');
  }
  document.getElementById('modalAttachments').classList.add('open');
}

function removeTaskAttachment(taskId, attachId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  t.attachments = (t.attachments || []).filter(a => a.id !== attachId);
  deleteAttachment(attachId);
  save(STORAGE_KEYS.tasks, tasks);
  openAttachments(taskId);
  renderPage(currentPage);
}

function attachDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('attachZone').classList.add('drag-active');
}
function attachDragLeave(e) {
  e.stopPropagation();
  document.getElementById('attachZone').classList.remove('drag-active');
}
function attachDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('attachZone').classList.remove('drag-active');
  const dt = e.dataTransfer;
  if (dt && dt.files.length) handleFileSelect(dt);
}

function openKanbanAdd(colId) {
  fillAssigneeSelect('taskAssignee');
  fillMunicipioSelect();
  clearTaskForm();
  const modalTask = document.getElementById('modalTask');
  modalTask.style.display = 'flex';
  modalTask.classList.add('open');
  // Store target column to set after save
  document.getElementById('modalTask').dataset.kanbanCol = colId;
}

let missionView = 'quadro';
function switchMissionView(v) {
  missionView = v;
  document.getElementById('missoes-quadro').style.display = v === 'quadro' ? '' : 'none';
  document.getElementById('missoes-atividades').style.display = v === 'atividades' ? '' : 'none';
  document.getElementById('tab-quadro').classList.toggle('active', v === 'quadro');
  document.getElementById('tab-atividades').classList.toggle('active', v === 'atividades');
  if (v === 'quadro') renderKanban();
  else if (v === 'atividades') renderAC('todas');
}

// renderPage is fully defined above with all page handlers (missoes, usuarios, relatorios included)

// ============================================================
// FEATURE 1: LIGHT/DARK THEME TOGGLE
// ============================================================
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('vgai_theme', isLight ? 'light' : 'dark');
  document.getElementById('themeToggleBtn').textContent = isLight ? '☀️' : '🌙';
  // Redesenha gráfico se estiver na página de relatórios
  if (currentPage === 'relatorios') setTimeout(renderRelatorios, 50);
}
function applyTheme() {
  const saved = localStorage.getItem('vgai_theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light-mode');
    document.getElementById('themeToggleBtn').textContent = '☀️';
  }
}

// ============================================================
// FEATURE 2: GLOBAL SEARCH
// ============================================================
function openGlobalSearch() {
  document.getElementById('globalSearchOverlay').classList.add('open');
  setTimeout(() => document.getElementById('globalSearchInput').focus(), 50);
}
function openGlobalSearchAndSearch(val) {
  openGlobalSearch();
  document.getElementById('globalSearchInput').value = val;
  runGlobalSearch(val);
}
function closeGlobalSearch() {
  document.getElementById('globalSearchOverlay').classList.remove('open');
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('globalSearchResults').innerHTML = '<div class="gs-empty">Digite para buscar...</div>';
}
function runGlobalSearch(val) {
  const q = val.trim().toLowerCase();
  const resultsEl = document.getElementById('globalSearchResults');
  if (!q) { resultsEl.innerHTML = '<div class="gs-empty">Digite para buscar...</div>'; return; }
  let html = '';
  // Tarefas
  const tRes = tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5);
  if (tRes.length) {
    html += `<div class="gs-group-label">Tarefas</div>`;
    html += tRes.map(t => `<div class="gs-result-item" onclick="closeGlobalSearch();navigate('missoes');setTimeout(()=>openEditTask(${t.id}),300)">
      <span class="gs-result-icon">📋</span>
      <div class="gs-result-text"><div>${t.title}</div><div class="gs-result-sub">${memberName(t.assignee)} · ${t.priority}</div></div>
    </div>`).join('');
  }
  // Prazos
  const pRes = prazos.filter(p => p.title.toLowerCase().includes(q)).slice(0, 5);
  if (pRes.length) {
    html += `<div class="gs-group-label">Prazos</div>`;
    html += pRes.map(p => `<div class="gs-result-item" onclick="closeGlobalSearch();navigate('calendario');switchCalendarView('prazos')">
      <span class="gs-result-icon">📅</span>
      <div class="gs-result-text"><div>${p.title}</div><div class="gs-result-sub">${memberName(p.resp)} · ${p.date}</div></div>
    </div>`).join('');
  }
  // Membros
  const mRes = members.filter(m => m.name.toLowerCase().includes(q)).slice(0, 5);
  if (mRes.length) {
    html += `<div class="gs-group-label">Membros</div>`;
    html += mRes.map(m => `<div class="gs-result-item" onclick="closeGlobalSearch();showProfile(${m.id})">
      <span class="gs-result-icon">👤</span>
      <div class="gs-result-text"><div>${m.name}</div><div class="gs-result-sub">${roleLabel(m.role)}</div></div>
    </div>`).join('');
  }
  if (!html) html = '<div class="gs-empty">Nenhum resultado encontrado.</div>';
  resultsEl.innerHTML = html;
}

// ============================================================
// FEATURE 3: KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', function(e) {
  const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  const inInput = tag === 'input' || tag === 'textarea' || tag === 'select';

  // Escape: close open modals or search overlay
  if (e.key === 'Escape') {
    if (document.getElementById('globalSearchOverlay').classList.contains('open')) {
      closeGlobalSearch(); return;
    }
    const openModal = document.querySelector('.modal-overlay.open');
    if (openModal) { closeModal(openModal.id); return; }
  }

  if (!inInput) {
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openTaskModal(); }
    else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); openPrazoModal(); }
    else if (e.key === '/') { e.preventDefault(); openGlobalSearch(); }
  }
});

// ============================================================
// FEATURE 4: TIPO DE DEMANDA HELPERS
// ============================================================
const TIPO_LABELS = { recurso:'Recurso', peticao:'Petição', contestacao:'Contestação', parecer:'Parecer', habeas_corpus:'HC', mandado:'Mandado', outros:'Outros' };
function tipoLabel(v) { return TIPO_LABELS[v] || v; }

// ============================================================
// CALENDÁRIO JURÍDICO
// ============================================================
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderCalendario() {
  fillCalFilters();
  document.getElementById('calMonthLabel').textContent =
    MONTH_NAMES[calMonth] + ' ' + calYear;

  const events = buildCalEvents();
  const filtered = filterCalEvents(events);
  drawCalGrid(filtered);
}

function fillCalFilters() {
  const selMembro = document.getElementById('calFilterMembro');
  const prevMembro = selMembro.value;
  selMembro.innerHTML = '<option value="">Todos os responsáveis</option>' +
    members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  selMembro.value = prevMembro;

  const selMun = document.getElementById('calFilterMunicipio');
  const prevMun = selMun.value;
  selMun.innerHTML = '<option value="">Todos os municípios</option>' +
    municipios.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  selMun.value = prevMun;
}

function buildCalEvents() {
  const events = [];
  const today = new Date(); today.setHours(0,0,0,0);

  prazos.forEach(p => {
    if (!p.date) return;
    const d = new Date(p.date + 'T12:00:00');
    const diffDays = Math.ceil((d - today) / 86400000);
    let cssClass = p.done ? 'ev-concluido'
      : p.urgency === 'critico' ? 'ev-critico' : 'ev-prazo';
    let label = p.title;
    if (!p.done && diffDays <= 0) label = '⚠ ' + label;
    else if (!p.done && diffDays === 1) label = 'D-1 ' + label;
    else if (!p.done && diffDays === 2) label = 'D-2 ' + label;
    events.push({
      date: p.date, label, cssClass,
      type: 'prazo', id: p.id,
      memberId: p.resp, municipioId: p.municipio || null
    });
  });

  // Adicionar prazos dos processos ao calendário
  (processos || []).forEach(proc => {
    if (!proc.proximoPrazo) return;
    const d = new Date(proc.proximoPrazo + 'T12:00:00');
    const diffDays = Math.ceil((d - today) / 86400000);

    // Determinar classe CSS baseado no status do processo
    let cssClass = 'ev-prazo'; // padrão
    if (proc.status === 'encerrado' || proc.status === 'arquivado') {
      cssClass = 'ev-concluido';
    } else if (diffDays <= 0) {
      cssClass = 'ev-critico'; // vencido
    } else if (proc.urgency === 'critica') {
      cssClass = 'ev-critico';
    }

    // Label com ícone de processo e número
    let label = '⚖️ ' + (proc.numero || 'Processo');
    if (!proc.proximoPrazo && diffDays <= 0) label = '⚠ ' + label;
    else if (!proc.proximoPrazo && diffDays === 1) label = 'D-1 ' + label;
    else if (!proc.proximoPrazo && diffDays === 2) label = 'D-2 ' + label;

    events.push({
      date: proc.proximoPrazo, label, cssClass,
      type: 'processo', id: proc.id,
      memberId: proc.responsavelId || null,
      municipioId: proc.municipioId || null,
      processoNumero: proc.numero
    });
  });

  tasks.forEach(t => {
    if (!t.due) return;
    let cssClass = t.done ? 'ev-concluido' : 'ev-tarefa';
    events.push({
      date: t.due, label: t.title, cssClass,
      type: 'tarefa', id: t.id,
      memberId: t.assignee, municipioId: t.municipio || null
    });
  });

  sharedAC.forEach(ac => {
    if (!ac.due) return;
    let cssClass = ac.status === 'concluida' ? 'ev-concluido' : 'ev-tarefa';
    const participantIds = (ac.participants || []).map(p => p.memberId);
    events.push({
      date: ac.due, label: '🤝 ' + ac.title, cssClass,
      type: 'ac', id: ac.id,
      memberId: ac.owner, participantIds, municipioId: null
    });
  });

  return events;
}

function filterCalEvents(events) {
  const memId = parseInt(document.getElementById('calFilterMembro').value) || null;
  const munId = parseInt(document.getElementById('calFilterMunicipio').value) || null;

  return events.filter(e => {
    if (memId) {
      const isAssignee = e.memberId === memId;
      const isParticipant = (e.participantIds || []).includes(memId);
      if (!isAssignee && !isParticipant) return false;
    }
    if (munId && e.municipioId !== munId) return false;
    return true;
  });
}

function drawCalGrid(events) {
  const grid = document.getElementById('calGrid');
  const today = new Date(); today.setHours(0,0,0,0);

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth + 1, 0);
  const startDow = firstDay.getDay();

  const evMap = {};
  events.forEach(e => {
    if (!evMap[e.date]) evMap[e.date] = [];
    evMap[e.date].push(e);
  });

  let html = '';
  const prevLast = new Date(calYear, calMonth, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevLast - i;
    const dateStr = dateKey(calYear, calMonth - 1, d);
    html += dayCell(calYear, calMonth - 1, d, dateStr, evMap, today, true);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = dateKey(calYear, calMonth, d);
    html += dayCell(calYear, calMonth, d, dateStr, evMap, today, false);
  }
  const filled = startDow + lastDay.getDate();
  const remaining = filled % 7 === 0 ? 0 : 7 - (filled % 7);
  for (let d = 1; d <= remaining; d++) {
    const dateStr = dateKey(calYear, calMonth + 1, d);
    html += dayCell(calYear, calMonth + 1, d, dateStr, evMap, today, true);
  }

  grid.innerHTML = html;
}

function dayCell(y, m, d, dateStr, evMap, today, otherMonth) {
  const cellDate = new Date(y, m, d);
  const isToday = cellDate.getTime() === today.getTime();
  const evs = evMap[dateStr] || [];
  const MAX_SHOW = 3;
  const shown = evs.slice(0, MAX_SHOW);
  const extra = evs.length - MAX_SHOW;

  let evHtml = shown.map(e =>
    `<div class="cal-event ${e.cssClass}" onclick="event.stopPropagation(); calClickEvent('${e.type}',${e.id})" title="${e.label}">${e.label}</div>`
  ).join('');
  if (extra > 0) evHtml += `<div class="cal-more" onclick="event.stopPropagation(); calShowDayEvents('${dateStr}')" title="Ver todos os eventos">+${extra} mais</div>`;

  return `<div class="cal-day${otherMonth?' other-month':''}${isToday?' today':''}${evs.length > 0 ? ' has-events' : ''}" onclick="if(event.target === this || event.target.classList.contains('cal-day-num')) calShowDayEvents('${dateStr}')">
    <div class="cal-day-num" onclick="event.stopPropagation()">${d}</div>
    ${evHtml}
  </div>`;
}

function dateKey(y, m, d) {
  const dt = new Date(y, m, d);
  return dt.toISOString().slice(0, 10);
}

function calNavMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendario();
}

function calGoToday() {
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  renderCalendario();
}

function calClickEvent(type, id) {
  if (type === 'tarefa') {
    openTaskDetail(id);
  } else if (type === 'prazo') {
    switchCalendarView('prazos');
    setTimeout(() => {
      const row = document.querySelector(`[data-prazo-id="${id}"]`);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  } else if (type === 'ac') {
    const ac = sharedAC.find(a => a.id === id);
    if (ac) openDetalheAC(ac);
  } else if (type === 'processo') {
    // Abrir modal de detalhes do processo
    if (window.openProcessoDetail) {
      window.openProcessoDetail(id);
    } else if (window.openProcessoModal) {
      window.openProcessoModal(id);
    }
  }
}

let currentTaskDetailId = null;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openTaskDetail(id) {
  console.log(`📂 openTaskDetail chamado para task ${id}`);
  try {
    const t = tasks.find(x => x.id === id);
    if (!t) { console.warn('❌ Task not found:', id); return; }

    currentTaskDetailId = id;
    const due = t.due ? new Date(t.due + 'T12:00:00') : null;
    const assignee = members.find(m => m.id === t.assignee);
    const municipio = municipios.find(m => m.id === parseInt(t.municipio));

    console.log('✅ Task encontrada:', t.title);

    // Cores por prioridade
    const prioColors = { urgente: '#e05c5c', normal: '#5b8dee', baixa: '#4caf7d' };
    const prioColor = prioColors[t.priority] || '#5b8dee';

    // LAYOUT: Esquerda (Detalhes) + Direita (Comentários)
    let html = `
      <div style="display: flex; gap: 18px; height: 100%; overflow: hidden;">

        <!-- ESQUERDA: Detalhes + Checklist -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
          <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 8px;">

            <!-- DETALHES -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${renderTaskDetailPane(t, assignee, municipio, due)}
            </div>

            <!-- CHECKLIST -->
            <div style="border-top: 1px solid var(--border); padding-top: 10px;">
              <div style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px;">✓ Checklist</div>
              <div id="taskDetailChecklistPane" style="display: flex; flex-direction: column; gap: 5px;">
                ${renderTaskChecklistPane(t)}
              </div>
            </div>

          </div>
        </div>

        <!-- DIREITA: Comentários & Atividade -->
        <div style="width: 290px; border-left: 1px solid var(--border); padding-left: 14px; display: flex; flex-direction: column; overflow: hidden;">
          <div style="font-size: 0.6rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">💬 Comentários & Atividade</div>
          <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${t.comments && t.comments.length > 0 ? renderTaskActivityFeed(t) : `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-secondary);padding:20px 0;">
                <div style="font-size:2rem;opacity:0.3;">💬</div>
                <div style="font-size:0.8rem;text-align:center;opacity:0.6;">Nenhum comentário ainda.<br>Seja o primeiro!</div>
              </div>`}
          </div>
          <div style="padding-top: 8px; border-top: 1px solid var(--border); margin-top: 8px;">
            <div style="position:relative">
              <textarea id="taskCommentInput" placeholder="Escreva um comentário... (@ para mencionar)"
                style="width: 100%; padding: 8px 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 0.8rem; min-height: 52px; resize: none; font-family: inherit; transition: border 0.15s; box-sizing: border-box;"
                onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"></textarea>
              <div id="mentionDropdown" class="mention-dropdown" style="display:none;position:fixed;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;max-height:144px;overflow-y:auto;z-index:99999;min-width:220px"></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center;">
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: var(--text-secondary); font-size: 0.78rem; padding: 5px 8px; border-radius: 6px; background: var(--bg-secondary); border: 1px solid var(--border);">
                <input type="file" id="taskCommentAttachment_${id}" multiple style="display: none;" accept="*" />
                📎 Anexar
              </label>
              <div id="attachmentNames_${id}" style="flex: 1; font-size: 0.72rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
              <button onclick="addTaskCommentQuick(${id})"
                style="padding: 6px 14px; background: var(--primary); color: #000; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem; transition: opacity 0.15s;"
                onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const modalEl = document.getElementById('modalTaskDetail');
    const contentEl = document.getElementById('taskDetailContent');
    let titleEl = document.getElementById('taskDetailTitle');

    if (!modalEl) { console.error('❌ modalTaskDetail não encontrado'); return; }
    if (!contentEl) { console.error('❌ taskDetailContent não encontrado'); return; }
    if (!titleEl) { console.error('❌ taskDetailTitle não encontrado'); return; }

    console.log('✅ Elementos do modal encontrados');
    contentEl.innerHTML = html;

    // Se titleEl não existe ou foi substituído, recriá-lo
    if (!titleEl || titleEl.tagName !== 'H3') {
      console.log('🔄 Recriando h3, titleEl:', titleEl ? titleEl.tagName : 'não encontrado');
      const newTitleEl = document.createElement('h3');
      newTitleEl.id = 'taskDetailTitle';
      newTitleEl.style.cssText = 'font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.15s;';
      newTitleEl.onmouseover = function() { this.style.background = 'var(--bg-secondary)'; };
      newTitleEl.onmouseout = function() { this.style.background = 'transparent'; };

      if (titleEl) {
        titleEl.replaceWith(newTitleEl);
      } else {
        // Se não existe, inserir como primeiro filho do modal
        const modalInner = document.getElementById('modalTaskDetailInner');
        if (modalInner) modalInner.insertBefore(newTitleEl, modalInner.firstChild);
      }
      titleEl = newTitleEl;
      console.log('✅ H3 recriado e inserido');
    }

    console.log('📝 Setando title:', t.title);
    titleEl.textContent = t.title.length > 40 ? t.title.substring(0, 40) + '...' : t.title;
    console.log('✓ Title setado, elemento:', titleEl);
    titleEl.onclick = (e) => {
      e.stopPropagation();
      editFieldInline(id, 'title', t.title);
    };
    modalEl.style.display = 'flex';
    modalEl.classList.add('open');
    console.log('✅ Modal aberto:', modalEl, 'classes:', modalEl.className);

    // Barra de cor por prioridade no topo do modal
    const modalInner = document.getElementById('modalTaskDetailInner');
    if (modalInner) modalInner.style.borderTopColor = prioColors[t.priority] || 'var(--primary)';

    // Botão Concluir
    // Botão Deletar
    const deleteBtn = document.getElementById('taskDetailDeleteBtn');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (confirm('Deletar esta tarefa?')) { deleteTask(id); closeModal('modalTaskDetail'); }
      };
    }

    // Setup attachment file listener (com cleanup de listeners antigos)
    setTimeout(() => {
      const fileInput = document.getElementById(`taskCommentAttachment_${id}`);
      if (fileInput) {
        // Remover todos os listeners antigos
        fileInput.removeEventListener('change', null);
        fileInput.addEventListener('change', function handleFileChange() {
          const displayEl = document.getElementById(`attachmentNames_${id}`);
          if (displayEl && this.files.length > 0) {
            const fileNames = Array.from(this.files).map(f => f.name).join(', ');
            displayEl.textContent = `Arquivos: ${fileNames}`;
          } else if (displayEl) {
            displayEl.textContent = '';
          }
        });
      }

      // Adicionar event listener para @mentions
      setTimeout(() => {
        const commentInput = document.getElementById('taskCommentInput');
        if (commentInput) {
          // Remover listener antigo
          commentInput.removeEventListener('input', handleMentionInput);
          // Adicionar novo listener
          commentInput.addEventListener('input', handleMentionInput);
        }
      }, 100);

    }, 0);
  } catch(e) {
    console.error('Error in openTaskDetail:', e);
  }
}

// Renderizar Pane de Detalhes
function renderTaskDetailPane(t, assignee, municipio, due) {
  // Célula padrão — label + valor, fundo uniforme, tamanho padronizado
  const LABEL = `font-size:0.63rem;color:var(--text-secondary);text-transform:uppercase;font-weight:700;letter-spacing:0.5px;margin-bottom:6px;`;
  const CELL  = `padding:10px 12px;background:var(--bg-secondary);border-radius:8px;transition:background 0.15s;`;
  const CELL_CLICK = `${CELL}cursor:pointer;`;

  const cell = (label, valueHTML, onclick = '') => {
    const hover = onclick ? `onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--bg-secondary)'"` : '';
    const click = onclick ? `onclick="${onclick}"` : '';
    return `<div ${click} ${hover} style="${onclick ? CELL_CLICK : CELL}">
      <div style="${LABEL}">${label}</div>
      <div style="line-height:1.4;">${valueHTML}</div>
    </div>`;
  };
  const emptyCell = () => `<div style="${CELL}"></div>`;
  const row2 = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:stretch;">${a}${b}</div>`;

  let html = '';

  // — Linha 1: Responsável + Etiquetas —
  const labelColors = { 'Prazo':'#e05c5c','Audiência':'#ff6b6b','Petição':'#4caf7d','Contrato':'#5b8dee','Recurso':'#9c27b0','Consultoria':'#ffa94d','Diligência':'#e09a3a','Intimação':'#74b9ff',...(t.customLabels||{}) };

  const memberHTML = assignee ? `
    <div style="display:flex;align-items:center;gap:9px;">
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#d97706);flex-shrink:0;
        display:flex;align-items:center;justify-content:center;color:#000;font-weight:800;font-size:0.85rem;">
        ${assignee.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">${assignee.name}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);">${roleLabel(assignee.role)}</div>
      </div>
    </div>`
    : `<div style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);font-size:0.85rem;">
        <span style="width:26px;height:26px;border-radius:50%;border:1.5px dashed var(--border);display:inline-flex;align-items:center;justify-content:center;font-size:1rem;">+</span>
        Atribuir membro
       </div>`;

  const labelsHTML = t.labels && t.labels.length > 0
    ? t.labels.map(l => `<span style="padding:3px 9px;background:${labelColors[l]||'#5b8dee'}22;color:${labelColors[l]||'#5b8dee'};border:1px solid ${labelColors[l]||'#5b8dee'}55;border-radius:20px;font-size:0.78rem;font-weight:700;">${l}</span>`).join('')
    : `<span style="color:var(--text-secondary);font-size:0.85rem;opacity:0.6;">+ Adicionar etiqueta</span>`;

  html += row2(
    cell('👤 Responsável', memberHTML, `showTaskMembersEditor(${t.id})`),
    cell('🏷️ Etiquetas', `<div style="display:flex;flex-wrap:wrap;gap:4px;">${labelsHTML}</div>`, `showTaskLabelsEditor(${t.id})`)
  );

  // — Linha 2: Data Entrega + Status —
  let dateValueHTML = `<span style="font-size:0.85rem;color:var(--text-secondary);opacity:0.5;">Não definida</span>`;
  if (due) {
    const daysLeft = Math.ceil((due - new Date()) / 86400000);
    let color = '#5b8dee', bg = '#5b8dee22', border = '#5b8dee55', badge = '';
    if (daysLeft < 0)      { color='#e05c5c'; bg='#e05c5c22'; border='#e05c5c55'; badge='Vencida'; }
    else if (daysLeft===0) { color='#e09a3a'; bg='#e09a3a22'; border='#e09a3a55'; badge='Hoje'; }
    else if (daysLeft===1) { color='#e09a3a'; bg='#e09a3a22'; border='#e09a3a55'; badge='Amanhã'; }
    dateValueHTML = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
      <span style="font-size:0.88rem;font-weight:700;color:${color};">${due.toLocaleDateString('pt-BR')}</span>
      ${badge ? `<span style="padding:2px 8px;background:${bg};color:${color};border:1px solid ${border};border-radius:20px;font-size:0.72rem;font-weight:700;">${badge}</span>` : ''}
    </div>`;
  }

  const kanbanStatus = t.kanbanStatus || (t.done ? 'done' : 'todo');
  const statusMap = {
    todo:   { label: 'A Fazer',      color: '#6b7190', bg: '#6b719022', border: '#6b719055', icon: '○' },
    doing:  { label: 'Em Andamento', color: '#5b8dee', bg: '#5b8dee22', border: '#5b8dee55', icon: '▶' },
    review: { label: 'Em Revisão',   color: '#e0a44a', bg: '#e0a44a22', border: '#e0a44a55', icon: '◎' },
    done:   { label: 'Concluído',    color: '#4caf7d', bg: '#4caf7d22', border: '#4caf7d55', icon: '✓' },
  };
  const s = statusMap[kanbanStatus] || statusMap.todo;
  const statusValueHTML = `<span style="padding:3px 10px;background:${s.bg};color:${s.color};border:1px solid ${s.border};border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;" title="Clique para avançar status">${s.icon} ${s.label}</span>`;

  html += row2(
    cell('📅 Data Entrega', dateValueHTML, `editFieldInline(${t.id},'due','${t.due||''}')`),
    cell('📊 Status', statusValueHTML, `toggleTaskStatus(${t.id})`)
  );

  // — Linha 3: Prioridade + Criado em —
  const prioBg    = t.priority==='urgente'?'#e05c5c22':t.priority==='normal'?'#5b8dee22':'#4caf7d22';
  const prioColor = t.priority==='urgente'?'#e05c5c':t.priority==='normal'?'#5b8dee':'#4caf7d';
  const prioBdr   = t.priority==='urgente'?'#e05c5c55':t.priority==='normal'?'#5b8dee55':'#4caf7d55';
  const prioLbl   = t.priority==='urgente'?'● Urgente':t.priority==='normal'?'● Normal':'● Baixa';
  const prioHTML  = `<span style="padding:3px 10px;background:${prioBg};color:${prioColor};border:1px solid ${prioBdr};border-radius:20px;font-size:0.85rem;font-weight:700;">${prioLbl}</span>`;
  const createdHTML = t.created ? `<span style="font-size:0.88rem;color:var(--text-secondary);">${new Date(t.created).toLocaleDateString('pt-BR')}</span>` : '';

  html += row2(
    cell('⚑ Prioridade', prioHTML, `cycleTaskPriority(${t.id})`),
    t.created ? cell('🕐 Criado em', createdHTML) : emptyCell()
  );

  // — Linha 4: Processo + Tipo —
  const processoHTML  = t.process ? `<span style="font-family:monospace;font-size:0.88rem;color:var(--text-primary);font-weight:600;">${escapeHtml(t.process)}</span>` : `<span style="font-size:0.85rem;color:var(--text-secondary);opacity:0.5;">—</span>`;
  const tipoHTML      = t.tipo    ? `<span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">${tipoLabel(t.tipo)}</span>` : `<span style="font-size:0.85rem;color:var(--text-secondary);opacity:0.5;">—</span>`;

  html += row2(
    cell('📄 Processo', processoHTML),
    cell('📋 Tipo', tipoHTML)
  );

  // — Linha 5: Município (largura total) —
  const municipioHTML = municipio
    ? `<span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">${escapeHtml(municipio.name)}</span>`
    : `<span style="font-size:0.85rem;color:var(--text-secondary);opacity:0.5;">Nenhum selecionado</span>`;
  html += cell('📍 Município', municipioHTML);

  // — Descrição —
  if (t.desc) {
    html += cell('📝 Descrição', `<div style="font-size:0.88rem;color:var(--text-primary);line-height:1.6;white-space:pre-wrap;word-break:break-word;">${escapeHtml(t.desc)}</div>`);
  }

  // — Membros Compartilhados —
  if (t.participants && t.participants.length > 0) {
    const avatarColors = ['#f59e0b','#8b5cf6','#3b82f6','#10b981','#e05c5c','#e09a3a','#5b8dee','#4caf7d'];
    const memberAvatars = t.participants.map((p, i) => {
      const pm = members.find(m => m.id === p.memberId);
      if (!pm) return '';
      const initials = pm.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
      const color = avatarColors[i % avatarColors.length];
      return `<div style="display:flex;align-items:center;gap:6px;padding:4px 10px 4px 5px;background:var(--bg);border-radius:20px;border:1px solid var(--border);">
        <div style="width:22px;height:22px;border-radius:50%;background:${color}22;border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;color:${color};font-weight:800;font-size:0.62rem;flex-shrink:0;">${initials}</div>
        <span style="font-size:0.8rem;color:var(--text-primary);font-weight:500;">${pm.name}</span>
      </div>`;
    }).join('');
    html += `<div style="${CELL}border-left:3px solid var(--primary);">
      <div style="${LABEL}">🤝 Membros Compartilhados</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${memberAvatars}</div>
    </div>`;
  }

  return html;
}

// Renderizar Pane de Edição
function renderTaskEditPane(t, assignee, municipio) {
  let html = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Título -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Título</label>
        <input type="text" id="editTaskTitle" value="${escapeHtml(t.title)}"
          style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 0.95rem;">
      </div>

      <!-- Descrição -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Descrição</label>
        <textarea id="editTaskDesc" style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 0.95rem; min-height: 120px; resize: vertical; font-family: inherit;">${escapeHtml(t.desc || '')}</textarea>
      </div>

      <!-- Status e Prioridade (2 colunas) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Status</label>
          <select id="editTaskStatus" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
            <option value="false" ${!t.done ? 'selected' : ''}>Pendente</option>
            <option value="true" ${t.done ? 'selected' : ''}>Concluída</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Prioridade</label>
          <select id="editTaskPriority" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
            <option value="baixa" ${t.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
            <option value="normal" ${t.priority === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="urgente" ${t.priority === 'urgente' ? 'selected' : ''}>Urgente</option>
          </select>
        </div>
      </div>

      <!-- Data de Vencimento -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Data de Vencimento</label>
        <input type="date" id="editTaskDue" value="${t.due || ''}"
          style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
      </div>

      <!-- Responsável -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Responsável</label>
        <select id="editTaskAssignee" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
          <option value="">Sem atribuição</option>
          ${members.map(m => `<option value="${m.id}" ${t.assignee === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
        </select>
      </div>

      <!-- Processo -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Processo</label>
        <input type="text" id="editTaskProcess" value="${escapeHtml(t.process || '')}"
          style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-family: monospace;">
      </div>

      <!-- Município -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Contrato/Município</label>
        <select id="editTaskMunicipio" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
          <option value="">Selecionar...</option>
          ${municipios.map(m => `<option value="${m.id}" ${parseInt(t.municipio) === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
        </select>
      </div>

      <!-- Tipo -->
      <div>
        <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Tipo</label>
        <select id="editTaskTipo" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
          <option value="geral" ${t.tipo === 'geral' ? 'selected' : ''}>Geral</option>
          <option value="revisao" ${t.tipo === 'revisao' ? 'selected' : ''}>Revisão</option>
          <option value="pesquisa" ${t.tipo === 'pesquisa' ? 'selected' : ''}>Pesquisa</option>
          <option value="estruturacao" ${t.tipo === 'estruturacao' ? 'selected' : ''}>Estruturação</option>
          <option value="outros" ${t.tipo === 'outros' ? 'selected' : ''}>Outros</option>
        </select>
      </div>

      <!-- Botões de Ação -->
      <div style="display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border);">
        <button onclick="saveTaskDetailsChanges(${currentTaskDetailId})" style="flex: 1; padding: 12px; background: var(--primary); color: #000; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
          💾 Salvar Alterações
        </button>
        <button onclick="switchTaskDetailTab('detalhes', document.querySelector('[data-tab=detalhes]'))" style="flex: 1; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
          ✕ Cancelar
        </button>
      </div>
    </div>
  `;

  return html;
}

// Salvar alterações da tarefa
function saveTaskDetailsChanges(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  t.title = document.getElementById('editTaskTitle').value.trim();
  t.desc = document.getElementById('editTaskDesc').value.trim();
  t.done = document.getElementById('editTaskStatus').value === 'true';
  t.priority = document.getElementById('editTaskPriority').value;
  t.due = document.getElementById('editTaskDue').value;
  t.assignee = parseInt(document.getElementById('editTaskAssignee').value) || null;
  t.process = document.getElementById('editTaskProcess').value.trim();
  t.municipio = parseInt(document.getElementById('editTaskMunicipio').value) || null;
  t.tipo = document.getElementById('editTaskTipo').value;

  if (!t.title) {
    alert('⚠️ Título não pode estar vazio!');
    return;
  }

  save(STORAGE_KEYS.tasks, tasks);
  addActivity(`Tarefa "${t.title}" foi editada`);
  openTaskDetail(taskId);

  // Voltar para aba detalhes
  setTimeout(() => {
    switchTaskDetailTab('detalhes', document.querySelector('[data-tab=detalhes]'));
  }, 100);
}

// Renderizar Pane de Checklist
function renderTaskChecklistPane(t) {
  if (!t.checklist || t.checklist.length === 0) {
    return '<div style="color: var(--text-secondary); text-align: center; padding: 24px;">Nenhum checklist adicionado</div>';
  }

  const completed = t.checklist.filter(c => c.done).length;
  const progress = Math.round((completed / t.checklist.length) * 100);

  let html = `
    <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600;">Progresso</span>
        <span style="font-weight: 600; color: var(--primary);">${completed}/${t.checklist.length} (${progress}%)</span>
      </div>
      <div style="width: 100%; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden;">
        <div style="height: 100%; width: ${progress}%; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width 0.3s;"></div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${t.checklist.map((c, i) => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px; cursor:pointer; ${c.done ? 'opacity: 0.6;' : ''}" onclick="toggleChecklistItem(${t.id}, ${i}, ${!c.done})">
          <input type="checkbox" ${c.done ? 'checked' : ''} style="cursor: pointer; width:18px; height:18px; pointer-events:none;">
          <span style="flex:1; ${c.done ? 'text-decoration: line-through; color: var(--text-secondary);' : 'color: var(--text-primary);'}">${escapeHtml(c.text || c.item || '')}</span>
        </div>
      `).join('')}
    </div>
  `;

  return html;
}

// Renderizar Feed de Atividade/Comentários
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

function renderTaskActivityFeed(t) {
  let html = '';

  // Mostrar comentários reais
  if (t.comments && t.comments.length > 0) {
    t.comments.forEach(comment => {
      const commentTime = new Date(comment.time);
      const timeStr = formatTimeAgo(commentTime);
      const ini = comment.user.split(' ').map(n => n[0]).join('').substring(0, 2);

      // Buscar foto do perfil do autor
      let photoUrl = null;
      const commentMember = comment.memberId
        ? members.find(m => m.id === comment.memberId)
        : members.find(m => m.name === comment.user);
      const commentUser = comment.userId
        ? users.find(u => u.id === comment.userId)
        : users.find(u => u.name === comment.user);
      if (commentMember && commentMember.photo) {
        photoUrl = commentMember.photo;
      } else if (commentUser && commentUser.photo) {
        photoUrl = commentUser.photo;
      } else {
        const pKey = 'vgai_user_profile_' + (commentUser?.id || commentUser?.memberId || commentMember?.id || '');
        if (pKey !== 'vgai_user_profile_') {
          const pd = JSON.parse(localStorage.getItem(pKey) || '{}');
          if (pd.foto) photoUrl = pd.foto;
        }
      }

      const avatarHTML = photoUrl
        ? `<img src="${photoUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
        : `<div style="width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-size:0.75rem;flex-shrink:0;">${ini}</div>`;

      html += `
        <div style="display: flex; gap: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 6px;">
          ${avatarHTML}
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">${comment.user}</span>
              <span style="font-size: 0.65rem; color: var(--text-secondary);">${timeStr}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); word-break: break-word; margin-bottom: 4px;">${comment.text}</div>
            ${comment.attachments && comment.attachments.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${comment.attachments.map(att => `
                  <a href="${att.file}" download="${att.name}" style="padding: 4px 8px; background: var(--border); border-radius: 4px; color: var(--primary); font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                    📎 ${att.name}
                  </a>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  } else {
    html = '<div style="color: var(--text-secondary); text-align: center; font-size: 0.85rem;">Nenhum comentário ainda</div>';
  }

  return html;
}

// Trocar Aba
function switchTaskDetailTab(tabName, btn) {
  document.querySelectorAll('.task-detail-tab').forEach(b => {
    b.classList.remove('active');
    b.style.borderBottomColor = 'transparent';
    b.style.color = 'var(--text-secondary)';
  });
  document.querySelectorAll('.task-detail-pane').forEach(p => p.style.display = 'none');

  btn.classList.add('active');
  btn.style.borderBottomColor = 'var(--primary)';
  btn.style.color = 'var(--text-primary)';
  btn.style.fontWeight = '600';

  const pane = document.querySelector(`[data-pane="${tabName}"]`);
  if (pane) {
    pane.style.display = 'flex';
    pane.style.flexDirection = 'column';
  }
}

// Adicionar Comentário Rápido
function addTaskCommentQuick(taskId) {
  const input = document.getElementById('taskCommentInput');
  if (!input || !input.value.trim()) return;

  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  const fileInput = document.getElementById(`taskCommentAttachment_${taskId}`);
  const attachments = [];

  // Processar arquivos
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    Array.from(fileInput.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        attachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          file: e.target.result // base64
        });

        // Se for o último arquivo, salvar comentário
        if (attachments.length === fileInput.files.length) {
          saveCommentWithAttachments(taskId, input.value.trim(), attachments, t);
        }
      };
      reader.readAsDataURL(file);
    });
  } else {
    // Sem arquivos, salvar diretamente
    saveCommentWithAttachments(taskId, input.value.trim(), [], t);
  }
}

function saveCommentWithAttachments(taskId, text, attachments, t) {
  if (!t.comments) t.comments = [];
  const comment = {
    user: currentUser?.name || 'Anônimo',
    userId: currentUser?.id || null,
    memberId: currentUser?.memberId || null,
    text: text,
    time: new Date().toISOString()
  };

  if (attachments.length > 0) {
    comment.attachments = attachments;
  }

  t.comments.push(comment);

  save(STORAGE_KEYS.tasks, tasks);

  // Limpar inputs
  const input = document.getElementById('taskCommentInput');
  const fileInput = document.getElementById(`taskCommentAttachment_${taskId}`);
  const dropdown = document.getElementById('mentionDropdown');
  if (input) input.value = '';
  if (fileInput) fileInput.value = '';
  if (dropdown) dropdown.style.display = 'none';

  openTaskDetail(taskId); // Refresh
}

// Mostrar Menu de Ações
function showTaskActionMenu() {
  const menu = document.createElement('div');
  menu.id = 'taskActionMenu';
  menu.style.cssText = `
    position: fixed; top: 100px; right: 40px; background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px; z-index: 10000; min-width: 200px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  menu.innerHTML = `
    <div style="padding: 8px 12px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Adicionar</div>
    <button onclick="showTaskChecklistEditor()" style="width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; color: var(--text-primary); hover: var(--bg-secondary);">✓ Checklist</button>
    <button onclick="showTaskLabelsEditor()" style="width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; color: var(--text-primary);">🏷️ Etiquetas</button>
    <button onclick="showTaskAttachmentEditor()" style="width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; color: var(--text-primary);">📎 Anexo</button>
    <button onclick="document.getElementById('taskActionMenu')?.remove()" style="width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; color: var(--text-secondary);">✕ Fechar</button>
  `;
  document.body.appendChild(menu);

  // Remover ao clicar fora
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && !document.getElementById('taskDetailAddBtn')?.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

// Editor de Checklist
function showTaskChecklistEditor() {
  const t = tasks.find(x => x.id === currentTaskDetailId);
  if (!t) return;

  if (!t.checklist) t.checklist = [];

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; z-index: 10001; width: 400px; max-height: 500px; overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: var(--text-primary);">✓ Checklist</h3>
      <button onclick="this.closest('div').parentElement.remove()" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;">✕</button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
      ${t.checklist.map((item, idx) => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
          <input type="checkbox" ${item.done ? 'checked' : ''}
            onchange="toggleChecklistItem(${currentTaskDetailId}, ${idx}, this.checked)"
            style="cursor: pointer; width: 18px; height: 18px;">
          <span style="flex: 1; ${item.done ? 'text-decoration: line-through; color: var(--text-secondary);' : 'color: var(--text-primary);'}">${escapeHtml(item.text || item.item || '')}</span>
          <button onclick="removeChecklistItem(${currentTaskDetailId}, ${idx})" style="border: none; background: none; color: #e05c5c; cursor: pointer; padding: 4px 8px;">🗑️</button>
        </div>
      `).join('')}
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <input type="text" id="newChecklistItem" placeholder="Novo item..."
        style="flex: 1; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary);">
      <button onclick="addChecklistItem(${currentTaskDetailId})"
        style="padding: 10px 16px; background: var(--primary); border: none; border-radius: 6px; color: #000; font-weight: 600; cursor: pointer;">➕ Adicionar</button>
    </div>

    <div style="text-align: center; font-size: 0.85rem; color: var(--text-secondary);">
      ${t.checklist.filter(c => c.done).length}/${t.checklist.length} concluídos
    </div>
  `;

  document.body.appendChild(modal);
}

// Adicionar item ao checklist
function addChecklistItem(taskId) {
  const input = document.getElementById('newChecklistItem');
  if (!input || !input.value.trim()) return;

  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  if (!t.checklist) t.checklist = [];
  t.checklist.push({ text: input.value.trim(), done: false });

  save(STORAGE_KEYS.tasks, tasks);
  input.value = '';
  openTaskDetail(taskId); // Refresh
  showTaskChecklistEditor(); // Reopen
}

// Remover item do checklist
function removeChecklistItem(taskId, idx) {
  const t = tasks.find(x => x.id === taskId);
  if (!t || !t.checklist) return;

  t.checklist.splice(idx, 1);
  save(STORAGE_KEYS.tasks, tasks);
  openTaskDetail(taskId);
  showTaskChecklistEditor();
}

// Toggle checklist item
function toggleChecklistItem(taskId, idx, done) {
  const t = tasks.find(x => x.id === taskId);
  if (!t || !t.checklist) return;

  t.checklist[idx].done = done;
  save(STORAGE_KEYS.tasks, tasks);
  // Re-render the checklist pane
  const pane = document.getElementById('taskDetailChecklistPane');
  if (pane) pane.innerHTML = renderTaskChecklistPane(t);
}

// Editor de Etiquetas - Versão Simplificada
function showTaskLabelsEditor() {
  const t = tasks.find(x => x.id === currentTaskDetailId);
  if (!t) return;
  if (!t.labels) t.labels = [];
  if (!t.customLabels) t.customLabels = {};

  const labels = ['Prazo', 'Audiência', 'Petição', 'Contrato', 'Recurso', 'Consultoria', 'Diligência', 'Intimação'];
  const colors = { 'Prazo': '#e05c5c', 'Audiência': '#ff6b6b', 'Petição': '#4caf7d', 'Contrato': '#5b8dee', 'Recurso': '#9c27b0', 'Consultoria': '#ffa94d', 'Diligência': '#e09a3a', 'Intimação': '#74b9ff' };

  // Combinar labels padrão com customizadas
  const allLabels = [...labels, ...Object.keys(t.customLabels)];
  const allColors = { ...colors, ...t.customLabels };

  let html = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; z-index: 10001; width: 450px; max-height: 700px; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.4);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <h3 style="margin: 0; color: var(--text-primary);">🏷️ Etiquetas</h3>
        <button onclick="closeAllModals()" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem;">✕</button>
      </div>

      <!-- Selecionadas -->
      <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Selecionadas:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 32px;">
          ${t.labels.length > 0 ? t.labels.map(l => `<span style="padding: 6px 12px; background: ${allColors[l] || '#5b8dee'}; color: white; border-radius: 20px; font-size: 0.85rem;">${l}</span>`).join('') : '<span style="color: var(--text-secondary);">Nenhuma</span>'}
        </div>
      </div>

      <!-- Disponíveis -->
      <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px; font-weight: 600;">Disponíveis:</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">
        ${allLabels.map(label => {
          const isCustom = Object.keys(t.customLabels).includes(label);
          return `
            <div style="position: relative;">
              <div onclick="toggleLabel(${currentTaskDetailId}, '${label}')" style="padding: 10px; background: ${allColors[label]}; color: white; border-radius: 6px; cursor: pointer; font-weight: 600; text-align: center; ${t.labels.includes(label) ? 'opacity: 0.5;' : 'opacity: 1;'}">
                ${label}
              </div>
              ${isCustom ? `<button onclick="removeCustomLabel(${currentTaskDetailId}, '${label}')" style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #e05c5c; color: white; border: none; cursor: pointer; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">✕</button>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Criar Nova Etiqueta -->
      <div style="margin-bottom: 20px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px; font-weight: 600;">➕ Nova Etiqueta:</div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="newLabelName_${t.id}" placeholder="Nome da etiqueta" style="flex: 1; padding: 8px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.9rem;">
          <input type="color" id="newLabelColor_${t.id}" value="#5b8dee" style="width: 50px; padding: 4px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
          <button onclick="addCustomLabel(${t.id})" style="padding: 8px 12px; background: var(--primary); color: #000; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Adicionar</button>
        </div>
      </div>

      <!-- Botões -->
      <div style="display: flex; gap: 8px;">
        <button onclick="saveLabels(${currentTaskDetailId})" style="flex: 1; padding: 12px; background: var(--primary); color: #000; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">✓ Confirmar</button>
        <button onclick="closeAllModals()" style="flex: 1; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; font-weight: 600; cursor: pointer;">✕ Cancelar</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

// Toggle label
function toggleLabel(taskId, label) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  if (!t.labels) t.labels = [];

  if (t.labels.includes(label)) {
    t.labels = t.labels.filter(l => l !== label);
  } else {
    t.labels.push(label);
  }

  // Rerender sem fechar
  closeAllModals();
  showTaskLabelsEditor();
}

// Salvar labels
function saveLabels(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  save(STORAGE_KEYS.tasks, tasks);
  _sbSave('lex_tasks', tasks);
  addActivity('Etiquetas atualizadas');
  closeAllModals();
  renderKanban();
  openTaskDetail(taskId);
}

// Adicionar etiqueta customizada
function addCustomLabel(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  if (!t.customLabels) t.customLabels = {};

  const nameInput = document.getElementById(`newLabelName_${taskId}`);
  const colorInput = document.getElementById(`newLabelColor_${taskId}`);

  const labelName = nameInput ? nameInput.value.trim() : '';
  const labelColor = colorInput ? colorInput.value : '#5b8dee';

  if (!labelName) {
    alert('Digite um nome para a etiqueta');
    return;
  }

  // Adicionar à lista de customLabels
  t.customLabels[labelName] = labelColor;

  // Automaticamente selecionar a etiqueta
  if (!t.labels.includes(labelName)) {
    t.labels.push(labelName);
  }

  // Rerender o modal
  closeAllModals();
  showTaskLabelsEditor();
}

// Remover etiqueta customizada
function removeCustomLabel(taskId, labelName) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  if (!t.customLabels) t.customLabels = {};

  // Remover de customLabels
  delete t.customLabels[labelName];

  // Se estava selecionada, remover de labels também
  if (t.labels && t.labels.includes(labelName)) {
    t.labels = t.labels.filter(l => l !== labelName);
  }

  // Rerender o modal
  closeAllModals();
  showTaskLabelsEditor();
}

// Fechar modais
function closeAllModals() {
  document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
}

// Adicionar label temporariamente
function addTempLabel(label, taskId) {
  if (!window.tempLabels) window.tempLabels = [];
  if (!window.tempLabels.includes(label)) {
    window.tempLabels.push(label);
    showTaskLabelsEditor(); // Rerender
  }
}

// Remover label temporariamente
function removeTempLabel(label, taskId) {
  if (!window.tempLabels) window.tempLabels = [];
  window.tempLabels = window.tempLabels.filter(l => l !== label);
  showTaskLabelsEditor(); // Rerender
}

// Confirmar seleção de etiquetas
function confirmLabels(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  t.labels = window.tempLabels || [];
  save(STORAGE_KEYS.tasks, tasks);
  addActivity(`Etiquetas atualizadas`);

  // Remover modal
  document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
    if (el.innerHTML.includes('Etiquetas')) el.remove();
  });

  openTaskDetail(taskId);
}

// Adicionar etiqueta
function addLabel(taskId, label) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  if (!t.labels) t.labels = [];
  if (!t.labels.includes(label)) {
    t.labels.push(label);
    save(STORAGE_KEYS.tasks, tasks);
    openTaskDetail(taskId);
    showTaskLabelsEditor();
  }
}

// Remover etiqueta
function removeLabel(taskId, label) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  if (t.labels) {
    t.labels = t.labels.filter(l => l !== label);
    save(STORAGE_KEYS.tasks, tasks);
    openTaskDetail(taskId);
    showTaskLabelsEditor();
  }
}

// Adicionar etiqueta personalizada com cor
function addCustomLabelWithColor(taskId) {
  const nameInput = document.getElementById(`customLabelName_${taskId}`);
  const colorInput = document.getElementById(`customLabelColor_${taskId}`);

  if (!nameInput || !nameInput.value.trim()) {
    alert('Digite um nome para a etiqueta');
    return;
  }

  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  const labelName = nameInput.value.trim();

  if (!t.labels) t.labels = [];
  if (!t.labels.includes(labelName)) {
    t.labels.push(labelName);

    // Salvar cor da etiqueta personalizada
    if (!t.labelColors) t.labelColors = {};
    t.labelColors[labelName] = colorInput.value;

    save(STORAGE_KEYS.tasks, tasks);
    nameInput.value = '';
    openTaskDetail(taskId);
    showTaskLabelsEditor();
  } else {
    alert('Essa etiqueta já existe');
  }
}


// Editor de Anexos
function showTaskAttachmentEditor() {
  const t = tasks.find(x => x.id === currentTaskDetailId);
  if (!t) return;

  if (!t.attachments) t.attachments = [];

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; z-index: 10001; width: 400px; max-height: 500px; overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: var(--text-primary);">📎 Anexos</h3>
      <button onclick="this.closest('div').parentElement.remove()" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;">✕</button>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="border: 2px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; cursor: pointer;"
        onclick="document.getElementById('attachmentFileInput').click()">
        <div style="font-size: 2rem; margin-bottom: 8px;">📁</div>
        <div style="color: var(--text-primary); font-weight: 600;">Clique para adicionar arquivo</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">ou arraste e solte</div>
      </div>
      <input type="file" id="attachmentFileInput" style="display: none;" onchange="handleAttachmentUpload(${currentTaskDetailId})">
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Arquivos (${t.attachments.length}):</div>
      ${t.attachments.length > 0 ? t.attachments.map((att, idx) => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
          <div style="font-size: 1.2rem;">📄</div>
          <div style="flex: 1; min-width: 0;">
            <div style="color: var(--text-primary); font-weight: 500; word-break: break-all; font-size: 0.9rem;">${att.name || 'Arquivo'}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${att.size || '0 B'}</div>
          </div>
          <button onclick="removeAttachment(${currentTaskDetailId}, ${idx})" style="border: none; background: none; color: #e05c5c; cursor: pointer; padding: 4px 8px;">🗑️</button>
        </div>
      `).join('') : '<div style="color: var(--text-secondary); text-align: center; padding: 16px;">Nenhum arquivo anexado</div>'}
    </div>
  `;

  document.body.appendChild(modal);
}

// Adicionar anexo
function handleAttachmentUpload(taskId) {
  const input = document.getElementById('attachmentFileInput');
  const file = input.files[0];
  if (!file) return;

  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  if (!t.attachments) t.attachments = [];

  // Simular upload (em produção, seria de verdade)
  const reader = new FileReader();
  reader.onload = (e) => {
    t.attachments.push({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      data: e.target.result
    });

    save(STORAGE_KEYS.tasks, tasks);
    openTaskDetail(taskId);
    showTaskAttachmentEditor();
  };
  reader.readAsDataURL(file);
}

// Remover anexo
function removeAttachment(taskId, idx) {
  const t = tasks.find(x => x.id === taskId);
  if (!t || !t.attachments) return;

  t.attachments.splice(idx, 1);
  save(STORAGE_KEYS.tasks, tasks);
  openTaskDetail(taskId);
  showTaskAttachmentEditor();
}

// Toggle Status da tarefa
function toggleTaskStatus(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  const order = ['todo', 'doing', 'review', 'done'];
  const cur = t.kanbanStatus || (t.done ? 'done' : 'todo');
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setTaskStatus(taskId, next);

  const labels = { todo: 'A Fazer', doing: 'Em Andamento', review: 'Em Revisão', done: 'Concluído' };
  addActivity(`Status alterado para "${labels[next]}"`);
  renderKanban();
  openTaskDetail(taskId);
}

// Ciclar Prioridade
function cycleTaskPriority(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  const priorities = ['baixa', 'normal', 'urgente'];
  const currentIdx = priorities.indexOf(t.priority);
  t.priority = priorities[(currentIdx + 1) % priorities.length];

  save(STORAGE_KEYS.tasks, tasks);
  addActivity(`Prioridade alterada para ${t.priority}`);
  openTaskDetail(taskId);
}

// Editor de Membros (simplificado)
function showTaskMembersEditor(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; z-index: 10001; width: 350px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: var(--text-primary);">👤 Atribuir Membro</h3>
      <button onclick="this.closest('div').parentElement.remove()" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;">✕</button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${members.map(m => `
        <button onclick="assignTaskMember(${taskId}, ${m.id})" style="padding: 10px; text-align: left; border: 1px solid var(--border); background: ${t.assignee === m.id ? 'var(--primary)' : 'var(--bg-secondary)'}; color: ${t.assignee === m.id ? '#000' : 'var(--text-primary)'}; border-radius: 6px; cursor: pointer; font-weight: 600;">
          ${m.name}
        </button>
      `).join('')}
    </div>
  `;

  document.body.appendChild(modal);
}

// Atribuir membro
function assignTaskMember(taskId, memberId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  t.assignee = memberId;
  save(STORAGE_KEYS.tasks, tasks);
  addActivity(`Tarefa atribuída a ${members.find(m => m.id === memberId)?.name || 'membro'}`);
  document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
  openTaskDetail(taskId);
}

// Editar campo inline ao clicar (sem sair do lugar)
function editFieldInline(taskId, fieldName, currentValue) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  const fieldElement = fieldName === 'title'
    ? document.getElementById('taskDetailTitle')
    : document.getElementById(`taskField_${fieldName}_${taskId}`) || event.target;
  if (!fieldElement) return;

  // Criar container para o input no mesmo lugar
  const container = document.createElement('div');
  container.id = fieldName === 'title' ? 'taskDetailTitle' : `taskField_${fieldName}_${taskId}`;
  container.style.cssText = 'position: relative; width: 100%;';

  // Criar input para edição
  const isLongText = fieldName === 'desc';
  const isDateField = fieldName === 'due';
  const inputElement = document.createElement(isLongText ? 'textarea' : 'input');

  if (isDateField) {
    inputElement.type = 'date';
    // Converter data para formato YYYY-MM-DD se necessário
    let dateValue = currentValue;
    if (dateValue && dateValue.includes('/')) {
      // Se estiver em DD/MM/YYYY, converter para YYYY-MM-DD
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        dateValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    inputElement.value = dateValue || '';
  } else {
    inputElement.value = currentValue;
  }

  inputElement.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 2px solid var(--primary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: ${fieldName === 'title' ? '1.1rem' : '0.95rem'};
    font-weight: ${fieldName === 'title' ? '600' : '400'};
    font-family: inherit;
    box-sizing: border-box;
  `;

  if (isLongText) {
    inputElement.style.minHeight = '100px';
    inputElement.style.resize = 'vertical';
  }

  if (isDateField) {
    inputElement.style.height = '40px';
    inputElement.style.cursor = 'pointer';
  }

  // Criar botões de ação
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '✓ Confirmar';
  saveBtn.style.cssText = 'flex: 1; padding: 8px; background: var(--primary); color: #000; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕ Cancelar';
  cancelBtn.style.cssText = 'flex: 1; padding: 8px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; font-weight: 600; cursor: pointer;';

  buttonContainer.appendChild(saveBtn);
  buttonContainer.appendChild(cancelBtn);

  container.appendChild(inputElement);
  container.appendChild(buttonContainer);

  // Substituir elemento
  if (fieldElement.id) {
    fieldElement.replaceWith(container);
  }

  inputElement.focus();
  inputElement.select();

  // Salvar ao clicar confirmar
  const saveChange = () => {
    try {
      const newValue = inputElement.value.trim();

      if (newValue && newValue !== currentValue) {
        t[fieldName] = newValue;
        save(STORAGE_KEYS.tasks, tasks);
        _sbSave('lex_tasks', tasks);
        try {
          addActivity(`${fieldName === 'title' ? 'Título' : fieldName === 'due' ? 'Data' : 'Campo'} alterado`);
        } catch (e) {
          console.error('Erro ao adicionar atividade:', e);
        }
      }

      try {
        renderKanban();
      } catch (e) {
        console.error('Erro ao renderizar Kanban:', e);
      }

      setTimeout(() => {
        openTaskDetail(taskId);
      }, 50);
    } catch (e) {
      console.error('Erro ao salvar alteração:', e);
      openTaskDetail(taskId); // Tenta reabrir modal mesmo se houver erro
    }
  };

  saveBtn.addEventListener('click', saveChange);
  cancelBtn.addEventListener('click', () => openTaskDetail(taskId));

  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && fieldName === 'title') {
      e.preventDefault();
      saveChange();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      openTaskDetail(taskId);
    }
  });
}

function calShowDayEvents(dateStr) {
  const events = buildCalEvents();
  const filtered = filterCalEvents(events);
  const dayEvents = filtered.filter(e => e.date === dateStr);

  if (!dayEvents.length) {
    document.getElementById('dayEventsList').innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento neste dia</p>';
  } else {
    const d = new Date(dateStr + 'T12:00:00');
    document.getElementById('dayEventsTitle').textContent = `Eventos de ${d.toLocaleDateString('pt-BR')}`;

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    dayEvents.forEach(e => {
      let icon = '📋';
      let actionBtn = '';

      if (e.type === 'prazo') {
        icon = '📅';
        actionBtn = `<button class="btn btn-ghost btn-sm" onclick="closeModal('modalDayEvents');switchCalendarView('prazos');setTimeout(() => { const row = document.querySelector('[data-prazo-id=\"${e.id}\"]'); if(row) row.scrollIntoView({behavior:'smooth',block:'center'}); }, 100)">Abrir</button>`;
      } else if (e.type === 'tarefa') {
        icon = '✓';
        actionBtn = `<button class="btn btn-ghost btn-sm" onclick="closeModal('modalDayEvents');openTaskDetail(${e.id})">Abrir</button>`;
      } else if (e.type === 'ac') {
        icon = '🤝';
        actionBtn = `<button class="btn btn-ghost btn-sm" onclick="closeModal('modalDayEvents');switchMissionView('atividades');setTimeout(() => { document.querySelector('[data-ac-id=\"${e.id}\"]')?.scrollIntoView({behavior:'smooth',block:'center'}); }, 100)">Abrir</button>`;
      }

      html += `
        <div style="display: flex; justify-content: space-between; align-items: start; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 3px solid ${
          e.cssClass.includes('critico') ? '#e05c5c' :
          e.cssClass.includes('prazo') ? '#e09a3a' :
          e.cssClass.includes('tarefa') ? '#5b8dee' : '#4caf7d'
        };">
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${icon} ${e.label}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${e.type === 'prazo' ? 'Prazo' : e.type === 'tarefa' ? 'Tarefa' : 'Atividade Compartilhada'}</div>
          </div>
          ${actionBtn}
        </div>
      `;
    });
    html += '</div>';
    document.getElementById('dayEventsList').innerHTML = html;
  }

  document.getElementById('modalDayEvents').classList.add('open');
}

let calendarView = 'mes';
function switchCalendarView(v) {
  calendarView = v;
  document.getElementById('calendario-mes').style.display = v === 'mes' ? '' : 'none';
  document.getElementById('tab-calendario-mes').classList.toggle('active', v === 'mes');
  if (v === 'mes') renderCalendario();
}

function renderPrazoList() {
  renderPrazos();
}

// ============================================================
// FEATURE 5: CHECKLIST
// ============================================================
let pendingChecklist = [];
let pendingTaskParticipants = [];

function initTaskMembers() {
  fillTaskMemberSelect();
  renderTaskMembers();
}

function fillTaskMemberSelect() {
  const select = document.getElementById('taskMemberSelect');
  select.innerHTML = '<option value="">Selecionar membro...</option>' +
    members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function addTaskMember() {
  const select = document.getElementById('taskMemberSelect');
  const memberId = parseInt(select.value);
  if (!memberId || pendingTaskParticipants.includes(memberId)) {
    select.value = '';
    return;
  }
  pendingTaskParticipants.push(memberId);
  select.value = '';
  renderTaskMembers();
}

function removeTaskMember(memberId) {
  const idx = pendingTaskParticipants.indexOf(memberId);
  if (idx > -1) pendingTaskParticipants.splice(idx, 1);
  renderTaskMembers();
}

function renderTaskMembers() {
  const section = document.getElementById('taskMembersListSection');
  section.innerHTML = pendingTaskParticipants.map(memberId => {
    const m = members.find(mb => mb.id === memberId);
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--accent);border-radius:6px;font-size:.85rem">
        <span>${m?.name || 'Desconhecido'}</span>
        <button class="btn btn-ghost btn-xs" style="padding:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center" onclick="removeTaskMember(${memberId})">✕</button>
      </div>
    `;
  }).join('');
}

// Funções do modal de NOVA TAREFA (pendingChecklist) — nomes com prefixo para não conflitar com task detail
function _pendingChecklistAdd() {
  const inp = document.getElementById('taskChecklistInput');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  pendingChecklist.push({ id: 'cl' + Date.now() + Math.random(), text, done: false });
  if (inp) inp.value = '';
  renderChecklistItems();
}

function _pendingChecklistToggle(idx) {
  if (pendingChecklist[idx]) pendingChecklist[idx].done = !pendingChecklist[idx].done;
  renderChecklistItems();
}

function _pendingChecklistRemove(idx) {
  pendingChecklist.splice(idx, 1);
  renderChecklistItems();
}

function renderChecklistItems() {
  const ul = document.getElementById('taskChecklistItems');
  if (!ul) return;
  ul.innerHTML = pendingChecklist.map((item, i) => `
    <li class="checklist-item">
      <div class="checklist-check ${item.done?'done':''}" onclick="_pendingChecklistToggle(${i})">${item.done?'✓':''}</div>
      <span class="checklist-item-text ${item.done?'done-text':''}">${item.text}</span>
      <button class="checklist-remove" onclick="_pendingChecklistRemove(${i})">✕</button>
    </li>
  `).join('');
}

// ============================================================
// FEATURE 6: TASK COMMENTS
// ============================================================
function renderTaskComments(t) {
  const list = document.getElementById('taskCommentList');
  if (!list) return;
  const comments = t.comments || [];
  const history = t.kanbanHistory || [];
  let html = '';
  // comments
  html += comments.map(c => {
    const author = c.user || (c.author === 'sistema' ? 'Sistema' : memberName(c.author)) || 'Anônimo';
    const highlightedText = renderMentionText(c.text);
    return `<div class="task-comment-item">
      <div class="task-comment-author">${author}</div>
      <div class="task-comment-text">${highlightedText}</div>
      <div class="task-comment-time">${c.time}</div>
    </div>`;
  }).join('');
  // kanban history as read-only
  if (history.length) {
    html += `<div style="font-size:.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.08em;margin-top:8px;margin-bottom:4px">Histórico Kanban</div>`;
    html += history.map(h => {
      const byName = h.by ? memberName(h.by) : 'Desconhecido';
      return `<div class="task-comment-item" style="background:rgba(91,141,238,.07)">
        <div class="task-comment-text">Movido de <strong>${h.fromLabel||h.from}</strong> → <strong>${h.toLabel||h.to}</strong></div>
        <div class="task-comment-time">por ${byName} em ${h.at}</div>
      </div>`;
    }).join('');
  }
  list.innerHTML = html || '<div style="font-size:.8rem;color:var(--text-secondary)">Nenhum comentário ainda.</div>';
}

// ============================================================
// @MENTIONS SYSTEM
// ============================================================
let mentionAtIndex = -1;

function handleMentionInput(event) {
  const input = event.target;
  const text = input.value;
  const dropdown = document.getElementById('mentionDropdown');

  if (!dropdown) return;

  const cursorPos = input.selectionStart;
  const beforeCursor = text.substring(0, cursorPos);
  const atIndex = beforeCursor.lastIndexOf('@');

  if (atIndex === -1 || beforeCursor.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  const mentionText = beforeCursor.substring(atIndex + 1).toLowerCase();

  if (mentionText.includes(' ') || mentionText.includes('\n')) {
    dropdown.style.display = 'none';
    return;
  }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(mentionText) &&
    m.id !== currentUser?.memberId
  ).slice(0, 8);

  if (filtered.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  const inputRect = input.getBoundingClientRect();
  dropdown.style.top = (inputRect.bottom + 4) + 'px';
  dropdown.style.left = inputRect.left + 'px';
  dropdown.style.width = inputRect.width + 'px';

  mentionAtIndex = atIndex;
  dropdown.innerHTML = filtered.map(m => {
    const photo = m.photo
      ? `<img src="${m.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0">`
      : `<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#000;flex-shrink:0">${m.name.charAt(0)}</div>`;
    return `<div class="mention-item" onclick="insertMention('${m.name.replace(/'/g, "\\'")}', ${mentionAtIndex})" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='transparent'">
      ${photo}
      <span style="font-size:0.88rem;font-weight:500;color:var(--text-primary)">@${m.name}</span>
    </div>`;
  }).join('');
  dropdown.style.display = 'block';
  dropdown.style.maxHeight = '144px';
  dropdown.style.overflowY = 'auto';
}

function insertMention(name, atIndex) {
  const input = document.getElementById('taskCommentInput');
  const text = input.value;
  const cursorPos = input.selectionStart;

  // Remove o @ e insere a mention
  const beforeAt = text.substring(0, atIndex);
  const afterCursor = text.substring(cursorPos);
  const newText = beforeAt + '@' + name + ' ' + afterCursor;

  input.value = newText;

  // Posiciona cursor após o mention
  const newCursorPos = atIndex + name.length + 2;
  setTimeout(() => {
    input.selectionStart = input.selectionEnd = newCursorPos;
    input.focus();
  }, 0);

  // Fecha dropdown
  document.getElementById('mentionDropdown').style.display = 'none';
}

function renderMentionText(text) {
  // Destaca @mentions com cor especial
  return text.replace(/@(\w+)/g, '<span style="color:var(--primary);font-weight:600">@$1</span>');
}

function addTaskComment() {
  const editId = parseInt(document.getElementById('taskEditId').value);
  if (!editId) return;
  const inp = document.getElementById('taskCommentInput');
  const text = inp.value.trim();
  if (!text) return;
  const t = tasks.find(x => x.id === editId);
  if (!t) return;
  if (!t.comments) t.comments = [];
  const now = new Date();
  t.comments.push({
    user: currentUser?.name || 'Anônimo',
    userId: currentUser?.id || null,
    memberId: currentUser?.memberId || null,
    author: currentUser?.memberId || 'sistema',
    text,
    time: now.toISOString()
  });
  save(STORAGE_KEYS.tasks, tasks);
  inp.value = '';
  document.getElementById('mentionDropdown').style.display = 'none';
  renderTaskComments(t);
}

// ============================================================
// FEATURE 8: DEADLINE NOTIFICATIONS
// ============================================================
const NOTIF_ALERTS_KEY = 'vgai_notif_alerts';
// let notifAlerts = []; // managed by window.notifAlerts from module
function loadNotifAlerts() {
  try { notifAlerts = JSON.parse(localStorage.getItem(NOTIF_ALERTS_KEY)) || []; } catch { notifAlerts = []; }
}
function saveNotifAlerts() { localStorage.setItem(NOTIF_ALERTS_KEY, JSON.stringify(notifAlerts)); }

function checkDeadlineNotifications() {
  loadNotifAlerts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  prazos.forEach(p => {
    if (p.done) return;
    const d = new Date(p.date + 'T00:00:00');
    const days = Math.round((d - today) / 86400000);

    // Apenas gera alertas para prazos dentro de 7 dias ou vencidos
    if (days > 7) return;

    // Definir nível de alerta baseado em dias restantes
    let alertLevel = null;
    if (days <= 0) alertLevel = 'vencido';
    else if (days === 1) alertLevel = 'critico';
    else if (days <= 3) alertLevel = 'urgente';
    else if (days <= 7) alertLevel = 'atencao';

    if (!alertLevel) return;

    const alertId = `prazo_${p.id}_${alertLevel}`;

    // Não duplicar alertas não-lidos para o mesmo prazo+nível
    const exists = notifAlerts.find(a => a.id === alertId && !a.read);
    if (!exists) {
      notifAlerts.push({
        id: alertId,
        type: 'prazo',
        prazoId: p.id,
        title: p.title,
        days: days,
        urgency: p.urgency,
        read: false,
        createdAt: Date.now()
      });
      saveNotifAlerts();
    }
  });

  // Manter apenas os últimos 100 alertas
  if (notifAlerts.length > 100) {
    notifAlerts = notifAlerts.slice(-100);
    saveNotifAlerts();
  }

  updateNotifBadgeFromAlerts();
  startAlertTimer();
}

function updateNotifBadgeFromAlerts() {
  loadNotifAlerts();
  const unread = notifAlerts.filter(a => !a.read).length;
  const urgent = tasks.filter(t => t.priority === 'urgente' && !t.done).length;
  // Incluir pedidos de reset pendentes no badge (apenas para admin/socio)
  const isAdmin = currentUser?.profile === 'admin' || currentUser?.profile === 'socio';
  const resetPending = isAdmin && typeof getPendingResetRequests === 'function'
    ? getPendingResetRequests().length : 0;
  document.getElementById('notifCount').textContent = unread + urgent + resetPending;
}

// ============================================================
// FEATURE: PERIODIC ALERT TOASTS
// ============================================================
function startAlertTimer() {
  if (window._alertTimerStarted) return;
  window._alertTimerStarted = true;

  // Disparar toasts imediatamente
  _fireToastAlerts();

  // Depois, a cada 6 horas
  setInterval(_fireToastAlerts, 6 * 60 * 60 * 1000);
}

function _fireToastAlerts() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Prazos críticos: vencidos ou amanhã
  const criticos = (prazos || []).filter(p => {
    if (p.done) return false;
    const d = new Date(p.date + 'T00:00:00');
    const days = Math.round((d - hoje) / 86400000);
    return days <= 1; // vencido ou amanhã
  });

  // Mostrar máximo 3 toasts com delay entre eles
  criticos.slice(0, 3).forEach((p, i) => {
    setTimeout(() => {
      const d = new Date(p.date + 'T00:00:00');
      const days = Math.round((d - hoje) / 86400000);
      let msg = '';

      if (days < 0) {
        msg = `VENCIDO há ${Math.abs(days)} dia(s)`;
      } else if (days === 0) {
        msg = 'Vence HOJE';
      } else if (days === 1) {
        msg = 'Vence AMANHÃ';
      }

      if (window.showNotification) {
        window.showNotification(`⚠️ Prazo: ${p.title} — ${msg}`, 'error');
      }
    }, i * 1500); // 1.5s de delay entre toasts
  });
}

// (renderNotifPanel and markAllRead updated above with deadline alert support)

// ============================================================
// FEATURE 9: MUNICÍPIO HELPERS
// ============================================================
function fillMunicipioSelect() {
  const sel = document.getElementById('taskMunicipio');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Selecione —</option>';
  Object.entries(TEAM_NAMES).forEach(([teamId, info]) => {
    if (info.municipios && info.municipios.length) {
      const grp = document.createElement('optgroup');
      grp.label = info.name;
      info.municipios.forEach(mun => {
        const o = document.createElement('option');
        o.value = mun; o.textContent = mun;
        grp.appendChild(o);
      });
      sel.appendChild(grp);
    }
  });
}

// ============================================================
// MUNICÍPIOS
// ============================================================
const MUN_TEAM_COLORS = {
  1: { bg: 'rgba(224,92,92,.15)',  color: 'var(--danger)',  icon: '🔥' },
  2: { bg: 'rgba(91,141,238,.15)', color: 'var(--info)',    icon: '💧' },
  3: { bg: 'rgba(76,175,125,.15)', color: 'var(--success)', icon: '🌿' },
  4: { bg: 'rgba(245, 158, 11, 0.12)',color: 'var(--primary)',  icon: '💨' },
};

let munFilter = 'todas';
let entidadeFilter = 'todas';

function renderMunicipios(filter) {
  munFilter = filter || munFilter;
  let list = [...municipios];
  if (munFilter !== 'todas') list = list.filter(m => String(m.team) === String(munFilter));
  if (entidadeFilter !== 'todas') {
    const entityType = entidadeFilter === 'prefeitura' ? 'Prefeitura' : 'Câmara';
    list = list.filter(m => m.name.includes(entityType));
  }

  const tbody = document.getElementById('municipioBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6">${emptyState('Nenhum contrato cadastrado')}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(m => {
    const tinfo = TEAM_NAMES[m.team];
    const tc    = MUN_TEAM_COLORS[m.team];
    const teamBadge = tinfo && tc
      ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600;background:${tc.bg};color:${tc.color}">${tc.icon} ${tinfo.name}</span>`
      : `<span class="badge badge-muted">Sem equipe</span>`;
    const areaText = tinfo ? `<div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px">${tinfo.area}</div>` : '';
    const adv = m.advogado ? members.find(x => x.id === m.advogado) : null;
    const advCell = adv
      ? `<div style="display:flex;align-items:center;gap:7px"><div class="member-avatar avatar-blue" style="width:26px;height:26px;font-size:.58rem;flex-shrink:0">${initials(adv.name)}</div><div><div style="font-size:.84rem;font-weight:500">${adv.name.split(' ').slice(0,2).join(' ')}</div><div style="font-size:.7rem;color:var(--text-secondary)">${adv.seniority === 'senior' ? 'Sênior' : adv.seniority === 'junior' ? 'Júnior' : 'Advogado(a)'}</div></div></div>`
      : `<span style="color:var(--text-secondary);font-size:.82rem">—</span>`;
    const [city, entity] = m.name.split(' – ');
    return `<tr>
      <td><div class="td-name" style="display:flex;align-items:center;gap:10px">${city}<span class="badge badge-muted" style="font-size:.65rem;flex-shrink:0">${entity || 'Prefeitura'}</span></div></td>
      <td>${teamBadge}${areaText}</td>
      <td>${advCell}</td>
      <td><div style="font-size:.78rem;color:var(--text-secondary);max-width:180px">${m.obs || '—'}</div></td>
      <td style="white-space:nowrap">
        ${canDo('canAddMembers') ? `
          <button class="btn btn-ghost btn-sm" onclick="openEditMunicipio(${m.id})" title="Editar">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteMunicipio(${m.id})" title="Remover">✕</button>
        ` : ''}
      </td>
    </tr>`;
  }).join('');
}

function filterMunicipios(f, btn) {
  document.querySelectorAll('#page-municipios .filter-btn:not([id^="entidade"])').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMunicipios(f);
}

function filterEntidade(e, btn) {
  entidadeFilter = e;
  document.querySelectorAll('[id^="entidade"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMunicipios();
}

function openModalMunicipio(id) {
  const m = id ? municipios.find(x => x.id === id) : null;
  document.getElementById('munEditId').value   = id || '';

  // Parse nome e tipo
  const fullName = m?.name || '';
  const [cityName, entityType] = fullName.split(' – ');
  document.getElementById('munName').value     = cityName || '';
  document.getElementById('munTipo').value     = entityType || 'Prefeitura';

  document.getElementById('munTeam').value     = m?.team     || '';
  document.getElementById('munObs').value      = m?.obs      || '';
  // Fill advogado select
  const advSel = document.getElementById('munAdvogado');
  const advogados = members.filter(x => x.role === 'advogado' || x.role === 'socio');
  advSel.innerHTML = '<option value="">— Selecione —</option>' +
    advogados.map(a => `<option value="${a.id}" ${m?.advogado === a.id ? 'selected' : ''}>${a.name}${a.seniority ? ' (' + (a.seniority === 'senior' ? 'Sênior' : 'Júnior') + ')' : ''}</option>`).join('');
  document.getElementById('munModalTitle').textContent = id ? '✏️ Editar Contrato' : '📋 Novo Contrato';
  document.getElementById('modalMunicipio').classList.add('open');
}

function openEditMunicipio(id) { openModalMunicipio(id); }

function saveMunicipio() {
  const cityName = document.getElementById('munName').value.trim();
  if (!cityName) { alert('Informe o nome do município'); return; }
  const entityType = document.getElementById('munTipo').value.trim();
  const name = `${cityName} – ${entityType}`;
  const editId   = parseInt(document.getElementById('munEditId').value) || null;
  const team     = parseInt(document.getElementById('munTeam').value) || null;
  const advogado = parseInt(document.getElementById('munAdvogado').value) || null;
  const obs      = document.getElementById('munObs').value.trim();

  if (editId) {
    const m = municipios.find(x => x.id === editId);
    if (m) { m.name = name; m.team = team; m.advogado = advogado; m.obs = obs; }
  } else {
    municipios.push({ id: Date.now(), name, team, contrato: '', advogado, obs });
  }
  save(STORAGE_KEYS.municipios, municipios);
  addActivity(`Contrato "${name}" ${editId ? 'atualizado' : 'cadastrado'}`, '#c8a96e');
  closeModal('modalMunicipio');
  renderMunicipios();
}

function deleteMunicipio(id) {
  const idx = municipios.findIndex(m => m.id === id);
  if (idx === -1) return;
  const removed = municipios.splice(idx, 1)[0];

  // Salvar IMEDIATAMENTE para Supabase (não esperar undo timeout)
  save(STORAGE_KEYS.municipios, municipios);
  logAction({
    action: 'municipio.delete',
    category: 'municipios',
    description: `Contrato "${removed.name.substring(0,50)}" deletado`,
    entityId: id,
    entityTitle: removed.name,
    color: '#e05c5c'
  });

  renderMunicipios();
  showUndoToast({
    label: 'Contrato removido',
    title: removed.name,
    onUndo: () => {
      municipios.splice(idx, 0, removed);
      save(STORAGE_KEYS.municipios, municipios);
      renderMunicipios();
    },
    onExpire: () => {
      addActivity(`Contrato "${removed.name}" removido`, '#e05c5c');
    }
  });
}

// ============================================================
// FEATURE 10: RELATÓRIOS — com escopo por perfil + gráfico
// ============================================================
function renderRelatorios() {
  const today = new Date();
  const profile = currentUser?.profile || 'estagiario';

  // Descobrir membro vinculado ao usuário logado
  const myMember = currentUser?.memberId
    ? members.find(m => m.id === currentUser.memberId)
    : null;

  // Escopo: admin/sócio = geral | advogado sênior = equipe | outros = próprio
  const isFullAccess = profile === 'admin' || profile === 'socio';
  const isSeniorAdv  = profile === 'advogado' && myMember?.seniority === 'senior';

  let visibleMembers, scopeLabel, scopeIcon;
  if (isFullAccess) {
    visibleMembers = members;
    scopeLabel = null;
  } else if (isSeniorAdv) {
    const myTeamId = myMember?.team;
    visibleMembers = members.filter(m => (m.teams || [m.team]).includes(myTeamId));
    const tinfo = TEAM_NAMES[myTeamId];
    scopeLabel = `Você está vendo os dados da sua equipe: ${tinfo ? tinfo.name : 'Equipe ' + myTeamId}`;
    scopeIcon  = tinfo ? tinfo.icon : '👥';
  } else {
    visibleMembers = myMember ? [myMember] : [];
    scopeLabel = 'Você está vendo apenas o seu próprio desempenho.';
    scopeIcon  = '👤';
  }

  // Banner de escopo
  const banner = document.getElementById('relScopeBanner');
  const bannerText = document.getElementById('relScopeText');
  if (scopeLabel) {
    banner.style.display = '';
    bannerText.innerHTML = `<strong>${scopeIcon} Visão restrita:</strong> ${scopeLabel}`;
  } else {
    banner.style.display = 'none';
  }

  // Cards de resumo
  const visTasks   = tasks.filter(t => visibleMembers.some(m => m.id === t.assignee));
  const total      = visTasks.length;
  const done       = visTasks.filter(t => t.done).length;
  const pct        = total ? Math.round(done / total * 100) : 0;
  const overdueP   = prazos.filter(p =>
    !p.done &&
    new Date(p.date + 'T12:00:00') < today &&
    visibleMembers.some(m => m.id === p.resp)
  ).length;

  let cardsHTML = `
    <div class="rel-card"><div class="rel-card-label">Total de Tarefas</div><div class="rel-card-value">${total}</div></div>
    <div class="rel-card"><div class="rel-card-label">Concluídas (%)</div><div class="rel-card-value" style="color:var(--success)">${pct}%</div></div>
    <div class="rel-card"><div class="rel-card-label">Prazos Vencidos</div><div class="rel-card-value" style="color:var(--danger)">${overdueP}</div></div>
  `;

  if (isFullAccess) {
    cardsHTML += [1,2,3,4].map(id => {
      const tm = members.filter(m => (m.teams||[m.team]).includes(id));
      const tc = tasks.filter(t => tm.some(m => m.id === t.assignee) && !t.done).length;
      const info = TEAM_NAMES[id];
      return `<div class="rel-card"><div class="rel-card-label">${info.icon} ${info.name}</div><div class="rel-card-value">${tc}</div><div style="font-size:.72rem;color:var(--text-secondary)">tarefas abertas</div></div>`;
    }).join('');
  } else if (isSeniorAdv && myMember?.team) {
    const info = TEAM_NAMES[myMember.team];
    const tc = visTasks.filter(t => !t.done).length;
    if (info) cardsHTML += `<div class="rel-card"><div class="rel-card-label">${info.icon} ${info.name}</div><div class="rel-card-value">${tc}</div><div style="font-size:.72rem;color:var(--text-secondary)">tarefas abertas</div></div>`;
  }

  document.getElementById('relCards').innerHTML = cardsHTML;

  // Título da tabela
  const tableTitle = document.getElementById('relTableTitle');
  if (tableTitle) {
    tableTitle.textContent = isFullAccess ? 'Tarefas por Membro' : isSeniorAdv ? 'Tarefas da Equipe' : 'Meu Desempenho';
  }

  // Tabela
  document.getElementById('relBody').innerHTML = visibleMembers.length ? visibleMembers.map(m => {
    const mt      = tasks.filter(t => t.assignee === m.id);
    const mdone   = mt.filter(t => t.done).length;
    const mpend   = mt.filter(t => !t.done).length;
    const mover   = mt.filter(t => !t.done && t.due && new Date(t.due + 'T12:00:00') < today).length;
    return `<tr>
      <td><div class="td-name">${m.name}</div><div class="td-sub">${roleLabel(m.role)}</div></td>
      <td>${mt.length}</td>
      <td><span style="color:var(--success)">${mdone}</span></td>
      <td>${mpend}</td>
      <td><span style="color:${mover > 0 ? 'var(--danger)' : 'var(--text-secondary)'}">${mover}</span></td>
    </tr>`;
  }).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:24px">Sem dados para exibir</td></tr>`;

  // Gráfico
  drawRelChart(visibleMembers, today);
}

function drawRelChart(visibleMembers, today) {
  const canvas = document.getElementById('relChartCanvas');
  if (!canvas) return;

  const isDark   = !document.documentElement.classList.contains('light-mode');
  const textCol  = isDark ? '#e8eaf0' : '#1a1e2a';
  const mutedCol = isDark ? '#6b7190' : '#7a7f9a';
  const gridCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

  // Tamanho responsivo
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.clientWidth - 40;
  const H   = 260;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Dados
  const data = visibleMembers.map(m => {
    const mt = tasks.filter(t => t.assignee === m.id);
    const ov = mt.filter(t => !t.done && t.due && new Date(t.due + 'T12:00:00') < today).length;
    const pe = mt.filter(t => !t.done && !(t.due && new Date(t.due + 'T12:00:00') < today)).length;
    const dn = mt.filter(t => t.done).length;
    return { name: m.name.split(' ')[0], done: dn, pending: pe, overdue: ov };
  });

  if (!data.length) {
    ctx.fillStyle = mutedCol;
    ctx.font = '13px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados para exibir', W / 2, H / 2);
    return;
  }

  const maxVal = Math.max(...data.map(d => d.done + d.pending + d.overdue), 1);
  const padL = 36, padR = 16, padT = 24, padB = 44;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const groupW = chartW / data.length;
  const barW   = Math.min(groupW * 0.52, 40);

  ctx.clearRect(0, 0, W, H);

  // Linhas de grade + labels Y
  const gridN = 4;
  for (let i = 0; i <= gridN; i++) {
    const y = padT + chartH - (i / gridN) * chartH;
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
    ctx.fillStyle = mutedCol;
    ctx.font = '10px DM Sans, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal * i / gridN), padL - 5, y + 3);
  }

  // Barras empilhadas
  const SEGS = [
    { key: 'overdue', color: '#e05c5c' },
    { key: 'pending', color: '#5b8dee' },
    { key: 'done',    color: '#4caf7d' },
  ];

  data.forEach((d, i) => {
    const cx = padL + i * groupW + (groupW - barW) / 2;
    let yOff = padT + chartH;
    let totalH = 0;

    SEGS.forEach(seg => {
      const val = d[seg.key];
      if (!val) return;
      const bh = (val / maxVal) * chartH;
      yOff -= bh;
      totalH += bh;
      ctx.fillStyle = seg.color;
      ctx.beginPath();
      // Arredonda o topo apenas no segmento mais alto
      const isTop = SEGS.slice(SEGS.indexOf(seg) + 1).every(s => !d[s.key]);
      const r = isTop ? Math.min(5, bh / 2) : 0;
      if (r > 0) {
        ctx.moveTo(cx + r, yOff);
        ctx.lineTo(cx + barW - r, yOff);
        ctx.quadraticCurveTo(cx + barW, yOff, cx + barW, yOff + r);
        ctx.lineTo(cx + barW, yOff + bh);
        ctx.lineTo(cx, yOff + bh);
        ctx.lineTo(cx, yOff + r);
        ctx.quadraticCurveTo(cx, yOff, cx + r, yOff);
      } else {
        ctx.rect(cx, yOff, barW, bh);
      }
      ctx.closePath();
      ctx.fill();
    });

    // Total acima da barra
    const tot = d.done + d.pending + d.overdue;
    if (tot > 0) {
      const topY = padT + chartH - (tot / maxVal) * chartH;
      ctx.fillStyle = mutedCol;
      ctx.font = 'bold 10px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tot, cx + barW / 2, topY - 5);
    }

    // Label X
    ctx.fillStyle = textCol;
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.name, cx + barW / 2, padT + chartH + 16);
  });
}

// ============================================================
// CONFIGURAÇÕES - SETTINGS PAGE
// ============================================================

// Show notification toast
function showNotification(message, type = 'info') {
  const container = document.getElementById('undoToastContainer');
  const toastId = 'notif-' + Date.now();
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = 'undo-toast';
  toast.style.background = type === 'success' ? 'rgba(76, 175, 125, 0.1)' :
                           type === 'danger' ? 'rgba(224, 92, 92, 0.1)' :
                           'var(--bg-secondary)';
  toast.style.borderColor = type === 'success' ? 'rgba(76, 175, 125, 0.3)' :
                            type === 'danger' ? 'rgba(224, 92, 92, 0.3)' :
                            'var(--border)';
  toast.innerHTML = `
    <div class="undo-toast-text">
      <div class="undo-toast-title">${message}</div>
    </div>
    <button class="btn btn-ghost btn-sm" style="margin-left: auto" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    if (document.getElementById(toastId)) {
      document.getElementById(toastId).remove();
    }
  }, 4000);
}

// Load configuration page
function loadConfigPage() {
  loadProfileConfig();
  loadEscritorioConfig();
  resetNotificacoesConfig();
  resetAparenciaConfig();
  updateSystemInfo();
  updateThemeButtons();

  // Set font size from settings
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
  if (settingsData.fontSize) {
    document.getElementById('configFontSize').value = settingsData.fontSize;
    document.getElementById('fontSizeLabel').textContent = Math.round(settingsData.fontSize * 100) + '%';
  }
}

// Switch between config tabs
function switchConfigTab(tab) {
  // Hide all tabs
  document.querySelectorAll('.config-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.missao-tab').forEach(t => t.classList.remove('active'));

  // Show selected tab
  const tabEl = document.getElementById(`config-${tab}`);
  if (tabEl) {
    tabEl.style.display = 'block';
    const btnEl = document.getElementById(`tab-config-${tab}`);
    if (btnEl) btnEl.classList.add('active');

    // Load tab data
    if (tab === 'escritorio') loadEscritorioConfig();
    else if (tab === 'notificacoes') resetNotificacoesConfig();
    else if (tab === 'aparencia') resetAparenciaConfig();
    else if (tab === 'sistema') updateSystemInfo();
  }
}

// ===== PERFIL TAB =====
function profileKey() {
  return 'vgai_user_profile_' + (currentUser?.id || currentUser?.memberId || 'guest');
}

function _applyProfileData(data) {
  document.getElementById('configNome').value = data.nome || currentUser.name || '';
  document.getElementById('configEmail').value = data.email || currentUser.email || '';
  document.getElementById('configTelefone').value = data.telefone || '';
  document.getElementById('configCargo').value = data.cargo || currentUser.profile || '';
  document.getElementById('configOAB').value = data.oab || '';
  document.getElementById('configBio').value = data.bio || '';
  if (data.foto) {
    document.getElementById('profilePhotoPreview').innerHTML = `<img src="${data.foto}" style="width:100%; height:100%; border-radius:8px; object-fit:cover;">`;
  }
}

async function loadProfileConfig() {
  // 1. Carrega local imediatamente (sem delay visual)
  const local = localStorage.getItem(profileKey());
  if (local) {
    try { _applyProfileData(JSON.parse(local)); } catch(e) {}
  } else {
    document.getElementById('configNome').value = currentUser.name || '';
    document.getElementById('configEmail').value = currentUser.email || '';
    document.getElementById('configCargo').value = currentUser.profile || '';
  }

  // 2. Busca do Supabase e sobrescreve se mais recente
  try {
    const remote = await _sbLoad(profileKey());
    if (remote) {
      _applyProfileData(remote);
      localStorage.setItem(profileKey(), JSON.stringify(remote)); // sincroniza local
    }
  } catch(e) {
    console.warn('Não foi possível carregar perfil do Supabase:', e);
  }
}

function handleProfilePhotoChange() {
  const input = document.getElementById('profilePhotoInput');
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Verificar tamanho (máx 500KB)
    if (file.size > 500 * 1024) {
      alert('Arquivo muito grande. Máximo 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const photoData = e.target.result;
        document.getElementById('profilePhotoPreview').innerHTML = `<img src="${photoData}" style="width:100%; height:100%; border-radius:8px; object-fit:cover;">`;

        // Save to localStorage (por usuário)
        const profileData = JSON.parse(localStorage.getItem(profileKey()) || '{}');
        profileData.foto = photoData;
        localStorage.setItem(profileKey(), JSON.stringify(profileData));

        // Também atualizar a foto do membro no array de members
        const member = members.find(m => m.name === currentUser.name);
        if (member) {
          member.photo = photoData;
          save(STORAGE_KEYS.members, members);
        }

        // Atualizar sidebar e página de equipe se estiver aberta
        updateUIForUser(currentUser);
        if (currentPage === 'equipe') {
          renderTeam(teamFilter);
        }

        console.log('✅ Foto salva com sucesso');
      } catch(err) {
        console.error('Erro ao salvar foto:', err);
        alert('Erro ao salvar foto. Tente uma imagem menor.');
      }
    };
    reader.onerror = () => {
      console.error('Erro ao ler arquivo');
      alert('Erro ao ler arquivo');
    };
    reader.readAsDataURL(file);
  }
}

async function saveProfileConfig() {
  const profileData = {
    nome: document.getElementById('configNome').value,
    email: document.getElementById('configEmail').value,
    telefone: document.getElementById('configTelefone').value,
    cargo: document.getElementById('configCargo').value,
    oab: document.getElementById('configOAB').value,
    bio: document.getElementById('configBio').value,
    updatedAt: new Date().toISOString()
  };

  // Preservar foto existente
  const existing = JSON.parse(localStorage.getItem(profileKey()) || '{}');
  if (existing.foto) profileData.foto = existing.foto;

  localStorage.setItem(profileKey(), JSON.stringify(profileData));

  // ✅ Aguardar sincronização com Supabase
  await _sbSave(STORAGE_KEYS.profile, profileData);

  // Atualizar currentUser com novos dados
  currentUser.name = profileData.nome;
  currentUser.email = profileData.email;
  document.getElementById('sidebarName').textContent = profileData.nome;

  showNotification('✅ Perfil salvo com sucesso! (Sincronizado com servidor)', 'success');
}

function resetProfileConfig() {
  loadProfileConfig();
}

// ===== ESCRITÓRIO TAB =====
function loadEscritorioConfig() {
  const settingsData = localStorage.getItem('vgai_user_settings');
  if (settingsData) {
    try {
      const data = JSON.parse(settingsData);
      document.getElementById('configEscritorio').value = data.escritorio || '';
      document.getElementById('configCNPJ').value = data.cnpj || '';
      document.getElementById('configEndereco').value = data.endereco || '';
      document.getElementById('configTelefoneFirma').value = data.telefone_firma || '';
      document.getElementById('configEmailFirma').value = data.email_firma || '';
    } catch(e) {
      console.warn('Erro ao carregar escritório:', e);
    }
  }
}

function saveEscritorioConfig() {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');

  settingsData.escritorio = document.getElementById('configEscritorio').value;
  settingsData.cnpj = document.getElementById('configCNPJ').value;
  settingsData.endereco = document.getElementById('configEndereco').value;
  settingsData.telefone_firma = document.getElementById('configTelefoneFirma').value;
  settingsData.email_firma = document.getElementById('configEmailFirma').value;
  settingsData.updatedAt = new Date().toISOString();

  localStorage.setItem('vgai_user_settings', JSON.stringify(settingsData));
  _sbSave('vgai_user_settings', settingsData);

  showNotification('✅ Dados do escritório salvos!', 'success');
}

function resetEscritorioConfig() {
  loadEscritorioConfig();
}

// ===== NOTIFICAÇÕES TAB =====
function saveNotificacoesConfig() {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');

  settingsData.notif_prazos = document.getElementById('configNotifPrazos').checked;
  settingsData.notif_tarefas = document.getElementById('configNotifTarefas').checked;
  settingsData.notif_equipe = document.getElementById('configNotifEquipe').checked;
  settingsData.notif_sistema = document.getElementById('configNotifSistema').checked;
  settingsData.updatedAt = new Date().toISOString();

  localStorage.setItem('vgai_user_settings', JSON.stringify(settingsData));
  _sbSave('vgai_user_settings', settingsData);

  showNotification('✅ Notificações configuradas!', 'success');
}

function resetNotificacoesConfig() {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
  document.getElementById('configNotifPrazos').checked = settingsData.notif_prazos !== false;
  document.getElementById('configNotifTarefas').checked = settingsData.notif_tarefas !== false;
  document.getElementById('configNotifEquipe').checked = settingsData.notif_equipe !== false;
  document.getElementById('configNotifSistema').checked = settingsData.notif_sistema !== false;
}

// ===== APARÊNCIA TAB =====
function setThemePreference(theme) {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
  settingsData.theme = theme;
  settingsData.updatedAt = new Date().toISOString();
  localStorage.setItem('vgai_user_settings', JSON.stringify(settingsData));
  _sbSave('vgai_user_settings', settingsData);

  updateThemeButtons();
  showNotification('✅ Tema alterado!', 'success');
}

function updateThemeButtons() {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
  const theme = settingsData.theme || 'dark';

  document.getElementById('themeDarkBtn').classList.remove('btn-primary');
  document.getElementById('themeLightBtn').classList.remove('btn-primary');
  document.getElementById('themeAutoBtn').classList.remove('btn-primary');

  if (theme === 'dark') document.getElementById('themeDarkBtn').classList.add('btn-primary');
  else if (theme === 'light') document.getElementById('themeLightBtn').classList.add('btn-primary');
  else document.getElementById('themeAutoBtn').classList.add('btn-primary');
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'configFontSize') {
    const size = e.target.value;
    document.getElementById('fontSizeLabel').textContent = Math.round(size * 100) + '%';
    document.documentElement.style.fontSize = (size * 16) + 'px';

    const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
    settingsData.fontSize = size;
    localStorage.setItem('vgai_user_settings', JSON.stringify(settingsData));
  }
});

function saveAparenciaConfig() {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
  settingsData.fontSize = document.getElementById('configFontSize').value;
  settingsData.sidebarCollapsed = document.getElementById('configSidebarCollapsed').checked;
  settingsData.updatedAt = new Date().toISOString();

  localStorage.setItem('vgai_user_settings', JSON.stringify(settingsData));
  _sbSave('vgai_user_settings', settingsData);

  showNotification('✅ Preferências de aparência salvas!', 'success');
}

function resetAparenciaConfig() {
  const settingsData = JSON.parse(localStorage.getItem('vgai_user_settings') || '{}');
  document.getElementById('configFontSize').value = settingsData.fontSize || 1;
  document.getElementById('configSidebarCollapsed').checked = settingsData.sidebarCollapsed || false;
  updateThemeButtons();
}

// ===== SISTEMA TAB =====
function updateSystemInfo() {
  const lastSync = localStorage.getItem('vgai_last_sync') || 'Nunca';
  document.getElementById('sysLastSync').textContent = lastSync;

  // Calculate cache size
  let totalSize = 0;
  for (let key in localStorage) {
    if (key.startsWith('lex_') || key.startsWith('vgai_')) {
      totalSize += localStorage[key].length;
    }
  }
  const cacheSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  document.getElementById('sysCacheSize').textContent = cacheSizeMB + ' MB';
  document.getElementById('sysSpaceUsed').textContent = (totalSize / 1024 / 1024).toFixed(1) + ' MB';

  // Count records
  const taskCount = (tasks || []).length;
  const memberCount = (members || []).length;
  const prazoCount = (prazos || []).length;
  const totalRecords = taskCount + memberCount + prazoCount;
  document.getElementById('sysRecordsCount').textContent = `${taskCount} tarefas, ${memberCount} membros, ${prazoCount} prazos (Total: ${totalRecords})`;
}

function syncWithFirestore() {
  showNotification('🔄 Sincronizando com Firestore...', 'info');

  // Trigger sync by updating localStorage
  const keys = ['lex_members', 'lex_tasks', 'lex_prazos', 'lex_activity', 'lex_shared_ac', 'lex_users'];
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        _sbSave(key, JSON.parse(data));
      } catch(e) {
        console.warn(`Erro ao sincronizar ${key}:`, e);
      }
    }
  });

  localStorage.setItem('vgai_last_sync', new Date().toLocaleString());
  document.getElementById('sysLastSync').textContent = new Date().toLocaleString();

  setTimeout(() => showNotification('✅ Sincronização concluída!', 'success'), 1000);
}

function exportData() {
  const exportData = {};
  const keys = ['lex_members', 'lex_tasks', 'lex_prazos', 'lex_activity', 'lex_shared_ac', 'lex_users', 'vgai_user_profile', 'vgai_user_settings'];

  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        exportData[key] = JSON.parse(data);
      } catch(e) {
        exportData[key] = data;
      }
    }
  });

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vgai_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification('✅ Dados exportados!', 'success');
}


function showClearDataConfirm() {
  if (confirm('⚠️ Tem certeza que deseja limpar o cache local? Esta ação não pode ser desfeita.')) {
    const keys = ['lex_members', 'lex_tasks', 'lex_prazos', 'lex_activity', 'lex_shared_ac', 'lex_users', 'vgai_user_profile', 'vgai_user_settings'];
    keys.forEach(key => localStorage.removeItem(key));
    showNotification('✅ Cache limpo! Atualizando página...', 'success');
    setTimeout(() => location.reload(), 1000);
  }
}

function showChangePasswordModal() {
  showChangePassword();
}

function showLogoutConfirm() {
  if (confirm('Tem certeza que deseja sair? Sua sessão será encerrada.')) {
    doLogout();
  }
}


// ============================================================
// INIT (minimal - module handles full init)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  applyTheme();
  if (typeof loadNotifAlerts === 'function') loadNotifAlerts();
  // checkDeadlineNotifications will be called by renderDashboard

  // ─── Seed initial data if empty ───
  const DATA_VERSION = 'vgai_v7';
  if (!window.members || !window.members.length || localStorage.getItem('lex_data_ver') !== DATA_VERSION) {
    window.members = [
      { id: 1,  name: 'Gleydson',        role: 'socio',      area: 'Sócio-Gestor',    email: 'gleydson@vgai.com',          workload: 8, team: 1, teams: [1,2,3,4], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gleydson' },
      { id: 2,  name: 'Caio',            role: 'advogado',   area: 'Direito Público', email: 'caio@vgai.com',              workload: 5, team: 1, teams: [1], seniority: 'senior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caio' },
      { id: 3,  name: 'Izabelle',        role: 'advogado',   area: 'Direito Público', email: 'izabelle@vgai.com',          workload: 5, team: 1, teams: [1], seniority: 'junior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Izabelle' },
      { id: 4,  name: 'Juli',            role: 'estagiario', inst: '',                email: 'juli@vgai.com',              workload: 3, team: 1, teams: [1], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juli' },
      { id: 5,  name: 'Yuri Pompeu',     role: 'advogado',   area: 'Direito Público', email: 'yuripompeu@vgai.com',        workload: 6, team: 2, teams: [2], seniority: 'senior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YuriPompeu' },
      { id: 6,  name: 'Nakano',          role: 'advogado',   area: 'Direito Público', email: 'nakano@vgai.com',            workload: 5, team: 2, teams: [2], seniority: 'junior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nakano' },
      { id: 7,  name: 'Larissa',         role: 'estagiario', inst: '',                email: 'larissa@vgai.com',           workload: 3, team: 2, teams: [2], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Larissa' },
      { id: 8,  name: 'Wagner',          role: 'socio',      area: 'Sócio-Gestor',    email: 'wagner@vgai.com',            workload: 8, team: 3, teams: [1,2,3,4], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wagner' },
      { id: 9,  name: 'Yuri Beleza',     role: 'advogado',   area: 'Direito Público', email: 'yuribeleza@vgai.com',        workload: 5, team: 3, teams: [3], seniority: 'senior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YuriB' },
      { id: 10, name: 'Nicole',          role: 'advogado',   area: 'Direito Público', email: 'nicole@vgai.com',            workload: 5, team: 3, teams: [3], seniority: 'junior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nicole' },
      { id: 11, name: 'Felipe',          role: 'advogado',   area: 'Direito Público', email: 'felipe@vgai.com',            workload: 5, team: 4, teams: [4], seniority: 'senior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felipe' },
      { id: 12, name: 'Erika',           role: 'advogado',   area: 'Direito Público', email: 'erika@vgai.com',             workload: 5, team: 4, teams: [4], seniority: 'junior', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Erika' },
      { id: 13, name: 'Leandro Andrade', role: 'estagiario', inst: '',                email: 'leandrosmg0629@gmail.com',   workload: 3, team: 4, teams: [4], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leandro' },
      { id: 14, name: 'Roger Cunha',     role: 'estagiario', inst: '',                email: 'roger@vgai.com',             workload: 3, team: 3, teams: [3], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roger' },
    ];
    if (typeof window.save === 'function') window.save(window.STORAGE_KEYS.members, window.members);
    localStorage.setItem('lex_data_ver', DATA_VERSION);
  }
});

// Sync utility for console use
window.syncUsersToSupabase = function() {
  console.log('=== SINCRONIZANDO USUÁRIOS COM SUPABASE ===');
  if (!window._sb || !window._sbReady) { console.error('Supabase não está inicializado'); return; }
  const currentUsers = loadUsers();
  window._sbSave(window.STORAGE_KEYS.users || 'lex_users', currentUsers)
    .then(() => console.log('Usuários sincronizados:', currentUsers.length))
    .catch(e => console.error('Erro ao sincronizar:', e));
};

// Expor _enviarEmailMissao ao window para que features/tasks.js possa chamar
window._enviarEmailMissao = _enviarEmailMissao;
