// Reflection and prayer content for the Scripture of the Day story,
// keyed by the rotation's theme. Falls back to warm defaults.

const REFLECTIONS: Record<string, string> = {
  Love: "You did not earn this love, and you cannot lose it by having a bad day. Before you did anything at all, God loved you first. Let that settle over you — then let it spill onto someone else today.",
  Hope: "Hope is not wishful thinking; it is confidence that God is already standing in your future. Whatever today looks like, it is not the last word.",
  Strength: "Strength here is not gritting your teeth. It is leaning your full weight on Someone who does not move. Where are you still carrying what you were meant to hand over?",
  Trust: "Trust grows in the exact places where understanding runs out. The invitation today is not to figure it out — it is to let go of the steering wheel.",
  Peace: "Peace is not the absence of noise; it is the presence of God in the middle of it. Breathe slowly. He is not anxious about the thing you are anxious about.",
  Courage: "Courage is fear that has said its prayers. God does not promise the absence of the thing you fear — He promises His presence inside it.",
  Renewal: "God's mercies do not run out at the rate you use them. Today is not a leftover of yesterday; it is a fresh page He has already signed.",
  Provision: "The God who feeds sparrows and dresses lilies has not forgotten your name. Name the need out loud — then watch for how He answers it His way.",
  Guidance: "A lamp to your feet lights one step, not a mile. If you can only see the next step, you have exactly enough light to obey.",
  Grace: "Grace means the pressure is off. You are not auditioning for God's affection — you already have it. Now live like a loved person.",
  Comfort: "God does not waste sorrow. The tears He wipes away He first counts and keeps. You are not grieving alone, and you will not grieve forever.",
  Joy: "Joy is not what happens when everything works out. It is what happens when you remember Who holds everything that hasn't yet.",
  Faith: "Faith is not certainty about outcomes; it is certainty about God. Small faith in a great God moves more than great faith in anything else.",
  Forgiveness: "The confession God asks for is not groveling — it is honesty. He is not waiting to shame you; He is faithful and just to cleanse you.",
};

const PRAYERS: Record<string, string> = {
  Love: "Father, thank You for loving me before I ever loved You. Teach me to receive that love without flinching, and to give it away without keeping score.",
  Hope: "God of hope, fill me with joy and peace as I trust You today. When my circumstances argue with Your promises, help me believe You.",
  Strength: "Lord, I am tired in ways I don't have words for. Be my strength today — not so I can impress anyone, but so I can keep walking with You.",
  Trust: "Father, I hand You the things I cannot control and the things I cannot understand. Make my path straight as I lean on You and not on myself.",
  Peace: "Prince of Peace, quiet the noise in me. Guard my heart and my mind today, and let Your peace stand watch where my worry used to.",
  Courage: "Lord, You know what I'm afraid of. Go ahead of me into it. I will not be dismayed, because You are my God and You are holding my hand.",
  Renewal: "Father, thank You that Your mercies are new this morning. Take what is worn out in me and make it new — my mind, my hope, my love for You.",
  Provision: "Provider God, You know what I need before I ask. I bring You my needs by name, and I thank You in advance for how You will meet them.",
  Guidance: "Father, Your Word is a lamp to my feet. I don't need the whole map today — just give me light for the next step, and courage to take it.",
  Grace: "God of grace, thank You that I don't have to earn what Jesus already paid for. Let me walk today as someone who is fully known and fully loved.",
  Comfort: "God of all comfort, hold what is broken in me gently. Wipe the tears You have counted, and teach me to comfort others with the comfort You give me.",
  Joy: "Lord, be my joy today — not the circumstances, You. Restore to me the gladness of belonging to You, and let it show on my face.",
  Faith: "Father, I believe — help my unbelief. Grow my faith not by making life easier, but by showing me again and again that You are faithful.",
  Forgiveness: "Father, I confess what You already know. Thank You for being faithful and just to forgive. Wash me, restore me, and let me extend that same mercy to others.",
};

export function reflectionFor(theme: string): string {
  return (
    REFLECTIONS[theme] ??
    `Sit with this word today: ${theme.toLowerCase()}. Scripture is not in a hurry, and neither is God. Read the verse once more and ask — what would it look like to actually live this before the day ends?`
  );
}

export function prayerFor(theme: string, ref: string): string {
  return (
    PRAYERS[theme] ??
    `Father, thank You for Your Word in ${ref}. Plant it deep in me today. Make ${theme.toLowerCase()} more than an idea — make it the shape of my life, through Christ. Amen.`
  );
}
