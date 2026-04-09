# 🎨 Guia Oficial da Logo Kausas

**Versão:** 1.0  
**Data:** 2026-04-09  
**Status:** ✅ Pronto para Produção

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Conceito e Inspiração](#conceito-e-inspiração)
3. [Especificações Técnicas](#especificações-técnicas)
4. [Variações de Design](#variações-de-design)
5. [Use Cases](#use-cases)
6. [Guia de Implementação](#guia-de-implementação)
7. [Boas Práticas](#boas-práticas)
8. [FAQ](#faq)

---

## 📌 Visão Geral

A logo **Kausas** é um sistema modular de identidade visual baseado em **3 barras verticais em ouro**, representando:
- **Força jurídica** (barras estruturantes)
- **Profissionalismo** (design clean e moderno)
- **Inovação** (paleta de cores contemporânea)

**Símbolo:** 3 barras verticais + Texto "Kausas"

---

## 🎯 Conceito e Inspiração

### Filosofia de Design

A logo Kausas segue princípios de:
- **Minimalismo:** Apenas 3 elementos visuais
- **Modularidade:** Funciona em qualquer tamanho
- **Versatilidade:** 15 variações para diferentes contextos
- **Profissionalismo:** Adequado para ambiente corporativo/jurídico

### Paleta de Cores

| Elemento | Cor | Código | Uso |
|----------|-----|--------|-----|
| **Barras** | Ouro Premium | `#FBBF24` | Principal |
| **Fundo** | Preto Profundo | `#0A0E27` | Recomendado |
| **Fundo Alt** | Branco | `#FFFFFF` | Alternativo |

### Tipografia

- **Fonte:** Sora (Google Fonts)
- **Peso:** 700 (Bold)
- **Estilo:** Normal (sem itálicos)
- **Caso:** Maiúscula "K" + minúsculas "ausas"

---

## 🔧 Especificações Técnicas

### Dimensões Recomendadas

| Contexto | Largura | Altura | Propósito |
|----------|---------|--------|-----------|
| **Favicon** | 32-64px | 32-64px | Aba do navegador |
| **Navbar/Sidebar** | 40-80px | 40-80px | Cabeçalho da app |
| **Card/Button** | 60-120px | 60-120px | Componentes |
| **Landing Page** | 200-400px | 200-400px | Hero section |
| **Prints** | 300px+ | 300px+ | Documentação/Relatórios |

### Espaçamento (Clearance)

Deixar **mínimo 20% da altura da logo** de espaço em volta:

```
┌─────────────────────┐
│   [20% clearance]   │
│  ┌───────────────┐  │
│  │   [LOGO]      │  │
│  │   Kausas      │  │
│  └───────────────┘  │
│   [20% clearance]   │
└─────────────────────┘
```

### Versão em SVG (Favicon)

```html
<link rel="icon" type="image/svg+xml" 
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' 
      viewBox='0 0 64 64'>
        <rect x='6' y='6' width='12' height='52' fill='%23fbbf24' rx='2'/>
        <rect x='26' y='6' width='12' height='52' fill='%23fbbf24' rx='2'/>
        <rect x='46' y='6' width='12' height='52' fill='%23fbbf24' rx='2'/>
      </svg>">
```

---

## 🎨 Variações de Design

### Recomendadas ⭐

#### **V3 - Bars Solid Large** (PADRÃO)
- **Descrição:** Barras sólidas robustas
- **Uso:** Principal, mais versátil
- **Proporção:** 8px largura, 36px altura, gap 6px
- **Impacto:** Alto ⭐⭐⭐⭐⭐

```
███  ███  ███
███  ███  ███
███  ███  ███
```

#### **V10 - Bars Thick** (BOLD)
- **Descrição:** Barras muito grossas e impactantes
- **Uso:** Favicon, logos pequenas, destaque
- **Proporção:** 10px largura, 36px altura, gap 5px
- **Impacto:** Muito Alto ⭐⭐⭐⭐⭐

```
████ ████ ████
████ ████ ████
████ ████ ████
```

#### **V5 - Bars Outline Medium** (CLEAN)
- **Descrição:** Barras em outline, minimalista
- **Uso:** Versão light, backgrounds claros
- **Proporção:** 7px largura, 32px altura, gap 5px, border 2px
- **Impacto:** Médio ⭐⭐⭐⭐

```
░░░  ░░░  ░░░
░░░  ░░░  ░░░
░░░  ░░░  ░░░
```

#### **V15 - Bars Compact Thin** (SOFISTICADO)
- **Descrição:** Minimalista e elegante
- **Uso:** Branding premium, websites modernos
- **Proporção:** 6px largura, 32px altura, gap 3px
- **Impacto:** Médio-Baixo ⭐⭐⭐

```
██ ██ ██
██ ██ ██
██ ██ ██
```

### Todas as 15 Variações

| # | Nome | Estilo | Use Case |
|----|------|--------|----------|
| 1 | Bars Solid Thin | Fino | Minimalista |
| 2 | Bars Solid Medium | Médio | Equilibrado |
| 3 | Bars Solid Large | **Robusto** | **PADRÃO** |
| 4 | Bars Outline Thin | Fino outline | Clean |
| 5 | Bars Outline Medium | **Médio outline** | **POPULAR** |
| 6 | Bars Outline Large | Grande outline | Moderno |
| 7 | Bars Gradient | Gradiente | Dinâmico |
| 8 | Bars Rounded | Arredondado | Suave |
| 9 | Bars Pill | Muito arredondado | Amigável |
| 10 | Bars Thick | **Muito grosso** | **BOLD** |
| 11 | Bars with Shadow | Com sombra | Profundo |
| 12 | Bars Staggered | Escalonado | Ritmado |
| 13 | Bars Animated | Compacto | Dinâmico |
| 14 | Bars Wide | Espaçado | Respirado |
| 15 | Bars Compact Thin | **Minimalista** | **SOFISTICADO** |

---

## 💼 Use Cases

### 1️⃣ **Favicon (Aba do Navegador)**

**Variação Recomendada:** V10 (Bars Thick)

```html
<link rel="icon" type="image/svg+xml" 
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' 
      viewBox='0 0 64 64'>
        <rect x='6' y='6' width='12' height='52' fill='%23fbbf24' rx='2'/>
        <rect x='26' y='6' width='12' height='52' fill='%23fbbf24' rx='2'/>
        <rect x='46' y='6' width='12' height='52' fill='%23fbbf24' rx='2'/>
      </svg>">
```

**Resultado:** Favicon grosso e impactante na aba

---

### 2️⃣ **Navbar/Sidebar**

**Variação Recomendada:** V3 (Bars Solid Large)

```html
<div style="display: flex; gap: 8px; align-items: center;">
  <div style="display: flex; gap: 4px;">
    <span style="width: 8px; height: 36px; background: #fbbf24; border-radius: 2px;"></span>
    <span style="width: 8px; height: 36px; background: #fbbf24; border-radius: 2px;"></span>
    <span style="width: 8px; height: 36px; background: #fbbf24; border-radius: 2px;"></span>
  </div>
  <span style="font-size: 1.1rem; font-weight: 700; color: #fbbf24;">Kausas</span>
</div>
```

**Resultado:** Logo + Texto na barra de navegação

---

### 3️⃣ **Landing Page / Hero**

**Variação Recomendada:** V3 ou V15 (depende do tom)

```html
<!-- Logo Grande + Texto -->
<div style="display: flex; gap: 24px; align-items: center; font-size: 4rem;">
  <div style="display: flex; gap: 8px;">
    <span style="width: 20px; height: 100px; background: #fbbf24; border-radius: 4px;"></span>
    <span style="width: 20px; height: 100px; background: #fbbf24; border-radius: 4px;"></span>
    <span style="width: 20px; height: 100px; background: #fbbf24; border-radius: 4px;"></span>
  </div>
  <span style="font-weight: 700; color: #fbbf24;">Kausas</span>
</div>
```

---

### 4️⃣ **Documento/Relatório**

**Variação Recomendada:** V3 (Bars Solid Large)

**Especificações:**
- Tamanho: 300x300px ou maior
- Fundo: Branco ou cores suaves
- Posição: Canto superior esquerdo ou centro

---

### 5️⃣ **Favicon + Nome Reduzido**

**Variação Recomendada:** V10 (Bars Thick) + "K"

```html
<div style="display: flex; gap: 4px; align-items: center;">
  <div style="display: flex; gap: 3px; font-size: 0.8rem;">
    <span style="width: 2px; height: 16px; background: #fbbf24;"></span>
    <span style="width: 2px; height: 16px; background: #fbbf24;"></span>
    <span style="width: 2px; height: 16px; background: #fbbf24;"></span>
  </div>
  <span style="font-size: 0.9rem; font-weight: 700; color: #fbbf24;">K</span>
</div>
```

---

## 📐 Guia de Implementação

### Opção 1: HTML + CSS Puro

```html
<div class="logo">
  <div class="logo-bars">
    <span></span>
    <span></span>
    <span></span>
  </div>
  <span class="logo-text">Kausas</span>
</div>

<style>
.logo {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo-bars {
  display: flex;
  gap: 6px;
}

.logo-bars span {
  width: 8px;
  height: 36px;
  background: #fbbf24;
  border-radius: 2px;
}

.logo-text {
  font-family: 'Sora', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fbbf24;
  letter-spacing: -0.5px;
}
</style>
```

### Opção 2: SVG Inline

```html
<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <!-- Barras -->
  <rect x="10" y="4" width="8" height="32" fill="#fbbf24" rx="2"/>
  <rect x="26" y="4" width="8" height="32" fill="#fbbf24" rx="2"/>
  <rect x="42" y="4" width="8" height="32" fill="#fbbf24" rx="2"/>
  
  <!-- Texto -->
  <text x="65" y="24" font-family="Sora" font-size="18" font-weight="700" 
        fill="#fbbf24">Kausas</text>
</svg>
```

### Opção 3: Imagem PNG/SVG

1. Exportar de `kausas-logo-bars.html`
2. Salvar como PNG (200-400px)
3. Usar em `<img src="logo-kausas.png">`

```html
<img src="/assets/logo-kausas.png" 
     alt="Kausas Logo" 
     width="120" 
     height="40">
```

---

## ✅ Boas Práticas

### ✓ Faça Assim:

- ✅ Use em fundos escuros preferencialmente
- ✅ Mantenha espaçamento de 20% em volta
- ✅ Use a cor ouro (#FBBF24) exatamente
- ✅ Escale proporcionalmente
- ✅ Use V3 ou V10 como padrão
- ✅ Deixe espaço branco/vazio em volta

### ✗ NÃO Faça:

- ❌ Distorcer ou modificar proporções
- ❌ Usar cores diferentes que não sejam a paleta oficial
- ❌ Adicionar efeitos (sombras excessivas, brilhos)
- ❌ Rotacionar ou inverter
- ❌ Usar em fundos muito claros sem contraste
- ❌ Reduzir demais (<16px para favicon)

---

## 📚 Arquivos Disponíveis

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `kausas-logo-bars.html` | HTML | 15 variações interativas |
| Favicon SVG | SVG | 64x64px (atual) |
| LOGO-KAUSAS.md | Markdown | Este documento |

---

## ❓ FAQ

### P: Qual variação devo usar?
**R:** 
- Favicon: V10 (Bars Thick)
- Navbar: V3 (Bars Solid Large)  
- Landing page: V3 ou V15 (depende do tom)
- Premium/Sofisticado: V15 (Bars Compact Thin)

### P: Posso mudar a cor do ouro?
**R:** Não recomendamos. A cor `#FBBF24` é parte da identidade. Se necessário, consulte a equipe de branding.

### P: Qual tamanho mínimo para a logo?
**R:** 
- Desktop: Mínimo 40x40px
- Mobile: Mínimo 32x32px
- Favicon: 16x16px no mínimo

### P: Posso usar a logo em fundos claros?
**R:** Sim, mas com contraste suficiente. Teste a legibilidade em diferentes fundos.

### P: Como exportar para PNG de alta qualidade?
**R:** Abra `kausas-logo-bars.html`, clique com botão direito > Salvar como > PNG

### P: Quais fontes usam o nome "Kausas"?
**R:** Sora (Google Fonts) - Weight 700, maiúsculas

### P: Posso adicionar efeitos de sombra?
**R:** Para web, mantenha simples. Para prints, máximo de sombra sutil (0 4px 8px rgba).

---

## 📞 Suporte

Para dúvidas sobre a logo:
- Consulte este documento (LOGO-KAUSAS.md)
- Verifique `kausas-logo-bars.html` para referência visual
- Código no `index.html` (linha de favicon)

---

**Última Atualização:** 2026-04-09  
**Versão:** 1.0  
**Status:** ✅ Aprovado para Produção
