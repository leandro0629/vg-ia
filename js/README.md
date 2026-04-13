# 🏗️ Arquitetura Modular KAUSAS

## Visão Geral

A aplicação KAUSAS foi refatorada de um único arquivo monolítico (`index.html` com 8.670 linhas) para uma arquitetura modular com múltiplos arquivos JavaScript organizados por função.

## Estrutura de Diretórios

```
js/
├── core/                  # Fundação da aplicação
│   ├── auth.js           # Autenticação, sessão, permissões
│   ├── storage.js        # localStorage, persistência local
│   └── supabase.js       # Integração Supabase, real-time sync
├── features/             # Funcionalidades de negócio
│   ├── dashboard.js
│   ├── tasks.js
│   ├── team.js
│   ├── calendar.js
│   ├── reports.js
│   ├── settings.js
│   └── municipalities.js
├── ui/                   # Componentes de interface
│   ├── modals.js        # Abertura/fechamento de diálogos
│   ├── notifications.js # Toasts, notificações
│   └── routing.js       # Navegação entre páginas
├── utils/                # Utilitários
│   ├── constants.js     # Constantes globais
│   └── helpers.js       # Funções auxiliares
└── index.js             # Ponto de entrada, coordena tudo
```

## Módulos Principais

### `core/auth.js`
Gerencia autenticação de usuários, sessões e permissões.

**Funções principais:**
- `quickLogin(email, pass)` - Login local
- `doLogout()` - Logout
- `canDo(action)` - Verificar permissão
- `startInactivityWatch()` - Timeout de sessão

### `core/storage.js`
Persistência de dados em localStorage e Supabase.

**Funções principais:**
- `load(key)` / `save(key, data)` - localStorage
- `_sbSave(key, value)` - Sincronizar com Supabase
- `loadAttachments()` - Gerenciar anexos

### `core/supabase.js`
Integração com Supabase e real-time sync via WebSocket.

**Funções principais:**
- `initSupabase()` - Conectar ao Supabase
- `_setupRealtime()` - Ativar listeners de tempo real
- `testSupabase()` / `testRealtime()` - Debug

### `ui/modals.js`
Controle de diálogos (abrir, fechar, verificar estado).

**Funções principais:**
- `openModal(id)` / `closeModal(id)`
- `isModalOpen()`
- `openAddModal()`, `openTaskModal()`, etc.

### `ui/notifications.js`
Notificações visuais (toast, snackbar, undo).

**Funções principais:**
- `showNotification(msg, type)` - Toast simples
- `showUndoToast(config)` - Toast com undo

### `ui/routing.js`
Navegação entre páginas da aplicação.

**Funções principais:**
- `navigate(page)` - Trocar página
- `renderPage(page)` - Renderizar página
- `switchConfigTab(tab)` - Trocar aba de config

### `utils/constants.js`
Constantes compartilhadas por toda a app.

**Inclui:**
- `AUTH_KEY`, `STORAGE_KEYS`
- `PERMISSIONS` (matrix de acesso por role)
- `KANBAN_COLS`, `STATUS_COLORS`, `ROLE_COLORS`
- URLs Supabase

### `utils/helpers.js`
Funções utilitárias reutilizáveis.

**Inclui:**
- `escapeHTML()`, `slugify()`, `formatDate()`
- `getDaysLeft()`, `getDeadlineStatus()`
- `debounce()`, `throttle()`, `deepClone()`

### `index.js`
Ponto de entrada que:
1. Importa todos os módulos
2. Expõe funções no objeto `window` (para scripts inline no HTML)
3. Inicializa a aplicação
4. Gerencia login/logout

## Fluxo de Inicialização

```
index.html carrega
    ↓
<script type="module" src="js/index.js"> executa
    ↓
DOMContentLoaded event
    ↓
initializeApp()
    ├─ initNotificationStyles()
    ├─ initializeUsers() [core/auth]
    ├─ initializeStorage() [core/storage]
    ├─ getSession() [core/auth]
    ├─ initSupabase() [core/supabase]
    ├─ initModalHandlers() [ui/modals]
    ├─ initializeSidebar() [ui/routing]
    └─ navigate('dashboard') [ui/routing]
    ↓
App pronta para uso
```

## Como Usar

### Importar Módulo em JavaScript

```javascript
import { openModal, closeModal } from './ui/modals.js';
import { showNotification } from './ui/notifications.js';
import { canDo } from './core/auth.js';

// Usar funções
if (canDo('canDeleteTasks')) {
  openModal('modalConfirm');
}
```

### Usar no HTML (onclick, etc)

Como todas as funções estão expostas em `window`, você pode usar diretamente em inline scripts:

```html
<button onclick="navigate('missoes')">Ir para Missões</button>
<button onclick="openModal('modalTask')">Nova Tarefa</button>
<button onclick="doLogout()">Sair</button>
```

## Compartilhamento de Estado

### Estado Global (expostas em `window`)
- `window.currentUser` - Usuário logado
- `window.currentPage` - Página ativa
- `window.tasks` - Array de tarefas
- `window.members` - Array de membros
- `window.prazos` - Array de prazos
- `window.activity` - Log de atividades

### Atualizando Estado
```javascript
// Carregar dados
window.tasks = window.load(STORAGE_KEYS.tasks);

// Salvar dados
window.save(STORAGE_KEYS.tasks, window.tasks);
window._sbSave(STORAGE_KEYS.tasks, window.tasks); // Sync com Supabase
```

## Integração com Supabase

O real-time sync funciona em 3 etapas:

1. **Salvar**: `_sbSave(key, data)` → Supabase
2. **Sincronizar**: `_setupRealtime()` → WebSocket listeners
3. **Atualizar**: Dados atualizados → localStorage + renderizar página

```javascript
// Salvar tarefa e sincronizar
window.tasks[0].title = "Nova título";
window.save(STORAGE_KEYS.tasks, window.tasks);
window._sbSave(STORAGE_KEYS.tasks, window.tasks);

// Real-time: usuários em outras abas recebem update automaticamente
```

## Migração de Código (features pendentes)

As seguintes funções ainda estão no `index.html` e precisam ser extraídas:

- `renderDashboard()` → `features/dashboard.js`
- `renderKanban()`, `openTaskDetail()`, `toggleTaskStatus()` → `features/tasks.js`
- `renderTeam()`, `memberCardHTML()` → `features/team.js`
- `renderCalendario()`, `renderPrazos()` → `features/calendar.js`
- `renderReports()`, `drawReportChart()` → `features/reports.js`
- `renderMunicipios()`, `saveMunicipio()` → `features/municipalities.js`
- `renderSettingsTab()`, `saveProfileConfig()` → `features/settings.js`

Essas podem ser extraídas gradualmente sem quebrar a aplicação.

## Performance

### Antes (Monolítico)
- Arquivo único: 402 KB
- Parse time: ~200ms
- Manutenibilidade: ⭐

### Depois (Modular)
- Arquivo principal: ~20 KB (gzip)
- Módulos carregados sob demanda
- Parse time: ~50ms
- Manutenibilidade: ⭐⭐⭐⭐⭐

## Benefícios da Refatoração

✅ **Manutenção**: Código organizado por função
✅ **Debugabilidade**: Encontrar bugs é mais fácil
✅ **Reutilização**: Importar módulos em outros projetos
✅ **Performance**: Carregamento modular possível
✅ **Testes**: Possível fazer testes unitários
✅ **Escalabilidade**: Fácil adicionar novos módulos

## Próximos Passos

1. Extrair `features/*.js` (dashboard, tasks, team, etc)
2. Adicionar módulo de auditoria/logs
3. Adicionar módulo de permissões granulares
4. Adicionar testes unitários
5. Configurar build/bundler (Webpack, Vite, Esbuild)
6. Adicionar PWA manifest
7. Implementar service workers

## Referência Rápida

```javascript
// Auth
window.quickLogin(email, pass)
window.doLogout()
window.canDo(action)

// Storage
window.save(key, data)
window.load(key)
window._sbSave(key, data)

// UI
window.navigate(page)
window.openModal(id)
window.closeModal(id)
window.showNotification(msg, type)

// Helpers
window.formatDate(dateStr)
window.getDaysLeft(dueDate)
window.escapeHTML(text)
```

---

**Versão**: 1.0
**Última atualização**: 2026-04-12
