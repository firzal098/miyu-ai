const characterInfo = {
    name: "Gromm Stonehand",
    description: "A grumpy dwarf blacksmith from the Iron Peaks. He's more interested in his forge than in conversations, but he might share some wisdom if you're worthy (or if you have ale).",
    avatar: "dwarf_avatar.png" // A placeholder for the avatar image
};

const responses = [
    "Hmph. What do you want?",
    "Don't bother me unless you've got gold or ale.",
    "Speak up or get out of my sight.",
    "Another surface-dweller... what fresh nonsense is this?",
    "I've got axes to grind and rocks to break. Make it quick.",
    "Is that the best you can do? Pathetic.",
    "You're wasting my time.",
    "Bah! I've heard better stories from a goblin.",
    "Unless you're here to talk about mining, I'm not interested."
];

let responseIndex = 0;

function getGrumpyDwarfReply(message) {
    // A simple logic to cycle through responses.
    const reply = responses[responseIndex];
    responseIndex = (responseIndex + 1) % responses.length;
    return reply;
}

module.exports = { 
    getGrumpyDwarfReply,
    characterInfo 
};