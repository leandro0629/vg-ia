# 🔄 Automação com Retry até 12h - Setup

## O Problema

O workflow anterior executa **uma vez por dia às 8h**. Se o diário não foi publicado ainda, ele não tenta de novo.

## A Solução

Criar **2 workflows sincronizados:**

### Workflow 1: **Principal** (começa às 8h)
```
8h → Scrape + Claude
  ↓
Encontrou novo?
  ├─ SIM → Baixa, sobe, notifica ✅
  └─ NÃO → Chama Webhook para Workflow 2
```

### Workflow 2: **Loop de Retry**
```
Recebe webhook do Workflow 1
  ↓
Enquanto (hora < 12h):
  ├─ Espera 30min
  ├─ Scrape + Claude
  ├─ Encontrou?
  │  ├─ SIM → Baixa, notifica, para ✅
  │  └─ NÃO → Volta pro loop
  └─ Se passou 12h → Para
```

---

## 📝 Como Implementar

### Opção A: Usar Workflow COM RETRY (Recomendado para simplicidade)

1. **Importe:** `workflow-diarios-com-retry.json`
2. Segue os mesmos 3 passos de antes
3. Workflow agora:
   - ⏰ Começa às 8h
   - 🔄 Se não encontrar → Log "Próxima tentativa em 30min"
   - ⏰ Tenta de novo em 30min (você programa com um 2º workflow)
   - ⏰ Para às 12h

### Opção B: Usar Webhook + Loop (Mais complexo, mais confiável)

```javascript
// Usar webhook trigger no Workflow 2
// Que fica em loop até 12h
```

---

## 🎯 Recomendação

### Use a Opção A (Retry) com ajuste:

1. Importe: `workflow-diarios-com-retry.json`
2. Crie um **segundo workflow cron** que roda a cada 30min (de 8h a 12h)
3. Quando encontra um novo → Para automaticamente

**Workflow 2 (Simples):**
```
Cron: 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30, 12:00
  ↓
Scrape + Claude
  ↓
Encontrou novo?
  ├─ SIM → Download + Upload + Notifica
  └─ NÃO → Apenas registra tentativa
```

---

## 📋 Ou Vou Deixar Mais Simples?

Você quer que eu crie:

- [ ] **2 workflows separados** (Principal + Retry a cada 30min até 12h)
- [ ] **1 workflow com Webhook** (mais complexo mas melhor)
- [ ] **Usar n8n native loop** (se sua versão suporta)

Qual você prefere? 🤔
