# 🤖 Automação n8n com Claude - Guia de Colaboração

## Objetivo Principal
Criar **workflows de automação no n8n** usando Claude para:
- Gerar código e configurações JSON
- Escrever prompts efetivos para processar dados
- Estruturar pipelines de automação complexos
- Implementar integrações com APIs

## Como Trabalhar Comigo

### 1. Descrever o Workflow
Descreva o que precisa de forma clara:
```
Quero um workflow que:
- Receba dados via [entrada: webhook/email/database]
- Processe com Claude [o que fazer]
- Envie resultado para [saída: email/Slack/database]
```

### 2. Eu Vou Gerar
- ✅ Prompt otimizado para Claude
- ✅ JSON do workflow n8n pronto para importar
- ✅ Configurações de nós
- ✅ Variáveis de ambiente necessárias

### 3. Você Implementa
- Copie o JSON gerado
- Importe no n8n: Dashboard → Import
- Configure credenciais
- Ative e teste

## Padrões de Workflow

### Padrão 1: Webhook → Claude → Resposta
```
Webhook recebe dados
    ↓
Code (Claude processa)
    ↓
Retorna resposta JSON
```

### Padrão 2: Trigger → Claude → Multiplas Saídas
```
Evento (webhook/email/cron)
    ↓
Claude processa
    ↓
Email + Slack + Database
```

### Padrão 3: Batch Processing
```
Ler dados (database/arquivo)
    ↓
Loop com Claude
    ↓
Salvar resultados
```

## Ferramentas e Recursos

### MCP Server n8n
- **URL:** https://github.com/czlonkowski/n8n-mcp
- **Uso:** Integração avançada com n8n via Model Context Protocol
- **Quando usar:** Para workflows complexos que precisam de sondagem/status do n8n

### n8n Skills
- **URL:** https://github.com/czlonkowski/n8n-skills
- **Uso:** Skills pré-construídas para Claude usar direto com n8n
- **Benefício:** Maior qualidade e consistência nos workflows gerados

### Claude API
- **Model:** claude-opus-4-6 (padrão)
- **Alternativas:** claude-sonnet-4-6 (mais rápido), claude-haiku-4-5 (mais barato)
- **Max tokens:** 2048+ (ajustar conforme necessário)

## Exemplos de Prompts que Funcionam Bem

### ✅ Bom
```
Crie um workflow que receba um webhook com um texto
e use Claude para resumir em 2 linhas
```

### ✅ Melhor
```
Workflow "Resumidor Automático":
- Entrada: webhook (POST) com {texto, idioma}
- Processamento: Claude → "Resuma em 2-3 linhas no {{idioma}}"
- Saída: Retorna {resumo, tokens_usados}
- Model: claude-opus-4-6, max_tokens: 512
```

### ✅ Ótimo
```
Nome: "Resumidor Inteligente"
Trigger: webhook POST
Body esperado: {
  "texto": string (obrigatório),
  "idioma": string (default: português),
  "linhas": number (default: 2)
}
Claude:
- Prompt: "Resuma este texto em {{linhas}} linhas. Idioma: {{idioma}}"
- Model: claude-opus-4-6
- Max tokens: 512
Output: {
  "resumo": string,
  "idioma_processado": string,
  "timestamp": ISO8601
}
Salve em: database/arquivo JSON
```

## Processo de Desenvolvimento

### Fase 1: Ideação
```
Descreva seu workflow em linguagem natural
```

### Fase 2: Refinamento
```
Claude gera o JSON do workflow
Você review e sugere mudanças
```

### Fase 3: Implementação
```
Importe no n8n
Configure credenciais
Teste com dados reais
```

### Fase 4: Otimização
```
Ajuste prompts se necessário
Refine o fluxo
Deploy em produção
```

## Variáveis de Ambiente Necessárias

Para workflows com Claude, você precisará:
```
ANTHROPIC_API_KEY=sk-ant-... (obrigatório)
CLAUDE_MODEL=claude-opus-4-6 (opcional)
CLAUDE_MAX_TOKENS=2048 (opcional)
```

Adicione no n8n:
Settings → Variables → Nova variável

## Vibe Coding Rules

1. **Comece simples** - Workflow básico funcionando
2. **Itere rápido** - Teste, ajuste, melhore
3. **Use Claude para criar** - Não escreva JSON na mão
4. **Documente o prompt** - Salve o prompt que funciona
5. **Reutilize** - Patterns que funcionam podem ser copiados

## Quando Me Chamar

✅ "Crie um workflow que..."
✅ "Gere o JSON para..."
✅ "Escreva um prompt que..."
✅ "Como fazer [...] no n8n?"
✅ "Refine este workflow..."

❌ Não: Executar workflow (isso é n8n)
❌ Não: Debugar erro na infraestrutura
❌ Não: Gerenciar instância n8n

## Estrutura de Resposta que Você Vai Receber

Quando pedir um workflow, você recebe:

```
## [Nome do Workflow]

### Descrição
[O que faz]

### Fluxo
[Diagram ASCII do fluxo]

### JSON Pronto para Importar
[Copie e cole no n8n]

### Configuração Necessária
[Variáveis, credenciais, etc]

### Exemplo de Teste
[Como testar]
```

## Atalhos Úteis

Para ser mais rápido, use:
- "Gere workflow: [descrição curta]"
- "Refine: [descrição]"
- "JSON para: [descrição]"
- "Prompt para Claude que: [o que fazer]"

## Links Importantes

### n8n
- **n8n Docs:** https://docs.n8n.io
- **n8n API Docs:** https://docs.n8n.io/api/
- **n8n REST API:** https://docs.n8n.io/api/n8n-rest-api/
- **n8n Webhooks:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **n8n MCP:** https://github.com/czlonkowski/n8n-mcp
- **n8n Skills:** https://github.com/czlonkowski/n8n-skills

### Claude
- **Claude API:** https://console.anthropic.com
- **Claude Docs:** https://docs.anthropic.com
- **SDK JavaScript:** https://github.com/anthropics/anthropic-sdk-typescript
- **SDK Python:** https://github.com/anthropics/anthropic-sdk-python

---

**Status:** Pronto para criar workflows! 🚀
**Última atualização:** 2026-04-03
**Versão:** 1.0
