// ============================================================
// TASKS FEATURE - COM AUDITORIA INTEGRADA
// ============================================================

/**
 * Salvar tarefa (criar ou editar) com auditoria
 */
export function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { alert('Informe o título da tarefa'); return; }

  const editId = parseInt(document.getElementById('taskEditId').value) || null;

  if (editId) {
    // ─── EDITAR TAREFA ───
    const t = window.tasks.find(x => x.id === editId);
    if (t) {
      const mode = document.getElementById('taskMode').value;
      const oldAssignee = t.assignee;

      t.title    = title;
      t.assignee = parseInt(document.getElementById('taskAssignee').value);
      t.priority = document.getElementById('taskPriority').value;
      t.due      = document.getElementById('taskDue').value;
      t.process  = document.getElementById('taskProcess').value;
      t.desc     = document.getElementById('taskDesc').value;
      t.tipo     = document.getElementById('taskTipo').value;
      t.municipio = document.getElementById('taskMunicipio').value;
      t.checklist = window.pendingChecklist?.slice() || [];
      t.mode = mode;

      if (mode === 'compartilhada') {
        t.owner = parseInt(document.getElementById('taskOwner').value);
        t.participants = window.pendingTaskParticipants?.map(memberId => ({
          memberId,
          subtasks: []
        })) || [];
        t.delegationLog = t.delegationLog || [];
        t.status = t.status || 'ativa';
        if (window.pendingTaskSubtasks?.length) {
          const ownerParticipant = t.participants.find(p => p.memberId === t.assignee);
          if (ownerParticipant) {
            ownerParticipant.subtasks = window.pendingTaskSubtasks.slice();
          } else {
            t.participants.push({
              memberId: t.assignee,
              subtasks: window.pendingTaskSubtasks.slice()
            });
          }
        }
      }

      if (window.pendingAttachments?.length) {
        window.pendingAttachments.forEach(a => {
          if (a._data && typeof window.saveAttachment === 'function') {
            window.saveAttachment(a.id, a._data);
          }
        });
        const meta = window.pendingAttachments.map(({id, name, type, size}) => ({id, name, type, size}));
        t.attachments = (t.attachments || []).concat(meta);
      }

      window.save(window.STORAGE_KEYS.tasks, window.tasks);

      // 📋 AUDITORIA - Tarefa editada
      window.logAction({
        action: 'task.edit',
        category: 'tasks',
        description: `Tarefa "${title.substring(0,50)}" editada`,
        entityId: editId,
        entityTitle: title,
        color: '#c8a96e'
      });

      // Notificar novo responsável se mudou
      if (t.assignee !== oldAssignee && t.assignee !== window.currentUser?.memberId) {
        if (typeof window._sbPushNotif === 'function') {
          window._sbPushNotif(t.assignee, t.id, `${window.currentUser.name} atribuiu a missão "${title.substring(0,40)}" a você`);
        }
      }
    }
  } else {
    // ─── CRIAR TAREFA ───
    const kanbanCol = document.getElementById('modalTask').dataset.kanbanCol || 'todo';
    const mode = document.getElementById('taskMode').value;

    const t = {
      id: Date.now(),
      title,
      assignee: parseInt(document.getElementById('taskAssignee').value),
      priority: document.getElementById('taskPriority').value,
      due: document.getElementById('taskDue').value,
      process: document.getElementById('taskProcess').value,
      desc: document.getElementById('taskDesc').value,
      tipo: document.getElementById('taskTipo').value,
      municipio: document.getElementById('taskMunicipio').value,
      checklist: window.pendingChecklist?.slice() || [],
      comments: [],
      attachments: (() => {
        if (window.pendingAttachments?.length && typeof window.saveAttachment === 'function') {
          window.pendingAttachments.forEach(a => {
            if (a._data) window.saveAttachment(a.id, a._data);
          });
          return window.pendingAttachments.map(({id, name, type, size}) => ({id, name, type, size}));
        }
        return [];
      })(),
      kanbanStatus: kanbanCol,
      done: false,
      mode: mode,
      created: new Date().toISOString(),
      ...(mode === 'compartilhada' && {
        owner: parseInt(document.getElementById('taskOwner').value),
        participants: window.pendingTaskParticipants?.map(memberId => ({
          memberId,
          subtasks: []
        })) || [],
        delegationLog: [],
        status: 'ativa'
      })
    };

    // If compartilhada, add subtasks to assignee (owner of the shared activity)
    if (mode === 'compartilhada' && window.pendingTaskSubtasks?.length) {
      const ownerParticipant = t.participants.find(p => p.memberId === t.assignee);
      if (ownerParticipant) {
        ownerParticipant.subtasks = window.pendingTaskSubtasks.slice();
      } else {
        t.participants.push({
          memberId: t.assignee,
          subtasks: window.pendingTaskSubtasks.slice()
        });
      }
    }

    window.tasks.push(t);
    window.save(window.STORAGE_KEYS.tasks, window.tasks);

    // 📋 AUDITORIA - Tarefa criada
    window.logAction({
      action: 'task.create',
      category: 'tasks',
      description: `Tarefa "${title.substring(0,50)}" criada`,
      entityId: t.id,
      entityTitle: title,
      color: '#5b8dee'
    });

    // Enviar notificação para o responsável
    if (t.assignee && window.currentUser && t.assignee !== window.currentUser.memberId) {
      if (typeof window._sbPushNotif === 'function') {
        window._sbPushNotif(t.assignee, t.id, `${window.currentUser.name} atribuiu a missão "${title.substring(0,40)}" a você`);
      }
    }

    // 📧 Email notificação - missão criada
    if (typeof window._enviarEmailMissao === 'function') {
      window._enviarEmailMissao(t, 'criada');
    }
  }

  window.closeModal('modalTask');
  clearTaskForm();
  window.renderPage(window.currentPage);
}

/**
 * Deletar tarefa com auditoria
 */
export function deleteTask(id) {
  const idx = window.tasks.findIndex(t => t.id === id);
  if (idx === -1) return;

  const removed = window.tasks.splice(idx, 1)[0];
  window.renderPage(window.currentPage);

  window.showUndoToast({
    label: 'Tarefa removida',
    title: removed.title,
    onUndo: () => {
      window.tasks.splice(idx, 0, removed);
      window.save(window.STORAGE_KEYS.tasks, window.tasks);
      if (typeof window._sbSave === 'function') {
        window._sbSave('lex_tasks', window.tasks);
      }
      window.renderPage(window.currentPage);
    },
    onExpire: () => {
      if (typeof window.DB?.deleteTask === 'function') {
        window.DB.deleteTask(id);
      }
      window.save(window.STORAGE_KEYS.tasks, window.tasks);

      // 📋 AUDITORIA - Tarefa deletada
      window.logAction({
        action: 'task.delete',
        category: 'tasks',
        description: `Tarefa "${removed.title.substring(0,50)}" deletada`,
        entityId: id,
        entityTitle: removed.title,
        color: '#e05c5c'
      });
    }
  });
}

/**
 * Mudar status da tarefa no Kanban com auditoria
 */
export function toggleTaskStatus(taskId) {
  const t = window.tasks.find(x => x.id === taskId);
  if (!t) return;

  const order = ['todo', 'doing', 'review', 'done'];
  const cur = t.kanbanStatus || (t.done ? 'done' : 'todo');
  const next = order[(order.indexOf(cur) + 1) % order.length];

  setTaskStatus(taskId, next);

  const labels = {
    todo: 'A Fazer',
    doing: 'Em Andamento',
    review: 'Em Revisão',
    done: 'Concluído'
  };

  // 📋 AUDITORIA - Status alterado
  window.logAction({
    action: 'task.move',
    category: 'tasks',
    description: `Tarefa "${t.title.substring(0,50)}" movida para "${labels[next]}"`,
    entityId: taskId,
    entityTitle: t.title,
    color: '#5b8dee'
  });

  window.renderKanban?.();
  window.openTaskDetail?.(taskId);
}

/**
 * Ciclar prioridade (internal helper - sem auditoria direta)
 */
export function cycleTaskPriority(taskId) {
  const t = window.tasks.find(x => x.id === taskId);
  if (!t) return;

  const priorities = ['baixa', 'normal', 'urgente'];
  const currentIdx = priorities.indexOf(t.priority);
  t.priority = priorities[(currentIdx + 1) % priorities.length];

  window.save(window.STORAGE_KEYS.tasks, window.tasks);

  // 📋 AUDITORIA - Prioridade alterada
  window.logAction({
    action: 'task.priority',
    category: 'tasks',
    description: `Prioridade de "${t.title.substring(0,50)}" alterada para ${t.priority}`,
    entityId: taskId,
    entityTitle: t.title,
    color: '#c8a96e'
  });

  window.openTaskDetail?.(taskId);
}

/**
 * Atribuir responsável à tarefa com auditoria
 */
export function assignTask(taskId, newAssigneeId) {
  const t = window.tasks.find(x => x.id === taskId);
  if (!t) return;

  const oldAssignee = t.assignee;
  const assignee = window.members.find(m => m.id === newAssigneeId);
  const assigneeName = assignee?.name || 'Desconhecido';

  t.assignee = newAssigneeId;
  window.save(window.STORAGE_KEYS.tasks, window.tasks);

  // 📋 AUDITORIA - Tarefa atribuída
  window.logAction({
    action: 'task.assign',
    category: 'tasks',
    description: `Tarefa "${t.title.substring(0,50)}" atribuída a ${assigneeName}`,
    entityId: taskId,
    entityTitle: t.title,
    color: '#5b8dee'
  });

  // Notificar novo responsável
  if (newAssigneeId !== window.currentUser?.memberId && typeof window._sbPushNotif === 'function') {
    window._sbPushNotif(newAssigneeId, taskId, `${window.currentUser?.name} atribuiu a missão "${t.title.substring(0,40)}" a você`);
  }
}

/**
 * Helper para limpar formulário de tarefa
 */
function clearTaskForm() {
  ['taskTitle','taskDue','taskProcess','taskDesc','taskEditId'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const prioEl = document.getElementById('taskPriority');
  if (prioEl) prioEl.value = 'normal';

  const tipoEl = document.getElementById('taskTipo');
  if (tipoEl) tipoEl.value = '';

  const munEl = document.getElementById('taskMunicipio');
  if (munEl) munEl.value = '';

  const modeEl = document.getElementById('taskMode');
  if (modeEl) modeEl.value = 'individual';

  const titleEl = document.getElementById('modalTaskTitle');
  if (titleEl) titleEl.textContent = 'Nova Tarefa';

  window.pendingChecklist = [];
  if (typeof window.renderChecklistItems === 'function') {
    window.renderChecklistItems();
  }

  const commentsSection = document.getElementById('taskCommentsSection');
  if (commentsSection) commentsSection.style.display = 'none';

  const commentList = document.getElementById('taskCommentList');
  if (commentList) commentList.innerHTML = '';

  const commentInput = document.getElementById('taskCommentInput');
  if (commentInput) commentInput.value = '';

  window.pendingAttachments = [];
  if (typeof window.renderAttachPreview === 'function') {
    window.renderAttachPreview();
  }

  window.pendingTaskParticipants = [];
  window.pendingTaskSubtasks = [];

  const compartilhadaSection = document.getElementById('taskCompartilhadaSection');
  if (compartilhadaSection) compartilhadaSection.style.display = 'none';

  const participantsSection = document.getElementById('taskParticipantsSection');
  if (participantsSection) participantsSection.innerHTML = '';

  const subtaskInput = document.getElementById('taskSubtaskInput');
  if (subtaskInput) subtaskInput.value = '';

  const subtaskItems = document.getElementById('taskSubtaskItems');
  if (subtaskItems) subtaskItems.innerHTML = '';
}

/**
 * Helper para definir status da tarefa
 */
function setTaskStatus(taskId, status) {
  const t = window.tasks.find(x => x.id === taskId);
  if (!t) return;

  t.kanbanStatus = status;
  if (status === 'done') {
    t.done = true;
  } else {
    t.done = false;
  }

  window.save(window.STORAGE_KEYS.tasks, window.tasks);

  if (typeof window._sbSave === 'function') {
    window._sbSave('lex_tasks', window.tasks);
  }
}
