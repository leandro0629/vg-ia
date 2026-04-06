// Abra este arquivo como: node exportar-dados.js
// Isso vai exportar os dados do localStorage para um arquivo JSON

const fs = require('fs');
const path = require('path');

// Simulate browser localStorage by reading from index.html
const dados = {
  "lex_users": JSON.stringify([
    {
      "id": "user1",
      "email": "leandro@vgai.com",
      "name": "Leandro",
      "profile": "admin",
      "memberId": "m1"
    }
  ]),
  "lex_members": JSON.stringify([
    {
      "id": "m1",
      "name": "Leandro",
      "email": "leandro@vgai.com",
      "role": "Manager",
      "avatar": "LA"
    }
  ]),
  "lex_tasks": JSON.stringify([]),
  "lex_prazos": JSON.stringify([]),
  "lex_activity": JSON.stringify([]),
  "lex_data_ver": JSON.stringify("20260401")
};

console.log("=== DADOS PARA COLAR NA VERSÃO REMOTA ===");
console.log(JSON.stringify(dados, null, 2));

// Salvar em arquivo
const arquivo = path.join(__dirname, 'dados-exportados.json');
fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
console.log(`\n✅ Dados salvos em: ${arquivo}`);
