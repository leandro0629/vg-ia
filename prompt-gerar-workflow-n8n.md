# 🤖 Prompt para Claude Gerar Workflows n8n

## Versão 1: Prompt Simples (Copie e Cole)

```
Você é um especialista em n8n. Gere um workflow JSON completo para n8n que:

[DESCREVA SEU WORKFLOW AQUI]

Requisitos:
- Use nós reais do n8n
- Inclua todas as configurações necessárias
- Retorne APENAS o JSON válido, sem explicações
- O JSON deve ser importável direto no n8n

Exemplo de estrutura esperada:
{
  "name": "Nome do Workflow",
  "nodes": [...],
  "connections": {...},
  "active": true
}
```

## Versão 2: Prompt Detalhado (Melhor Resultado)

```
Você é um expert em automações n8n. Crie um workflow JSON completo.

OBJETIVO:
[Descreva o que o workflow vai fazer]

ENTRADA:
[De onde vêm os dados? Webhook? API? Database?]

PROCESSAMENTO:
[O que precisa fazer com os dados?]

SAÍDA:
[Para onde vão os resultados? Email? Database? API?]

INTEGRAÇÕES NECESSÁRIAS:
[Quais APIs/serviços usar?]

Requisitos técnicos:
- Workflow name: [seu nome]
- Nós: [liste os nós que quer usar]
- Variáveis de ambiente: [se precisar]

IMPORTANTE: Retorne APENAS JSON válido, pronto para importar no n8n.
Não inclua markdown, não explique. Só o JSON.
```

## Versão 3: Exemplos Prontos

### Exemplo 1: Webhook → Claude → Email
```
Crie um workflow n8n que:
1. Receba dados via webhook
2. Envie para Claude processar com o prompt: "Resuma este texto em 2 linhas"
3. Envie resultado por email

Dados de entrada: {"texto": "conteúdo"}
Email para: admin@example.com
```

### Exemplo 2: Database → Claude → Slack
```
Crie um workflow que:
1. Leia dados de uma tabela (usuarios_feedback)
2. Processe cada linha com Claude: "Classifique o sentimento: positivo, negativo ou neutro"
3. Envie relatório para um canal Slack

Tabela: usuarios_feedback
Coluna de texto: feedback_texto
Slack webhook: [seu_webhook]
```

### Exemplo 3: Formulário → Claude → CRM
```
Crie um workflow que:
1. Receba submissão de formulário (nome, email, mensagem)
2. Use Claude para gerar resposta automática personalizada
3. Salve no Airtable ou similar

Campos do formulário: nome, email, assunto, mensagem
Integração CRM: Airtable
```

## Como Usar:

### Passo 1: Escreva seu workflow
```
Quero um workflow que:
- Receba uma mensagem via webhook
- Envie para Claude gerar uma resposta
- Salve a resposta num arquivo JSON
```

### Passo 2: Mande para Claude
Copie um dos prompts acima e adapte

### Passo 3: Importe no n8n
1. Dashboard n8n → Workflows
2. Clique em "Import"
3. Cole o JSON que Claude gerou
4. Configure suas credenciais
5. Ative o workflow

## Dicas de Vibe Coding:

✅ **Prompt bom:**
```
Crie workflow que webhook → Claude processa → email resultado
```

✅ **Prompt melhor:**
```
Workflow: 
- Input: webhook recebe JSON com {texto, email}
- Process: Claude com prompt "Corrija este texto"
- Output: envia resposta para email do usuário
```

✅ **Prompt ótimo:**
```
Nome: "Auto-Corretor de Textos"
Entrada: webhook (POST) com body {texto, email, idioma}
Processamento: Claude (model: claude-opus-4-6, max_tokens: 1024)
- Prompt: "Corrija erros de {{idioma}} e melhore este texto"
Saída: envie email para {{email}} com resultado
Credenciais: ANTHROPIC_API_KEY, seu email provider
```

## Estrutura Mínima de um Node no n8n:

```json
{
  "name": "node_name",
  "type": "n8n-nodes-base.nodeType",
  "typeVersion": 1,
  "position": [x, y],
  "parameters": {
    "setting1": "value",
    "setting2": "value"
  }
}
```

## Nós Mais Usados:

- `webhook` - Receber dados
- `httpRequest` - Chamar APIs (Claude)
- `code` - Executar JavaScript
- `email` - Enviar emails
- `airtable` - Integração com Airtable
- `slack` - Enviar mensagens Slack
- `set` - Definir variáveis
- `merge` - Combinar dados
- `filter` - Filtrar dados
