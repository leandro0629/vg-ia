const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// API Key passed by user
const apiKey = "AIzaSyAbf_5hpQp88GjUhlPOySHUyygq3bS96ig";
const genAI = new GoogleGenerativeAI(apiKey);

async function generateLogo() {
  try {
    console.log("⏳ Gerando logo Kausas em dourado...\n");
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Create a professional minimalist modern logo for the brand "kausas". 
    
    DESIGN REQUIREMENTS:
    - Text: "kausas" in clean, modern sans-serif font
    - Color: Solid gold/amber (#FBBF24)
    - Style: Minimalist and professional wordmark
    - Background: None (transparent/clean background for showcase)
    - Purpose: Logo suitable for web, mobile app, and print
    - Quality: High-quality, crisp, scalable design
    
    The logo should be elegant, memorable, and work well at any size from 16px to 512px.
    Show the logo clearly on a neutral background for presentation.`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }]
    });

    const response = await result.response;
    
    console.log("✅ Logo gerada com sucesso!\n");
    console.log("📋 Resposta da IA:");
    console.log(response.text());
    
    // Save to file
    const outputFile = "c:/Users/leand/Desktop/JUS IA/logo-generation-details.txt";
    fs.writeFileSync(outputFile, response.text());
    console.log(`\n💾 Detalhes salvos em: ${outputFile}`);
    
  } catch (error) {
    console.error("❌ Erro ao gerar logo:", error.message);
  }
}

generateLogo();
