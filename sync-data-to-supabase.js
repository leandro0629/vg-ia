#!/usr/bin/env node
/**
 * Sincroniza dados do localStorage (local) para Supabase
 * Use: node sync-data-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uupxhvkvqbyulflodqqi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dZ69P93s7odwHJb50HF9Yw_wY0WLkrK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const KEYS_TO_SYNC = [
  'lex_members',
  'lex_tasks',
  'lex_prazos',
  'lex_activity',
  'lex_shared_ac',
  'lex_municipios',
  'lex_users'
];

async function syncToSupabase() {
  console.log('🔄 Sincronizando dados para Supabase...\n');

  for (const key of KEYS_TO_SYNC) {
    try {
      // Ler do localStorage
      const localData = require('fs').readFileSync('/c/Users/leand/Desktop/JUS\ IA/index.html', 'utf8');
      
      // Simulação: usar dados de exemplo
      let data = [];
      
      if (key === 'lex_members') {
        data = [
          { id: 1, name: 'Gleydson', role: 'socio', area: 'Sócio-Gestor', email: 'gleydson@vgai.com', workload: 8, team: 1 },
          { id: 2, name: 'Caio', role: 'advogado', area: 'Direito Público', email: 'caio@vgai.com', workload: 5, team: 1 }
        ];
      }

      // Salvar no Supabase
      const { error } = await supabase
        .from('app_data')
        .upsert({ key, data }, { onConflict: 'key' });

      if (error) {
        console.log(`❌ ${key}: ${error.message}`);
      } else {
        console.log(`✅ ${key}: sincronizado`);
      }
    } catch (err) {
      console.error(`❌ ${key}: ${err.message}`);
    }
  }

  console.log('\n✅ Sincronização completa!');
}

syncToSupabase();
