// Importar dependencias
require('dotenv').config();
const { HederaAgentKit, createHederaTools } = require('hedera-agent-kit');
const { PrivateKey, TokenId, TopicId } = require('@hashgraph/sdk');

// Obtener la clave pública de la clave privada
const privateKeyObject = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
const publicKeyDer = privateKeyObject.publicKey.toStringDer();

// Crear instancia del agente Hedera
const hederaAgent = new HederaAgentKit(
  process.env.HEDERA_ACCOUNT_ID,
  process.env.HEDERA_PRIVATE_KEY,
  publicKeyDer,
  process.env.HEDERA_NETWORK
);

// Función principal para demostrar varias operaciones
async function ejemploOperaciones() {
  try {
    console.log("=== Información de la cuenta ===");
    // Obtener balance de HBAR
    const balance = await hederaAgent.getHbarBalance();
    console.log('Balance de HBAR:', balance);

    // Obtener todos los tokens
    console.log("\n=== Tokens de la cuenta ===");
    const tokensBalance = await hederaAgent.getAllTokensBalances(process.env.HEDERA_NETWORK);
    console.log('Balances de tokens:', tokensBalance);

    // Crear un nuevo token fungible
    console.log("\n=== Creación de token fungible ===");
    console.log("Creando token fungible...");
    const createTokenResult = await hederaAgent.createFT({
      name: "Ejemplo Token",
      symbol: "EJMP",
      decimals: 2,
      initialSupply: 1000,
      maxSupply: 10000,
      memo: "Token creado con Hedera Agent Kit"
    });
    console.log("Token creado:", createTokenResult);
    
    // Si se creó exitosamente el token, realizar más operaciones
    if (createTokenResult.status) {
      const tokenId = createTokenResult.tokenId;
      console.log(`Token ID: ${tokenId}`);
      
      // Esperar un momento para que el token se propague
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Obtener detalles del token
      console.log("\n=== Detalles del token ===");
      const tokenDetails = await hederaAgent.getHtsTokenDetails(tokenId.toString(), process.env.HEDERA_NETWORK);
      console.log("Detalles del token:", tokenDetails);
      
      // Crear un tema de HCS
      console.log("\n=== Creación de tema HCS ===");
      const topicResult = await hederaAgent.createTopic("Mi tema de ejemplo", true);
      console.log("Tema creado:", topicResult);
      
      if (topicResult.status) {
        const topicId = topicResult.topicId;
        console.log(`Topic ID: ${topicId}`);
        
        // Enviar mensaje al tema
        console.log("\n=== Envío de mensaje al tema ===");
        const messageResult = await hederaAgent.submitTopicMessage(
          TopicId.fromString(topicId), 
          "Hola, este es un mensaje de prueba!"
        );
        console.log("Mensaje enviado:", messageResult);
        
        // Esperar un momento para que el mensaje se procese
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Obtener mensajes del tema
        console.log("\n=== Mensajes del tema ===");
        const messages = await hederaAgent.getTopicMessages(
          TopicId.fromString(topicId), 
          process.env.HEDERA_NETWORK
        );
        console.log("Mensajes:", messages);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar el ejemplo
ejemploOperaciones(); 