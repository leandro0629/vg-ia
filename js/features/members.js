// ============================================================
// MEMBERS FEATURE - COM AUDITORIA INTEGRADA
// ============================================================

let pendingMemberPhoto = null;

/**
 * Salvar membro com auditoria
 */
export function saveMember() {
  const name = document.getElementById('memberName').value.trim();
  if (!name) { alert('Informe o nome'); return; }

  const role = document.getElementById('memberRole').value;
  const m = {
    id: Date.now(),
    name,
    role,
    oab: document.getElementById('memberOAB').value,
    area: document.getElementById('memberArea').value,
    inst: document.getElementById('memberInst').value,
    supervisor: parseInt(document.getElementById('memberSupervisor').value) || null,
    email: document.getElementById('memberEmail').value,
    seniority: role === 'advogado' ? (document.getElementById('memberSeniority').value || null) : null,
    photo: pendingMemberPhoto || null,
    workload: 0,
    tasks: 0
  };

  window.members.push(m);
  window.save(window.STORAGE_KEYS.members, window.members);

  // 📋 AUDITORIA - Membro adicionado
  window.logAction({
    action: 'member.add',
    category: 'members',
    description: `Membro "${name}" (${window.roleLabel(role)}) adicionado`,
    entityId: m.id,
    entityTitle: name,
    color: '#5b8dee'
  });

  clearMemberForm();
  window.closeModal('modalMember');
  window.renderPage(window.currentPage);
}

/**
 * Deletar membro com auditoria
 */
export function deleteMember(id) {
  if (!confirm('Remover membro e todas as suas tarefas?')) return;

  const member = window.members.find(m => m.id === id);
  const memberName = member?.name || 'Desconhecido';

  window.members = window.members.filter(m => m.id !== id);
  window.tasks = window.tasks.filter(t => t.assignee !== id);

  window.save(window.STORAGE_KEYS.members, window.members);
  window.save(window.STORAGE_KEYS.tasks, window.tasks);

  // 📋 AUDITORIA - Membro removido
  window.logAction({
    action: 'member.delete',
    category: 'members',
    description: `Membro "${memberName}" removido`,
    entityId: id,
    entityTitle: memberName,
    color: '#e05c5c'
  });

  window.closeModal('modalProfile');
  window.renderPage(window.currentPage);
}

/**
 * Editar membro com auditoria
 */
export function editMember(memberId) {
  const member = window.members.find(m => m.id === memberId);
  if (!member) return;

  const name = document.getElementById('editMemberName').value.trim();
  const role = document.getElementById('editMemberRole').value;
  const email = document.getElementById('editMemberEmail').value.trim();
  const area = document.getElementById('editMemberArea').value.trim();
  const oab = document.getElementById('editMemberOAB').value.trim();

  member.name = name;
  member.role = role;
  member.email = email;
  member.area = area;
  member.oab = oab;

  if (window.pendingEditPhoto && typeof window.saveAttachment === 'function') {
    member.photo = window.pendingEditPhoto;
  }

  window.save(window.STORAGE_KEYS.members, window.members);

  // 📋 AUDITORIA - Membro editado
  window.logAction({
    action: 'member.edit',
    category: 'members',
    description: `Membro "${name}" editado`,
    entityId: memberId,
    entityTitle: name,
    color: '#c8a96e'
  });

  window.closeModal('modalProfile');
  window.renderPage(window.currentPage);
}

/**
 * Preview de foto de membro
 */
export function previewMemberPhoto() {
  const file = document.getElementById('memberPhotoInput').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    pendingMemberPhoto = e.target.result;
    const img = document.getElementById('memberPhotoImg');
    const placeholder = document.getElementById('memberPhotoPlaceholder');
    const removeBtn = document.getElementById('memberPhotoRemoveBtn');

    if (img && placeholder && removeBtn) {
      img.src = pendingMemberPhoto;
      img.style.display = '';
      placeholder.style.display = 'none';
      removeBtn.style.display = '';
    }
  };
  reader.readAsDataURL(file);
}

/**
 * Remover foto pendente
 */
export function removePendingPhoto() {
  pendingMemberPhoto = null;
  const input = document.getElementById('memberPhotoInput');
  if (input) input.value = '';

  const img = document.getElementById('memberPhotoImg');
  const placeholder = document.getElementById('memberPhotoPlaceholder');
  const removeBtn = document.getElementById('memberPhotoRemoveBtn');

  if (img) img.style.display = 'none';
  if (placeholder) placeholder.style.display = '';
  if (removeBtn) removeBtn.style.display = 'none';
}

/**
 * Limpar formulário de membro
 */
function clearMemberForm() {
  ['memberName','memberOAB','memberArea','memberInst','memberEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  pendingMemberPhoto = null;
  const photoInput = document.getElementById('memberPhotoInput');
  if (photoInput) photoInput.value = '';

  const img = document.getElementById('memberPhotoImg');
  if (img) img.style.display = 'none';

  const placeholder = document.getElementById('memberPhotoPlaceholder');
  if (placeholder) placeholder.style.display = '';

  const removeBtn = document.getElementById('memberPhotoRemoveBtn');
  if (removeBtn) removeBtn.style.display = 'none';
}

// Expor pendingMemberPhoto para acesso global
export function getPendingMemberPhoto() {
  return pendingMemberPhoto;
}

export function setPendingMemberPhoto(photo) {
  pendingMemberPhoto = photo;
}
