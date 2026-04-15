// ============================================================
// INVITE CODES MANAGEMENT — Admin Panel
// ============================================================

// Gerar um código aleatório formatado
function _generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VG-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Gerar um novo código de convite
export async function generateInviteCode() {
  if (!window.canDo?.('canCreateInvites')) {
    window.showNotification?.('Sem permissão para criar códigos de convite', 'error');
    return;
  }

  if (!window._sb) {
    window.showNotification?.('Sistema offline', 'error');
    return;
  }

  const code = _generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Válido por 30 dias

  try {
    const { error } = await window._sb
      .from('invite_codes')
      .insert({
        code,
        created_by: window.currentUser?.id || 'system',
        expires_at: expiresAt.toISOString(),
        is_used: false
      });

    if (error) {
      window.showNotification?.('Erro ao gerar código: ' + error.message, 'error');
      return;
    }

    // Mostrar código gerado
    const resultEl = document.getElementById('inviteCodeResult');
    const codeEl = document.getElementById('inviteCodeValue');
    if (resultEl && codeEl) {
      codeEl.textContent = code;
      resultEl.style.display = 'block';
    }

    window.showNotification?.('Código gerado com sucesso!', 'success');
    await loadInviteCodes();
  } catch (e) {
    console.error('Erro ao gerar código:', e);
    window.showNotification?.('Erro ao gerar código', 'error');
  }
}

// Gerar múltiplos códigos de uma vez
export async function generateMultipleInviteCodes() {
  if (!window.canDo?.('canCreateInvites')) {
    window.showNotification?.('Sem permissão para criar códigos de convite', 'error');
    return;
  }

  if (!window._sb) {
    window.showNotification?.('Sistema offline', 'error');
    return;
  }

  const codes = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  for (let i = 0; i < 5; i++) {
    codes.push({
      code: _generateCode(),
      created_by: window.currentUser?.id || 'system',
      expires_at: expiresAt.toISOString(),
      is_used: false
    });
  }

  try {
    const { error } = await window._sb
      .from('invite_codes')
      .insert(codes);

    if (error) {
      window.showNotification?.('Erro ao gerar códigos: ' + error.message, 'error');
      return;
    }

    window.showNotification?.('5 códigos gerados com sucesso!', 'success');
    await loadInviteCodes();
  } catch (e) {
    console.error('Erro ao gerar códigos:', e);
    window.showNotification?.('Erro ao gerar códigos', 'error');
  }
}

// Carregar lista de códigos de convite
export async function loadInviteCodes() {
  if (!window._sb) return;

  try {
    const { data, error } = await window._sb
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar códigos:', error);
      return;
    }

    renderInviteCodes(data || []);
  } catch (e) {
    console.error('Erro ao carregar códigos:', e);
  }
}

// Renderizar tabela de códigos
function renderInviteCodes(codes) {
  const tableEl = document.getElementById('inviteCodesTable');
  const emptyEl = document.getElementById('inviteCodesEmpty');
  const filterEl = document.getElementById('inviteCodeFilter');
  const filterValue = filterEl?.value || 'all';

  if (!tableEl) return;

  const now = new Date();
  let filtered = codes;

  if (filterValue !== 'all') {
    filtered = codes.filter(code => {
      if (filterValue === 'unused') return !code.is_used;
      if (filterValue === 'used') return code.is_used;
      if (filterValue === 'expired') {
        return code.expires_at && new Date(code.expires_at) < now;
      }
      return true;
    });
  }

  if (filtered.length === 0) {
    tableEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  tableEl.style.display = 'table-row-group';
  emptyEl.style.display = 'none';
  tableEl.innerHTML = filtered.map(code => {
    const isExpired = code.expires_at && new Date(code.expires_at) < now;
    const createdDate = new Date(code.created_at);
    const expiresDate = code.expires_at ? new Date(code.expires_at) : null;

    let statusLabel = '🟢 Ativo';
    let statusColor = 'var(--success)';

    if (code.is_used) {
      statusLabel = '✅ Utilizado';
      statusColor = 'var(--text-secondary)';
    } else if (isExpired) {
      statusLabel = '⏰ Expirado';
      statusColor = 'var(--warn)';
    }

    return `
      <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
        <td style="padding: 12px; font-family: monospace; color: var(--primary); font-weight: 600;">${code.code}</td>
        <td style="padding: 12px; color: ${statusColor}; font-weight: 500;">${statusLabel}</td>
        <td style="padding: 12px; color: var(--text-secondary); font-size: 0.9rem;">${createdDate.toLocaleDateString('pt-BR')}</td>
        <td style="padding: 12px; color: var(--text-secondary); font-size: 0.9rem;">${expiresDate ? expiresDate.toLocaleDateString('pt-BR') : '—'}</td>
        <td style="padding: 12px; color: var(--text-secondary); font-size: 0.9rem;">${code.used_by ? '✓ ' + code.used_by.substring(0, 8) : '—'}</td>
        <td style="padding: 12px; text-align: center;">
          ${!code.is_used ? `
            <button class="btn btn-ghost btn-sm" onclick="revokeInviteCode('${code.id}')" title="Revogar código">
              🗑
            </button>
          ` : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

// Revogar um código de convite
export async function revokeInviteCode(codeId) {
  if (!window.canDo?.('canCreateInvites')) {
    window.showNotification?.('Sem permissão', 'error');
    return;
  }

  if (!window._sb) {
    window.showNotification?.('Sistema offline', 'error');
    return;
  }

  const confirmed = confirm('Tem certeza que deseja revogar este código?');
  if (!confirmed) return;

  try {
    const { error } = await window._sb
      .from('invite_codes')
      .delete()
      .eq('id', codeId);

    if (error) {
      window.showNotification?.('Erro ao revogar código', 'error');
      return;
    }

    window.showNotification?.('Código revogado com sucesso', 'success');
    await loadInviteCodes();
  } catch (e) {
    console.error('Erro ao revogar código:', e);
    window.showNotification?.('Erro ao revogar código', 'error');
  }
}

// Filtrar códigos
export async function filterInviteCodes() {
  const tableEl = document.getElementById('inviteCodesTable');
  if (!tableEl) return;

  // Recarregar e renderizar
  if (window._sb) {
    try {
      const { data } = await window._sb
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) renderInviteCodes(data);
    } catch (e) {
      console.error('Erro ao filtrar códigos:', e);
    }
  }
}

// Copiar código para clipboard
export function copyInviteCode() {
  const codeEl = document.getElementById('inviteCodeValue');
  if (!codeEl) return;

  const code = codeEl.textContent;
  navigator.clipboard.writeText(code).then(() => {
    window.showNotification?.('Código copiado para a área de transferência!', 'success');
  }).catch(() => {
    window.showNotification?.('Erro ao copiar código', 'error');
  });
}
