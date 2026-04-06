// 🎨 VIBE CODING - n8n + Claude Automation
// Super simples e direto, sem complicação

const Anthropic = require("@anthropic-ai/sdk");

async function claudeVibe(input, prompt) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nDados para processar:\n${JSON.stringify(input)}`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : null;
}

// ============================================
// EXEMPLO 1: Gerar resposta para cliente
// ============================================
async function gerarRespostaCliente() {
  const dadosCliente = {
    nome: "João Silva",
    problema: "Meu pedido não chegou",
    numPedido: "12345",
  };

  const resultado = await claudeVibe(
    dadosCliente,
    `Você é um atendente de suporte amigável.
     Responda ao cliente de forma empática e ofereça soluções.
     Seja breve e direto.`
  );

  console.log("RESPOSTA:", resultado);
  return resultado;
}

// ============================================
// EXEMPLO 2: Classificar sentimento
// ============================================
async function classificarSentimento() {
  const textos = [
    "Adorei seu produto, melhor que esperava!",
    "Que decepção, não funciona",
    "Produto ok, nada de especial",
  ];

  const resultado = await claudeVibe(
    textos,
    `Classifique o sentimento de cada texto em: POSITIVO, NEGATIVO ou NEUTRO.
     Retorne um JSON com a classificação.`
  );

  console.log("SENTIMENTOS:", resultado);
  return resultado;
}

// ============================================
// EXEMPLO 3: Extrair informações
// ============================================
async function extrairInfo() {
  const texto = `
    Olá, meu nome é Maria Silva, meu email é maria@email.com
    e meu telefone é (11) 98765-4321. Preciso resolver um problema
    com meu contrato número 2024-001.
  `;

  const resultado = await claudeVibe(
    { texto },
    `Extraia as seguintes informações: nome, email, telefone, número do contrato.
     Retorne como JSON.`
  );

  console.log("DADOS EXTRAÍDOS:", resultado);
  return resultado;
}

// ============================================
// USAR NO N8N - COPIE ISSO PARA O NÓ CODE
// ============================================
/*
// No nó Code do n8n:
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: $secrets.ANTHROPIC_API_KEY, // Configure no n8n
});

const input = $input.first().json; // Dados da entrada
const meuPrompt = "Seu prompt aqui";

const message = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 2048,
  messages: [
    {
      role: "user",
      content: `${meuPrompt}\n\nDados:\n${JSON.stringify(input)}`,
    },
  ],
});

return [
  {
    json: {
      sucesso: true,
      resposta: message.content[0].text,
      timestamp: new Date(),
    },
  },
];
*/

// Executar testes
(async () => {
  console.log("🚀 Vibe Coding - n8n + Claude\n");
  // await gerarRespostaCliente();
  // await classificarSentimento();
  // await extrairInfo();
})();
