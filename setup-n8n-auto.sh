#!/bin/bash

# Script para configurar credenciais no n8n automaticamente
# Use: bash setup-n8n-auto.sh

N8N_URL="http://localhost:5678"
WORKFLOW_ID="1"  # Ajuste se necessário

# Credenciais Supabase
SUPABASE_URL="https://eelhcdhefkkjvfirmwmi.supabase.co"
SUPABASE_KEY="sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82"

echo "🔧 Configurando credenciais Supabase no n8n..."

# Criar credencial Supabase
curl -X POST "$N8N_URL/api/v1/credentials" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Supabase\",
    \"type\": \"supabase\",
    \"data\": {
      \"url\": \"$SUPABASE_URL\",
      \"key\": \"$SUPABASE_KEY\"
    }
  }"

echo "✅ Supabase configurado!"
echo "📌 Agora no n8n:"
echo "  1. Clique em cada nó Insert/Notif"
echo "  2. Credentials → Select 'Supabase'"
echo "  3. Test Workflow"
echo "  4. Activate"
