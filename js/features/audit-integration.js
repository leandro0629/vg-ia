// ============================================================
// AUDIT INTEGRATION - Como conectar logAction com as ações
// ============================================================

// Este arquivo mostra COMO adicionar auditoria nas funções existentes
// Copie esses exemplos para as suas funções reais

// ─── EXEMPLO 1: Criar Tarefa ───
export function saveTaskWithAudit() {
  // ... código existente para criar/editar tarefa ...

  const title = 'Petição ao TRF'; // exemplo
  const taskId = 123;
  const isEdit = false;

  // Registrar na auditoria
  if (isEdit) {
    window.logAction({
      action: 'task.edit',
      category: 'tasks',
      description: `Tarefa "${title}" editada`,
      entityId: taskId,
      entityTitle: title,
      color: '#c8a96e',
    });
  } else {
    window.logAction({
      action: 'task.create',
      category: 'tasks',
      description: `Tarefa "${title}" criada`,
      entityId: taskId,
      entityTitle: title,
      color: '#5b8dee',
    });
  }
}

// ─── EXEMPLO 2: Deletar Tarefa ───
export function deleteTaskWithAudit(taskId, taskTitle) {
  // ... código de delete ...

  window.logAction({
    action: 'task.delete',
    category: 'tasks',
    description: `Tarefa "${taskTitle}" deletada`,
    entityId: taskId,
    entityTitle: taskTitle,
    color: '#e05c5c',
  });
}

// ─── EXEMPLO 3: Mudar Status (Kanban) ───
export function toggleTaskStatusWithAudit(taskId, taskTitle, newStatus) {
  // ... código de alteração de status ...

  const statusLabels = {
    todo: 'A Fazer',
    doing: 'Em Andamento',
    review: 'Em Revisão',
    done: 'Concluído',
  };

  window.logAction({
    action: 'task.move',
    category: 'tasks',
    description: `Tarefa "${taskTitle}" movida para "${statusLabels[newStatus]}"`,
    entityId: taskId,
    entityTitle: taskTitle,
    color: '#5b8dee',
  });
}

// ─── EXEMPLO 4: Atribuir Responsável ───
export function assignTaskWithAudit(taskId, taskTitle, memberId, memberName) {
  // ... código de atribuição ...

  window.logAction({
    action: 'task.assign',
    category: 'tasks',
    description: `Tarefa "${taskTitle}" atribuída a ${memberName}`,
    entityId: taskId,
    entityTitle: taskTitle,
    color: '#5b8dee',
  });
}

// ─── EXEMPLO 5: Adicionar Membro ───
export function saveMemberWithAudit(memberId, memberName, role, isEdit) {
  // ... código de save member ...

  if (isEdit) {
    window.logAction({
      action: 'member.edit',
      category: 'members',
      description: `Membro "${memberName}" (${role}) editado`,
      entityId: memberId,
      entityTitle: memberName,
      color: '#c8a96e',
    });
  } else {
    window.logAction({
      action: 'member.add',
      category: 'members',
      description: `Membro "${memberName}" (${role}) adicionado`,
      entityId: memberId,
      entityTitle: memberName,
      color: '#5b8dee',
    });
  }
}

// ─── EXEMPLO 6: Deletar Membro ───
export function deleteMemberWithAudit(memberId, memberName) {
  // ... código de delete member ...

  window.logAction({
    action: 'member.delete',
    category: 'members',
    description: `Membro "${memberName}" removido`,
    entityId: memberId,
    entityTitle: memberName,
    color: '#e05c5c',
  });
}

// ─── EXEMPLO 7: Criar Prazo ───
export function savePrazoWithAudit(prazoId, prazoTitle, isEdit) {
  // ... código de save prazo ...

  if (isEdit) {
    window.logAction({
      action: 'prazo.edit',
      category: 'prazos',
      description: `Prazo "${prazoTitle}" editado`,
      entityId: prazoId,
      entityTitle: prazoTitle,
      color: '#c8a96e',
    });
  } else {
    window.logAction({
      action: 'prazo.create',
      category: 'prazos',
      description: `Prazo "${prazoTitle}" criado`,
      entityId: prazoId,
      entityTitle: prazoTitle,
      color: '#e0a44a',
    });
  }
}

// ─── EXEMPLO 8: Concluir Prazo ───
export function donePrazoWithAudit(prazoId, prazoTitle) {
  // ... código de concluir prazo ...

  window.logAction({
    action: 'prazo.complete',
    category: 'prazos',
    description: `Prazo "${prazoTitle}" cumprido`,
    entityId: prazoId,
    entityTitle: prazoTitle,
    color: '#4caf7d',
  });
}

// ─── EXEMPLO 9: Deletar Prazo ───
export function deletePrazoWithAudit(prazoId, prazoTitle) {
  // ... código de delete prazo ...

  window.logAction({
    action: 'prazo.delete',
    category: 'prazos',
    description: `Prazo "${prazoTitle}" removido`,
    entityId: prazoId,
    entityTitle: prazoTitle,
    color: '#e05c5c',
  });
}

// ─── EXEMPLO 10: Criar/Editar Município ───
export function saveMunicipioWithAudit(municipioId, municipioName, isEdit) {
  // ... código de save municipio ...

  if (isEdit) {
    window.logAction({
      action: 'municipio.edit',
      category: 'municipios',
      description: `Contrato "${municipioName}" atualizado`,
      entityId: municipioId,
      entityTitle: municipioName,
      color: '#c8a96e',
    });
  } else {
    window.logAction({
      action: 'municipio.create',
      category: 'municipios',
      description: `Contrato "${municipioName}" cadastrado`,
      entityId: municipioId,
      entityTitle: municipioName,
      color: '#5b8dee',
    });
  }
}

// ─── EXEMPLO 11: Deletar Município ───
export function deleteMunicipioWithAudit(municipioId, municipioName) {
  // ... código de delete municipio ...

  window.logAction({
    action: 'municipio.delete',
    category: 'municipios',
    description: `Contrato "${municipioName}" removido`,
    entityId: municipioId,
    entityTitle: municipioName,
    color: '#e05c5c',
  });
}

// ─── EXEMPLO 12: Login ───
export function doLoginWithAudit(userName, userRole) {
  // ... código de login ...

  window.logAction({
    action: 'auth.login',
    category: 'auth',
    description: `${userName} (${userRole}) fez login`,
    color: '#4caf7d',
  });
}

// ─── EXEMPLO 13: Logout ───
export function doLogoutWithAudit(userName) {
  // ... código de logout ...

  window.logAction({
    action: 'auth.logout',
    category: 'auth',
    description: `${userName} saiu da sessão`,
    color: '#e05c5c',
  });
}

// ============================================================
// TEMPLATE PARA ADICIONAR EM SUAS FUNÇÕES
// ============================================================

/*
PASSO A PASSO:

1. Encontre a função que quer adicionar auditoria
   Ex: function saveTask() { ... }

2. No FINAL da função (depois de salvar), adicione:

   window.logAction({
     action: 'categoria.verbo',      // ex: 'task.create'
     category: 'tasks',               // categoria principal
     description: 'O que foi feito',  // descrição legível
     entityId: itemId,                // ID do item afetado
     entityTitle: itemName,           // Nome do item
     color: '#5b8dee'                 // cor da timeline
   });

3. Cores sugeridas:
   - Criar: #5b8dee (azul)
   - Editar: #c8a96e (marrom)
   - Deletar: #e05c5c (vermelho)
   - Concluir: #4caf7d (verde)
   - Login: #4caf7d (verde)
   - Logout: #e05c5c (vermelho)
   - Prazo: #e0a44a (laranja)

4. Ações padrão:
   - .create (criar)
   - .edit (editar)
   - .delete (deletar)
   - .move (mover)
   - .assign (atribuir)
   - .complete (concluir)
   - .login / .logout
*/
