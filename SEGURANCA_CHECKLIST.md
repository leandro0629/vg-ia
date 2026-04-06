# ✅ Checklist de Segurança - VG IA

## Status: 🟡 EM PROGRESSO (Aguardando configuração manual no Supabase)

---

## O que foi feito

### ✅ Aplicação (index.html)
- [x] Remover senhas do código-fonte (15 usuários hardcoded)
- [x] Modificar `salvarNovoUsuario()` para criar conta no Supabase Auth
- [x] Modificar `changePassword()` para usar Supabase Auth
- [x] Remover campo `password` dos usuários salvos no localStorage/Supabase
- [x] Deploy realizado em https://vg-ia-21314.web.app

### ✅ Scripts de Setup
- [x] Criar `setup-supabase.js` para verificar conexão e tabelas
- [x] Gerar `rls-setup.sql` com políticas de segurança RLS
- [x] Script pronto para registrar usuários no Supabase Auth

### 🟡 Supabase (Aguardando execução manual)
- [ ] **Aplicar políticas RLS** (via Supabase Dashboard)
- [ ] **Criar tabela `user_profiles`** (via Supabase Dashboard)
- [ ] Registrar usuários hardcoded no Supabase Auth (opcional)

---

## Como aplicar o SQL no Supabase

### Passo 1: Acessar Supabase Dashboard
1. Vá para: https://app.supabase.com
2. Selecione o projeto **vg-ia-21314**
3. Clique em **SQL Editor** (menu esquerdo)

### Passo 2: Criar nova query
1. Clique em **New Query**
2. Copie o conteúdo completo do arquivo: `rls-setup.sql`
3. Cole no editor

### Passo 3: Executar SQL
1. Clique em **Run** (Ctrl+Enter)
2. Aguarde a execução
3. Você deverá ver: **Success** e confirmação das tabelas/políticas criadas

### Passo 4: Verificar resultado
1. Vá para **Table Editor** (menu esquerdo)
2. Verifique se a tabela `user_profiles` aparece na lista
3. Clique em `app_data` e veja a aba **Policies** para verificar as políticas RLS

---

## Vulnerabilidades CORRIGIDAS

### 🔴 Críticas (Antes)
| Problema | Status | Solução |
|----------|--------|---------|
| Senhas em texto puro no localStorage | ✅ CORRIGIDO | Senhas removidas, autenticação via Supabase Auth |
| Senhas hardcoded no código-fonte | ✅ CORRIGIDO | Removidas 15 senhas do `index.html` |
| Senhas comparadas localmente (MD5?) | ✅ CORRIGIDO | Supabase Auth cuida da autenticação |
| Sem RLS no Supabase | 🟡 PENDENTE | RLS será aplicada após executar SQL |

### 🟠 Altas (Antes)
| Problema | Status | Solução |
|----------|--------|---------|
| `salvarNovoUsuario()` não cria Supabase Auth | ✅ CORRIGIDO | Agora chama `_sb.auth.signUp()` |
| `changePassword()` não atualiza Supabase Auth | ✅ CORRIGIDO | Agora usa `_sb.auth.updateUser()` |
| Sem tabela `user_profiles` | 🟡 PENDENTE | Será criada ao executar `rls-setup.sql` |

---

## Arquivos de Segurança

```
JUS IA/
├── index.html                  ✅ Modificado (autenticação segura)
├── setup-supabase.js          ✅ Novo (script de verificação)
├── rls-setup.sql              ✅ Novo (políticas RLS)
└── SEGURANCA_CHECKLIST.md     ✅ Este arquivo
```

---

## Testando a Segurança

### Teste 1: Login com Supabase Auth
1. Acesse https://vg-ia-21314.web.app
2. Tente fazer login com um dos usuários existentes (ex: teste123@gmail.com)
3. Verifique o console (F12) para logs de autenticação

### Teste 2: Criar novo usuário
1. Faça login como admin
2. Vá para **Usuários** > **+ Novo Usuário**
3. Preencha os dados e salve
4. O usuário deve aparecer no Supabase Auth
5. Deve conseguir fazer login com as credenciais criadas

### Teste 3: Alterar senha
1. Faça login
2. Clique na foto > **Alterar Senha**
3. Altere e confirme
4. Faça logout e tente fazer login com a nova senha
5. Deve funcionar (senha atualizada no Supabase Auth)

### Teste 4: Verificar localStorage
1. Abra DevTools (F12) > **Application** > **Local Storage**
2. Procure pela chave `lex_users`
3. **Não deve conter** campo `password` nos objetos de usuário

### Teste 5: Verificar Supabase
1. Acesse Supabase Dashboard > **Table Editor**
2. Selecione `app_data`
3. Veja a coluna `data` (JSONB)
4. Procure por qualquer entrada com `lex_users`
5. **Não deve conter** senhas nos objetos de usuário

---

## Próximas Etapas

### Imediato (esta semana)
1. [ ] Executar `rls-setup.sql` no Supabase Dashboard
2. [ ] Testar login e criação de usuários
3. [ ] Verificar que senhas não estão mais armazenadas localmente
4. [ ] Registrar usuários hardcoded no Supabase Auth (executar: `node setup-supabase.js --register-users`)

### Curto prazo (próximas 2 semanas)
- [ ] Adicionar 2FA (Two-Factor Authentication) no Supabase Auth
- [ ] Implementar "Esqueci a senha" com email
- [ ] Criar política de expiração de sessão (logout automático)

### Médio prazo (próximo mês)
- [ ] Audit logs de quem fez o quê e quando
- [ ] Encriptação de dados sensíveis em trânsito (HTTPS ✅)
- [ ] Backup automático do Supabase

---

## Contatos e Documentação

- **Supabase Dashboard:** https://app.supabase.com/project/vg-ia-21314
- **Documentação Supabase Auth:** https://supabase.com/docs/guides/auth
- **RLS Documentation:** https://supabase.com/docs/guides/auth/row-level-security

---

## Notas Importantes

⚠️ **AVISO:** As senhas dos usuários antigos (admin123, gleydson123, etc.) estão no git. Recomenda-se:
1. Mudar todas as senhas na próxima oportunidade
2. Regenerar a anon key se houver suspeita de vazamento

✅ **BOAS NOTÍCIAS:** O app agora está protegido por Supabase Auth, que é criptograficamente seguro!

---

Última atualização: 2026-04-01
