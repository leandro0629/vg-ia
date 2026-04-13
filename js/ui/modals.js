// ============================================================
// MODALS UI MODULE
// ============================================================

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('open');
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.style.display = 'none';
  modal.classList.remove('open');
}

export function isModalOpen() {
  return (
    document.querySelector('.modal-overlay[style*="display: flex"]') ||
    document.querySelector('.modal.open') ||
    document.getElementById('modalTask')?.style.display === 'flex'
  );
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.style.display = 'none';
  });
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.classList.remove('open');
  });
}

export function openAddModal() {
  const currentUser = window.currentUser;
  if (!currentUser) return;
  openModal('modalAdd');
}

export function openTaskModal() {
  openModal('modalTask');
}

export function openMemberModal(type = 'member') {
  openModal('modalMember');
}

export function openPrazoModal() {
  openModal('modalPrazo');
}

export function openModalNovoUsuario() {
  openModal('modalNovoUsuario');
}

export function openModalMunicipio() {
  openModal('modalMunicipio');
}

// Event delegation para fechar modals
export function initModalHandlers() {
  document.addEventListener('click', (e) => {
    // Fechar ao clicar no overlay
    if (e.target.classList?.contains('modal-overlay')) {
      e.target.style.display = 'none';
    }

    // Fechar ao clicar em modal-close
    if (e.target.classList?.contains('modal-close')) {
      const modal = e.target.closest('.modal-overlay') || e.target.closest('.modal');
      if (modal) {
        if (modal.classList.contains('modal-overlay')) {
          modal.style.display = 'none';
        } else {
          modal.classList.remove('open');
        }
      }
    }
  });
}
