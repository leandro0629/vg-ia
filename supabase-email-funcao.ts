// 📧 Supabase Edge Function para Enviar Emails
// Arquivo: supabase/functions/enviar-notificacao-missao/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface MissaoData {
  id: string
  titulo: string
  descricao?: string
  status?: string
  data_prazo?: string
  prioridade?: string
  responsavel?: string
  tipo_notificacao: "criada" | "status_mudou" | "prazo_3_dias" | "prazo_2_dias" | "prazo_1_dia"
}

async function enviarEmailResend(
  para: string,
  assunto: string,
  html: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "JUS IA <noreply@juscia.com>",
        to: para,
        subject: assunto,
        html: html,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return false
  }
}

function gerarHTMLEmail(missao: MissaoData): string {
  const titulo = {
    criada: "📌 Nova Missão Criada",
    status_mudou: "🔄 Status da Missão Alterado",
    prazo_3_dias: "⏰ Missão Vence em 3 Dias",
    prazo_2_dias: "⏰ Missão Vence em 2 Dias",
    prazo_1_dia: "🚨 Missão Vence Amanhã!",
  }

  const mensagem = {
    criada: "Uma nova missão foi criada para você",
    status_mudou: `O status da missão mudou para: <strong>${missao.status}</strong>`,
    prazo_3_dias: "Esta missão vence em 3 dias",
    prazo_2_dias: "Esta missão vence em 2 dias",
    prazo_1_dia: "Esta missão vence amanhã!",
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0B0B0C; color: #FFFFFF; }
    .container { max-width: 600px; margin: 0 auto; background: #1A1A1D; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px 20px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .content { padding: 30px 20px; }
    .message { font-size: 16px; margin-bottom: 20px; color: #A1A1AA; }
    .missao-box { background: #121214; border: 1px solid #2A2A2E; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .campo { margin: 12px 0; }
    .label { font-size: 12px; text-transform: uppercase; color: #A1A1AA; font-weight: 600; margin-bottom: 4px; }
    .valor { font-size: 15px; color: #FFFFFF; }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 4px;
    }
    .status-criada { background: rgba(76,175,125,0.2); color: #4caf7d; }
    .status-em-progresso { background: rgba(91,141,238,0.2); color: #5b8dee; }
    .status-urgente { background: rgba(224,92,92,0.2); color: #e05c5c; }
    .button { display: inline-block; background: #F59E0B; color: #0B0B0C; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { background: #0B0B0C; padding: 20px; text-align: center; font-size: 12px; color: #A1A1AA; border-top: 1px solid #2A2A2E; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${titulo[missao.tipo_notificacao]}</h1>
    </div>

    <div class="content">
      <p class="message">${mensagem[missao.tipo_notificacao]}</p>

      <div class="missao-box">
        <div class="campo">
          <div class="label">Título</div>
          <div class="valor">${missao.titulo}</div>
        </div>

        ${missao.descricao ? `
        <div class="campo">
          <div class="label">Descrição</div>
          <div class="valor">${missao.descricao}</div>
        </div>
        ` : ''}

        ${missao.responsavel ? `
        <div class="campo">
          <div class="label">Responsável</div>
          <div class="valor">${missao.responsavel}</div>
        </div>
        ` : ''}

        ${missao.data_prazo ? `
        <div class="campo">
          <div class="label">Data de Vencimento</div>
          <div class="valor">${new Date(missao.data_prazo).toLocaleDateString('pt-BR')}</div>
        </div>
        ` : ''}

        ${missao.prioridade ? `
        <div class="campo">
          <div class="label">Prioridade</div>
          <span class="status-badge status-${missao.prioridade.toLowerCase()}">${missao.prioridade}</span>
        </div>
        ` : ''}

        ${missao.status ? `
        <div class="campo">
          <div class="label">Status</div>
          <span class="status-badge status-${missao.status.toLowerCase()}">${missao.status}</span>
        </div>
        ` : ''}
      </div>

      <a href="https://seu-app.com" class="button">Ir para a Missão</a>
    </div>

    <div class="footer">
      <p>Esta é uma notificação automática do Sistema JUS IA</p>
      <p style="margin-top: 8px;">Não responda este email</p>
    </div>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  try {
    // Receber dados da missão
    const dadosMissao: MissaoData = await req.json()

    // Enviar email
    const html = gerarHTMLEmail(dadosMissao)
    const sucesso = await enviarEmailResend(
      "leandrosmg0629@gmail.com",
      `[JUS IA] ${dadosMissao.titulo}`,
      html
    )

    // Registrar no Supabase
    if (sucesso) {
      await supabase.from("notificacoes_enviadas").insert({
        missao_id: dadosMissao.id,
        tipo: dadosMissao.tipo_notificacao,
        email_para: "leandrosmg0629@gmail.com",
        enviado_em: new Date().toISOString(),
      })
    }

    return new Response(
      JSON.stringify({
        sucesso: sucesso,
        mensagem: sucesso ? "Email enviado com sucesso" : "Erro ao enviar email",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: sucesso ? 200 : 500,
      }
    )
  } catch (error) {
    console.error("Erro:", error)
    return new Response(
      JSON.stringify({ erro: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
