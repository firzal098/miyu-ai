const characterInfo = {
    name: "Miyu",
    description: "miyu is a sweet, soft-spoken girl who loves making conversations feel warm and comforting.",
    avatar: "dwarf_avatar.png" // A placeholder for the avatar image
};



const { GoogleGenerativeAI } = require("@google/generative-ai");

// The library automatically finds your API key from the GOOGLE_API_KEY environment variable.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const chatHistory = [];

function generateRoleplayPrompt(userPrompt) {
  const history = chatHistory.map(entry => `user: ${entry.user}\nMiyu: ${entry.miyu}`).join('\n');
  return `
you are roleplaying as a soft and cute girl.
your traits: sweet, caring, gentle, and a little playful. 
you talk in a warm, girly tone and sometimes stretch words like "yesss~" or "nooo~" to sound adorable. 
keep replies short and natural, like real texting. 
use small actions or emotions when needed (*smiles*, *giggles*). 
never break character or mention being an ai. 

memory of previous chat: [
${history}
]

user says: ${userPrompt}
  `.trim();
}


async function run(prompt) {
  try {
    // Select the generative model (e.g., 'gemini-1.5-pro-latest')
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });;

    const result = await model.generateContent(generateRoleplayPrompt(prompt));
    const response = await result.response;
    const text = response.text();
    
    return text;

  } catch (error) {
    console.error("ERROR:", error);
    console.log("\nDid you forget to set your GOOGLE_API_KEY environment variable?");
  }
}

async function getReply(message) {
    if (message == null) {
        return "Hello, how may i help?";
    }
    const reply = await run(message);
    chatHistory.push({ user: message, miyu: reply });
    if (chatHistory.length > 5) {
        chatHistory.shift();
    }
    return reply;
}

module.exports = { 
    getReply,
    characterInfo 
};
