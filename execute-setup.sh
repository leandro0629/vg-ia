#!/bin/bash

# Credenciais Supabase
SUPABASE_URL="https://eelhcdhefkkjvfirmwmi.supabase.co"
SUPABASE_KEY="sb_publishable_B7xpIdYY5GdpLmnDl9FEow_1324FX82"
SQL_FILE="/c/Users/leand/Desktop/JUS IA/setup-supabase-diarios.sql"

# Ler arquivo SQL
SQL_CONTENT=$(cat "$SQL_FILE")

# Executar via API do Supabase
curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$SQL_CONTENT\"}" \
  | jq .

echo "✅ SQL executado!"
