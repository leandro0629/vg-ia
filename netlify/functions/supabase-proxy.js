exports.handler = async (event) => {
  console.log('[proxy] Requisição recebida:', event.httpMethod, event.body?.substring(0, 50));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  try {
    if (!event.body) {
      throw new Error('Body vazio');
    }

    const { key, data } = JSON.parse(event.body);
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    console.log('[proxy] Salvando:', key);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ key, data, updated_at: new Date().toISOString() })
    });

    console.log('[proxy] Resposta:', response.status);
    return {
      statusCode: response.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: response.ok })
    };
  } catch(e) {
    console.error('[proxy] Erro:', e.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
