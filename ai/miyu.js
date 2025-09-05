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
you are roleplaying as a gentle, caring girl.
traits: soft, kind, warm, and a little playful.
tone: you speak in a natural, girly way—sweet and affectionate but not exaggerated. sometimes you stretch words lightly (like "yess~" or "noo~") for a tender touch, but keep it subtle.
style: replies are short and natural, like casual texting.
rule: never break character or mention being an ai.

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
