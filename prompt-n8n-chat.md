# 🤖 Prompt para n8n Chat Gerar o Workflow

## Copie e Cole isso no Chat do n8n:

```
Crie um workflow completo com estes nós:

Nome do Workflow: "Email Notificação - Nova Tarefa"

1. WEBHOOK (trigger)
   - Nome: "Webhook"
   - Method: POST
   - Recebe dados: {titulo, descricao, responsavel, destinatario_email, data_vencimento, prioridade, link_tarefa}

2. EMAIL (Enviar)
   - Nome: "Enviar Email"
   - Para: {{$node.Webhook.json.destinatario_email}}
   - Assunto: "📌 Nova Tarefa: {{$node.Webhook.json.titulo}}"
   - Tipo: HTML
   - Corpo HTML formatado com:
     * Título da tarefa
     * Descrição
     * Responsável
     * Data de vencimento
     * Prioridade
     * Link da tarefa
     * Design profissional com cores: fundo #0B0B0C, cards #1A1A1D, accent #F59E0B

3. CONEXÕES:
   - Webhook → Email (fluxo linear)

Ativa o workflow após criar.
```

---

## 📋 Passo a Passo para Usar:

### 1️⃣ Clique no Chat
Na tela do n8n, procure por **"Chat"** (lado esquerdo)

### 2️⃣ Cole o Prompt
Copie o texto acima e cole no chat do n8n

### 3️⃣ Deixe o AI Criar
O n8n vai gerar o workflow para você automaticamente

### 4️⃣ Revise e Ative
- Clique em "Create" ou "Generate"
- Revise os nós
- Clique em "Publish" e depois "Activate"

---

## ✅ Pronto!

Seu workflow vai:
✅ Receber dados de uma tarefa (via webhook)
✅ Enviar email formatado automaticamente
✅ Estar pronto para usar

**Próximo passo:** Integrar com seu sistema JUS IA para chamar o webhook quando criar uma tarefa!
