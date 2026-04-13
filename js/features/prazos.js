// ============================================================
// PRAZOS FEATURE - COM AUDITORIA INTEGRADA
// ============================================================

/**
 * Salvar prazo (criar ou editar) com auditoria
 */
export function savePrazo() {
  const title = document.getElementById('prazoTitle').value.trim();
  const date = document.getElementById('prazoDate').value;

  if (!title || !date) {
    alert('Preencha título e data');
    return;
  }

  const editId = parseInt(document.getElementById('prazoEditId').value) || null;

  if (editId) {
    // ─── EDITAR PRAZO ───
    const p = window.prazos.find(x => x.id === editId);
    if (p) {
      p.title = title;
      p.date = date;
      p.process = document.getElementById('prazoProcess').value;
      p.resp = parseInt(document.getElementById('prazoResp').value);
      p.urgency = document.getElementById('prazoUrgency').value;

      window.save(window.STORAGE_KEYS.prazos, window.prazos);

      // 📋 AUDITORIA - Prazo editado
      window.logAction({
        action: 'prazo.edit',
        category: 'prazos',
        description: `Prazo "${title.substring(0,50)}" editado`,
        entityId: editId,
        entityTitle: title,
        color: '#c8a96e'
      });
    }
  } else {
    // ─── CRIAR PRAZO ───
    const p = {
      id: Date.now(),
      title,
      date,
      process: document.getElementById('prazoProcess').value,
      resp: parseInt(document.getElementById('prazoResp').value),
      urgency: document.getElementById('prazoUrgency').value,
      done: false
    };

    window.prazos.push(p);
    window.save(window.STORAGE_KEYS.prazos, window.prazos);

    // 📋 AUDITORIA - Prazo criado
    window.logAction({
      action: 'prazo.create',
      category: 'prazos',
      description: `Prazo "${title.substring(0,50)}" criado`,
      entityId: p.id,
      entityTitle: title,
      color: '#e0a44a'
    });
  }

  clearPrazoForm();
  window.closeModal('modalPrazo');
  window.renderPage(window.currentPage);
}

/**
 * Marcar prazo como concluído com auditoria
 */
export function donePrazo(id) {
  const p = window.prazos.find(p => p.id === id);
  if (!p) return;

  p.done = true;
  window.save(window.STORAGE_KEYS.prazos, window.prazos);

  // 📋 AUDITORIA - Prazo concluído
  window.logAction({
    action: 'prazo.complete',
    category: 'prazos',
    description: `Prazo "${p.title.substring(0,50)}" cumprido`,
    entityId: id,
    entityTitle: p.title,
    color: '#4caf7d'
  });

  if (typeof window.renderPrazos === 'function') {
    window.renderPrazos();
  }
}

/**
 * Deletar prazo com auditoria
 */
export function deletePrazo(id) {
  const idx = window.prazos.findIndex(p => p.id === id);
  if (idx === -1) return;

  const removed = window.prazos.splice(idx, 1)[0];
  if (typeof window.renderPrazos === 'function') {
    window.renderPrazos();
  }

  window.showUndoToast({
    label: 'Prazo removido',
    title: removed.title,
    onUndo: () => {
      window.prazos.splice(idx, 0, removed);
      window.save(window.STORAGE_KEYS.prazos, window.prazos);
      if (typeof window.renderPrazos === 'function') {
        window.renderPrazos();
      }
    },
    onExpire: () => {
      if (typeof window.DB?.deletePrazo === 'function') {
        window.DB.deletePrazo(id);
      }
      window.save(window.STORAGE_KEYS.prazos, window.prazos);

      // 📋 AUDITORIA - Prazo deletado
      window.logAction({
        action: 'prazo.delete',
        category: 'prazos',
        description: `Prazo "${removed.title.substring(0,50)}" removido`,
        entityId: id,
        entityTitle: removed.title,
        color: '#e05c5c'
      });
    }
  });
}

/**
 * Reabrir prazo (desmarcar como concluído) com auditoria
 */
export function reopenPrazo(id) {
  const p = window.prazos.find(p => p.id === id);
  if (!p) return;

  p.done = false;
  window.save(window.STORAGE_KEYS.prazos, window.prazos);

  // 📋 AUDITORIA - Prazo reabertoexport
  window.logAction({
    action: 'prazo.reopen',
    category: 'prazos',
    description: `Prazo "${p.title.substring(0,50)}" reaberto`,
    entityId: id,
    entityTitle: p.title,
    color: '#5b8dee'
  });

  if (typeof window.renderPrazos === 'function') {
    window.renderPrazos();
  }
}

/**
 * Limpar formulário de prazo
 */
function clearPrazoForm() {
  ['prazoTitle','prazoProcess','prazoDate','prazoEditId'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const urgencyEl = document.getElementById('prazoUrgency');
  if (urgencyEl) urgencyEl.value = 'normal';

  const respEl = document.getElementById('prazoResp');
  if (respEl) respEl.value = '';

  const titleEl = document.getElementById('prazoModalTitle');
  if (titleEl) titleEl.textContent = 'Novo Prazo';
}
