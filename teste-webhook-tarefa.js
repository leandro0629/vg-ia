#!/usr/bin/env node

/**
 * 🚀 Script para Testar Webhook do n8n
 *
 * Como usar:
 * 1. Substitua "SEU_WEBHOOK_URL" pela URL do seu webhook do n8n
 * 2. Configure seu email no n8n ANTES de rodar este script
 * 3. Execute: node teste-webhook-tarefa.js
 */

const https = require('https');
const http = require('http');

// ⚙️ CONFIGURAÇÃO
const WEBHOOK_URL = 'https://seu-n8n.com/webhook/email-notificacao-nova-tarefa';
const SEU_EMAIL = 'seu-email@example.com';

// 📋 DADOS DE TESTE
const dadosTarefa = {
  titulo: "📌 Tarefa de Teste do Webhook",
  descricao: "Esta é uma tarefa de teste para validar a integração n8n + JUS IA",
  responsavel: "Seu Nome",
  destinatario_email: SEU_EMAIL,
  data_vencimento: "2026-04-15",
  prioridade: "Alta",
  link_tarefa: "https://seu-app.com/tarefas/123"
};

console.log('🚀 Enviando dados de teste para o webhook...\n');
console.log('📋 Dados:');
console.log(JSON.stringify(dadosTarefa, null, 2));
console.log('\n⏳ Aguardando resposta...\n');

// Função para fazer POST
function enviarWebhook(url, dados) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocolo = urlObj.protocol === 'https:' ? https : http;

    const opcoes = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(dados))
      }
    };

    const requisicao = protocolo.request(url, opcoes, (resposta) => {
      let corpo = '';

      resposta.on('data', (chunk) => {
        corpo += chunk;
      });

      resposta.on('end', () => {
        resolve({
          status: resposta.statusCode,
          headers: resposta.headers,
          corpo: corpo
        });
      });
    });

    requisicao.on('error', (erro) => {
      reject(erro);
    });

    requisicao.write(JSON.stringify(dados));
    requisicao.end();
  });
}

// Executar teste
(async () => {
  try {
    const resposta = await enviarWebhook(WEBHOOK_URL, dadosTarefa);

    console.log('✅ SUCESSO!');
    console.log(`📊 Status: ${resposta.status}`);
    console.log(`📧 Resposta: ${resposta.corpo || 'OK'}\n`);

    console.log('✨ O que fazer agora:\n');
    console.log('1️⃣  Verifique seu email em: ' + SEU_EMAIL);
    console.log('2️⃣  Se recebeu o email, ótimo! O webhook funciona!');
    console.log('3️⃣  Se não recebeu:');
    console.log('   - Verifique se o nó "Enviar Email" está configurado');
    console.log('   - Clique no nó, vá em "Authentication" e escolha Gmail/Outlook');
    console.log('   - Clique em "Activate" no workflow\n');

  } catch (erro) {
    console.error('❌ ERRO ao enviar webhook:');
    console.error(`   ${erro.message}\n`);
    console.error('💡 Verifique:\n');
    console.error('1. A URL do webhook está correta?');
    console.error('2. O workflow está ativo (Activate button)?');
    console.error('3. Existe um nó Webhook no workflow?\n');
  }
})();

/**
 * 📝 INTEGRAÇÃO COM JUS IA
 *
 * Quando uma tarefa for criada no seu sistema, use este código:
 *
 * const dadosTarefa = {
 *   titulo: "Preparar documentação",
 *   descricao: "Documentar novo módulo",
 *   responsavel: "João Silva",
 *   destinatario_email: "joao@email.com",
 *   data_vencimento: "2026-04-15",
 *   prioridade: "Alta",
 *   link_tarefa: "https://seu-app.com/tarefas/123"
 * };
 *
 * fetch('https://seu-n8n.com/webhook/email-notificacao-nova-tarefa', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(dadosTarefa)
 * });
 */
