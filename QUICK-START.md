# 🚀 Quick Start - Kausas Pronto para Usar

**Status:** ✅ TUDO IMPLEMENTADO E PRONTO  
**Data:** 2026-04-08

---

## 📝 Resumo do Que Foi Feito

### 1️⃣ **RLS + Supabase Auth** ✅
- Row Level Security com isolamento por `office_id`
- 8 tabelas novas no Supabase (profiles, tasks, members, etc)
- Autenticação via Supabase Auth (senhas com Bcrypt)
- Session timeout 2h
- Realtime sync (<2 segundos)

### 2️⃣ **n8n Workflows** ✅
- Workflow automático para scraping de diários (TCM/TCE)
- Corre diariamente às 8h da manhã
- Análise com Claude AI
- Notificação por email + app

### 3️⃣ **User Management** ✅
- Script Python para criar 14 usuários automaticamente
- Senhas temporárias geradas
- Perfis criados no banco

---

## 🎯 3 Passos Para Começar

### PASSO 1: RLS Setup (5 minutos)

```bash
# Supabase Dashboard → SQL Editor → New Query
# Cole TODO o arquivo: setup-rls-kausas.sql
# (Este arquivo já foi criado para você)
```

✅ **Resultado:** 8 tabelas + RLS policies criadas

### PASSO 2: Criar Usuários (2 minutos)

```bash
# Terminal/CMD na pasta do projeto:
python3 criar-usuarios-automatico.py

# Quando pedir SERVICE_ROLE_KEY:
# Vá em: Supabase Dashboard → Settings → API → service_role
# Copie e cole a chave
```

✅ **Resultado:** Todos os 14 usuários criados + `usuarios-criados.json` com senhas

### PASSO 3: Compartilhar Senhas

```bash
# Abra: usuarios-criados.json
# Compartilhe com cada usuário:
# Email + Senha temporária
# 
# Ao fazer login pela 1ª vez:
# https://vg-ia.vercel.app
# Sistema força trocar de senha
```

✅ **Pronto!** App em produção com RLS

---

## 🤖 n8n Automation (Opcional - mas recomendado)

Se quiser automação de diários:

### Setup (10 minutos)

1. **Obter Chave Claude/Anthropic**
   - Vá em: https://console.anthropic.com
   - API Keys → Create Key
   - Copie: `sk-ant-...`

2. **n8n - Importar Workflow**
   - Dashboard → Import
   - Cole: conteúdo de `workflow-unico-diarios-email.json`

3. **Configurar Credenciais**
   ```
   Settings → Variables → Add:
   - SUPABASE_URL = https://eelhcdhefkkjvfirmwmi.supabase.co
   - SUPABASE_KEY = sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82
   - ANTHROPIC_API_KEY = sk-ant-XXXXX (sua chave)
   
   Para cada nó:
   - Supabase: Credentials → Create New
   - Gmail: Credentials → Connect
   - Claude: Credentials → Create New (OpenAI type)
   ```

4. **Ativar**
   ```
   Test Workflow (Ctrl+Enter)
   Se tudo OK → Activate
   ```

✅ **Pronto!** Scraping automático todos os dias às 8h

---

## 📚 Documentos Importantes

| Documento | Quando Usar |
|-----------|-----------|
| **IMPLEMENTACAO-COMPLETA.md** | Entender tudo que foi feito (técnico) |
| **INSTRUCOES-IMPLEMENTACAO-RLS.md** | Passo-a-passo RLS (se não conseguir) |
| **SETUP-WORKFLOW-UNICO.md** | Configurar n8n workflow |
| **README-SETUP-DIARIOS.md** | Entender como funciona automação |

---

## ✅ Checklist Final

- [ ] RLS SQL executado (Supabase)
- [ ] Script Python rodou (usuarios-criados.json gerado)
- [ ] Senhas compartilhadas com usuários
- [ ] Usuários conseguem fazer login em https://vg-ia.vercel.app
- [ ] App recarrega e mostra dados
- [ ] **(Opcional)** n8n workflow importado e ativo

---

## 🔧 Comandos Úteis

### Verificar RLS (no console Supabase)
```sql
SELECT COUNT(*) FROM public.profiles;
SELECT * FROM public.members LIMIT 5;
```

### Verificar Migração (console navegador)
```javascript
window.migrarDados()
```

### Criar usuário manual (se script falhar)
```sql
-- Supabase SQL Editor
INSERT INTO public.profiles (id, office_id, name, role, member_id)
VALUES (
  'UUID_DO_USER_CRIADO_NO_AUTH',
  '00000000-0000-0000-0000-000000000001',
  'Nome do Usuário',
  'role',
  id_numero
);
```

---

## 🆘 Problemas?

| Problema | Solução |
|----------|---------|
| "RLS Policy Violation" | Profile não criado. Verifique SQL executado |
| Login não funciona | Usuário não existe no Supabase Auth |
| Dados não aparecem | Verificar office_id nas tabelas |
| n8n workflow falha | Verificar credenciais + API key Claude |

---

## 🎉 Próximas Melhorias (Futuro)

- [ ] Dashboard visual dos diários
- [ ] Integração OCR para ler PDF
- [ ] 2FA (autenticação de dois fatores)
- [ ] API pública para integrar com outros sistemas

---

**Tudo pronto para usar!** 🚀

Qualquer dúvida, consulte a documentação ou execute o setup passo-a-passo.

---

_Criado: 2026-04-08_  
_Versão: 1.0_  
_Status: ✅ PRONTO PARA PRODUÇÃO_
