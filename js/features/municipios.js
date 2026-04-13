// ============================================================
// MUNICIPIOS FEATURE - COM AUDITORIA INTEGRADA
// ============================================================

/**
 * Salvar município/contrato (criar ou editar) com auditoria
 */
export function saveMunicipio() {
  const cityName = document.getElementById('munName').value.trim();
  if (!cityName) {
    alert('Informe o nome do município');
    return;
  }

  const entityType = document.getElementById('munTipo').value.trim();
  const name = `${cityName} – ${entityType}`;
  const editId = parseInt(document.getElementById('munEditId').value) || null;
  const team = parseInt(document.getElementById('munTeam').value) || null;
  const advogado = parseInt(document.getElementById('munAdvogado').value) || null;
  const obs = document.getElementById('munObs').value.trim();

  if (editId) {
    // ─── EDITAR MUNICÍPIO ───
    const m = window.municipios.find(x => x.id === editId);
    if (m) {
      const oldName = m.name;
      m.name = name;
      m.team = team;
      m.advogado = advogado;
      m.obs = obs;

      window.save(window.STORAGE_KEYS.municipios, window.municipios);

      // 📋 AUDITORIA - Município editado
      window.logAction({
        action: 'municipio.edit',
        category: 'municipios',
        description: `Contrato "${name}" atualizado`,
        entityId: editId,
        entityTitle: name,
        color: '#c8a96e'
      });
    }
  } else {
    // ─── CRIAR MUNICÍPIO ───
    window.municipios.push({
      id: Date.now(),
      name,
      team,
      contrato: '',
      advogado,
      obs
    });

    window.save(window.STORAGE_KEYS.municipios, window.municipios);

    // 📋 AUDITORIA - Município criado
    window.logAction({
      action: 'municipio.create',
      category: 'municipios',
      description: `Contrato "${name}" cadastrado`,
      entityId: Date.now(),
      entityTitle: name,
      color: '#5b8dee'
    });
  }

  clearMunicipioForm();
  window.closeModal('modalMunicipio');
  if (typeof window.renderMunicipios === 'function') {
    window.renderMunicipios();
  }
}

/**
 * Deletar município/contrato com auditoria
 */
export function deleteMunicipio(id) {
  const idx = window.municipios.findIndex(m => m.id === id);
  if (idx === -1) return;

  const removed = window.municipios.splice(idx, 1)[0];
  if (typeof window.renderMunicipios === 'function') {
    window.renderMunicipios();
  }

  window.showUndoToast({
    label: 'Contrato removido',
    title: removed.name,
    onUndo: () => {
      window.municipios.splice(idx, 0, removed);
      window.save(window.STORAGE_KEYS.municipios, window.municipios);
      if (typeof window.renderMunicipios === 'function') {
        window.renderMunicipios();
      }
    },
    onExpire: () => {
      window.save(window.STORAGE_KEYS.municipios, window.municipios);

      // 📋 AUDITORIA - Município deletado
      window.logAction({
        action: 'municipio.delete',
        category: 'municipios',
        description: `Contrato "${removed.name}" removido`,
        entityId: id,
        entityTitle: removed.name,
        color: '#e05c5c'
      });
    }
  });
}

/**
 * Limpar formulário de município
 */
function clearMunicipioForm() {
  ['munName','munEditId','munObs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const tipoEl = document.getElementById('munTipo');
  if (tipoEl) tipoEl.value = 'Prefeitura';

  const teamEl = document.getElementById('munTeam');
  if (teamEl) teamEl.value = '';

  const advogadoEl = document.getElementById('munAdvogado');
  if (advogadoEl) advogadoEl.value = '';

  const titleEl = document.getElementById('munModalTitle');
  if (titleEl) titleEl.textContent = '📋 Novo Contrato';
}
