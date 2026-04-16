# KAUSAS - Sistema de Gestão Jurídica

## Stack
- Vanilla JS, ES6 modules (sem framework)
- Supabase Auth (autenticação) + Supabase DB (sync em tempo real)
- localStorage como cache local
- Vercel: `vercel --prod --yes` na pasta `C:\Users\leand\Desktop\SISTEMA KAUSAS OFICIAL\KAUSAS`

## Estrutura de Arquivos
```
js/
  index.js        → Entry point, importa tudo e expõe no window.*
  legacy.js       → renderPage() + lógica de UI por aba
  core/
    auth.js       → quickLogin (Supabase Auth + fallback VG), doLogout, changePassword, canDo, canSeePage
    storage.js    → load(), save(), attachments
    supabase.js   → initSupabase, _sbSave, _sbLoadAll, _setupRealtime
    audit.js      → logAction(), getAuditLog(), exportAuditLog()
  features/       → tasks, processos, prazos, members, municipios, auditoria, invites
  ui/             → modals, notifications, routing
  utils/
    constants.js  → STORAGE_KEYS, PERMISSIONS, SUPABASE_URL/KEY, SESSION_TIMEOUT_MS
    helpers.js    → escapeHTML, formatDate, getDaysLeft, generateId, debounce
index.html        → SPA. Páginas como <div class="page" id="page-X">
```

## Regras Críticas

### Salvar dados
```js
window.save(window.STORAGE_KEYS.tasks, window.tasks); // salva local + Supabase
// NUNCA chamar _sbSave após window.save (duplica envio)
```

### Globals
`window.tasks`, `window.members`, `window.prazos`, `window.activity`, `window.sharedAC`, `window.municipios`, `window.processos`, `window.currentUser`, `window.currentPage`

### Storage keys
`lex_tasks`, `lex_members`, `lex_prazos`, `lex_activity`, `lex_shared_ac`, `lex_municipios`, `lex_processos` — cada uma tem `_updated_at` correspondente.

## Autenticação (Supabase Auth)
- Login: `supabase.auth.signInWithPassword()` → busca perfil em `office_users` por email
- Fallback legado VG: verifica SHA-256 local → auto-migra para Supabase Auth via `signUp()`
- Sessão: `supabase.auth.getSession()` ao iniciar app (Supabase gerencia automaticamente)
- Logout: `supabase.auth.signOut()` — sincroniza todos os dispositivos
- Troca de senha: `supabase.auth.updateUser({ password })` — direto, sem localStorage
- Perfis: `admin`, `socio`, `advogado`, `estagiario` — permissões em `constants.js → PERMISSIONS`
- `window.canDo('canDeleteTasks')` / `window.canSeePage('auditoria')`

## Supabase
- Tabela `app_data`: `key` (PK), `data` (jsonb), `updated_at`
- Tabela `office_users`: perfis dos usuários com `office_id`
- Sync: app inicia → `_sbLoadAll()` → `window.save()` → `_sbSave()` → realtime via `_setupRealtime()`

## Renderização
- `navigate('pagina')` → `renderPage()` em `legacy.js` (switch por página)
- Nova página: `<div id="page-NOME">` no HTML + nav item + case no switch + `'NOME'` no array `pages` do perfil em `constants.js`

## Padrões de Código
```js
// Nova funcionalidade: implementar em features/, exportar, importar em index.js, expor no window.*
// Permissão sempre no início:
if (!window.canDo?.('canDeleteAlgo')) { window.showNotification?.('Sem permissão', 'error'); return; }
// Auditoria sempre após salvar:
window.logAction({ action: 'x.delete', category: 'tasks', description: '...', entityId, entityTitle, color });
```

## Projeto
- Cliente: VG Advocacia | URL: https://vg-ia.vercel.app
- Admin: kausasvgadmin@gmail.com
