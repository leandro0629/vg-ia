# KAUSAS - Sistema de Gestão Jurídica

## Stack
- Vanilla JS, ES6 modules (sem framework)
- Supabase (real-time sync + tabela `app_data`)
- localStorage como cache local
- Vercel (deploy: `vercel --prod --yes` na raiz do projeto)

## Deploy
```
cd "C:\Users\leand\Desktop\SISTEMA KAUSAS OFICIAL\KAUSAS"
vercel --prod --yes
```

---

## Estrutura de Arquivos

```
js/
  index.js              → Entry point. Importa tudo e expõe no window.*
  legacy.js             → renderPage() principal + renderPage_X() por aba

  core/
    auth.js             → Login, sessão, hashing, permissões, reset de senha
    storage.js          → load(), save(), attachments
    supabase.js         → initSupabase, _sbSave, _sbLoadAll, _setupRealtime
    audit.js            → logAction(), getAuditLog(), exportAuditLog()

  features/
    tasks.js            → saveTask, deleteTask, toggleTaskStatus, cycleTaskPriority, assignTask
    processos.js        → renderProcessos, saveProcesso, confirmDeleteProcesso, openProcessoDetail
    prazos.js           → savePrazo, donePrazo, deletePrazo, reopenPrazo
    members.js          → saveMember, deleteMember, editMember
    municipios.js       → saveMunicipio, deleteMunicipio
    auditoria.js        → renderAuditoria, filterAudit, searchAudit, loadMoreAudit, confirmClearAudit

  ui/
    modals.js           → openModal, closeModal, openTaskModal, openMemberModal, etc
    notifications.js    → showNotification, showUndoToast
    routing.js          → navigate, renderPage, toggleSidebarCollapse

  utils/
    constants.js        → STORAGE_KEYS, PERMISSIONS, AUTH_KEY, SUPABASE_URL, SESSION_TIMEOUT_MS
    helpers.js          → escapeHTML, formatDate, getDaysLeft, generateId, debounce

index.html              → HTML único (SPA). Todas as páginas como <div class="page" id="page-X">
```

---

## Regras Críticas de Arquitetura

### Salvar dados
```js
// SEMPRE usar window.save() — ele salva no localStorage E chama _sbSave automaticamente
window.save(window.STORAGE_KEYS.tasks, window.tasks);

// NUNCA chamar _sbSave diretamente após window.save (duplica o envio pro Supabase)
```

### Globals
Todos os dados ficam em `window.*` e são expostos em `index.js`:
- `window.tasks`, `window.members`, `window.prazos`, `window.activity`
- `window.sharedAC`, `window.municipios`, `window.processos`
- `window.currentUser`, `window.currentPage`

### Chaves do localStorage (STORAGE_KEYS)
```
lex_tasks, lex_members, lex_prazos, lex_activity,
lex_shared_ac, lex_municipios, lex_processos,
lex_reset_requests, lex_password_overrides
```
Cada chave tem um `_updated_at` correspondente (ex: `lex_tasks_updated_at`).

---

## Autenticação

### Senhas
- Hash SHA-256 com salt fixo: `kausas_vg_salt_2024`
- Função: `hashPassword(password)` em `auth.js` (async)
- Campo `_hashed: true` indica que já está hasheada

### Sessão
- **Padrão (sem lembrar):** `sessionStorage` — some ao fechar aba
- **Lembrar de mim:** `localStorage` com campo `_rememberExpiry` (7 dias)
- `getSession()` checa sessionStorage primeiro, depois localStorage

### Overrides de senha (reset remoto)
- Salvo em `lex_password_overrides` → array de `{userId, hash}`
- Sincroniza via Supabase para propagar entre dispositivos
- `quickLogin()` checa overrides ANTES da senha do usuário

### Multi-tab logout
- `BroadcastChannel('kausas-auth')` em `auth.js`
- `doLogout()` posta mensagem `'logout'` → outras abas limpam sessão

### Perfis e permissões
Perfis: `admin`, `socio`, `advogado`, `estagiario`

Verificar permissão:
```js
window.canDo('canDeleteTasks')   // retorna true/false
window.canSeePage('auditoria')   // retorna true/false
```
Permissões definidas em `constants.js` → objeto `PERMISSIONS`.

Acesso por perfil (regra geral):
- **admin/socio:** tudo
- **advogado:** ver e editar, não deleta membros/usuários
- **estagiario:** só visualiza e cria tarefas próprias

---

## Supabase

### Tabela principal
`app_data` com colunas: `key` (PK), `data` (jsonb), `updated_at` (timestamptz)

### Fluxo de sync
1. App inicia → `_sbLoadAll()` carrega dados do Supabase (compara timestamps com localStorage)
2. `window.save()` → salva local + chama `_sbSave()` → upsert no Supabase
3. `_setupRealtime()` escuta mudanças → atualiza globals + re-renderiza página

### Flag de carregamento
`window._sbLoadAllDone = true` é setado após `_sbLoadAll()` terminar.
Usado em `renderProcessos()` para evitar fallback de localStorage após Supabase estar pronto.

---

## Renderização

### Como funciona
- `navigate('nomePagina')` → atualiza `window.currentPage` → chama `renderPage()`
- `renderPage()` em `legacy.js` tem um `switch` com caso para cada página
- Cada caso chama a função de render correspondente (ex: `renderProcessos()`, `renderAuditoria()`)

### Adicionar nova página
1. Criar `<div class="page" id="page-NOME">` no `index.html`
2. Adicionar nav item no sidebar (com `onclick="navigate('NOME')"`)
3. Adicionar case no `renderPage()` em `legacy.js`
4. Adicionar `'NOME'` no array `pages` do perfil correto em `constants.js`

---

## Processos

### TIPOS_ACAO
Array em `processos.js` com 35+ tipos divididos por categoria:
- Ações Cíveis, Criminais, Trabalhistas, Administrativas, Eleitorais (AIME, RCE, etc.)

### Colunas da tabela
Número, Cliente, Tipo, Tribunal, Status, Responsável, Última Movimentação, Ações

### Permissão para deletar
Apenas `admin`, `socio`, `advogado` — verificado em `confirmDeleteProcesso()`.

---

## Auditoria

- `logAction({action, category, description, entityId, entityTitle, color})` em `audit.js`
- Armazenado em `lex_audit_log` no localStorage (NÃO sincroniza com Supabase)
- Categorias: `tasks`, `prazos`, `members`, `municipios`, `processos`, `auth`
- Exportável em CSV e JSON

---

## Notificações

### Reset de senha
- Quando membro pede reset → salvo em `lex_reset_requests` + Supabase
- Admin vê: badge no sino + banner na aba Usuários
- Admin reseta → `adminResetPassword(userId, newPassword)` → sincroniza via `lex_password_overrides`

### Push notifications (entre usuários)
- `window._sbPushNotif(targetMemberId, taskId, message)` — definido em `legacy.js`
- Armazenado em tabela `notifications` no Supabase

---

## Padrões de Código

### Adicionar funcionalidade
1. Implementar em `js/features/MODULO.js`
2. Exportar a função
3. Importar em `index.js`
4. Expor no `window.*` em `index.js`
5. Se for nova página, adicionar case no `renderPage()` de `legacy.js`

### Permissões sempre no início da função
```js
export function deleteAlgo(id) {
  if (!window.canDo?.('canDeleteAlgo')) {
    window.showNotification?.('Sem permissão', 'error');
    return;
  }
  // ... resto da lógica
}
```

### Auditoria sempre após salvar
```js
window.save(window.STORAGE_KEYS.tasks, window.tasks);
window.logAction({ action: 'task.delete', category: 'tasks', ... });
```

---

## Informações do Projeto

- **Cliente:** escritório de advocacia VG
- **URL produção:** https://vg-ia.vercel.app
- **Admin padrão:** kausasvgadmin@gmail.com / legal0629
- **Última atualização:** 2026-04-14
