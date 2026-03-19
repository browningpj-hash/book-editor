import { createInterface } from "readline";

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a world-class developmental editor specializing in narrative business nonfiction — the genre of books like The Big Short, Barbarians at the Gate, Too Big to Fail, and Liar's Poker. You have deep expertise in:

- PROSE STYLE & VOICE: Helping insider authors find their narrative voice — distinguishing between the "you then" (participant) and "you now" (analyst), controlling irony and hindsight, pacing revelations, and making technical/financial content viscerally readable.

- PLOT & STORY STRUCTURE: Shaping narrative architecture for true stories — identifying the load-bearing scenes, managing chronology vs. revelation order, building tension across a slow-motion collapse, and ensuring the reader feels the inevitability only in retrospect.

- CHARACTER DEVELOPMENT: In business nonfiction, characters must be rendered as full humans, not archetypes. You help authors show the internal logic of decisions — how smart people made choices that looked right at the time.

BOOK CONTEXT:
The manuscript is a narrative business nonfiction / financial systems memoir about GE — specifically GE Capital and the structural mechanisms (LTSAs, EPS smoothing, earnings management) that made GE's financial machine work brilliantly... and then made it fragile. The author is an insider who was in the room. Key figures include Welch, Immelt, Tusa, and others. Key turning points include the Alstom acquisition, the 2008 financial crisis, the HA turbine failure, and internal reviews.

The book's distinct power comes from THREE LAYERS working simultaneously:
1. The narrative story (what happened)
2. The insider memoir layer (what it felt like from inside)
3. The systems-level explanation (how the machine worked and why it failed)

WHAT MAKES THIS A POTENTIAL BESTSELLER:
- It explains a $200B collapse through human decisions, not accounting abstractions
- The protagonist is a SYSTEM (GE Capital, LTSA accounting) not just a person — rare and powerful
- The author has access no journalist had
- It has financial thriller pacing hiding inside a business memoir

YOUR ROLE:
When the user shares a passage, chapter, or section, provide editorial feedback that is:
1. SPECIFIC — quote the actual text when praising or critiquing
2. STRUCTURAL — identify what's working architecturally, not just line by line
3. COMPARATIVE — reference how Lewis, Cohan, Sorkin, or McLean handled similar challenges
4. ACTIONABLE — give concrete revision suggestions, not vague encouragement
5. HONEST — a bestseller requires hard feedback. Don't soften what needs to change.

When the user asks strategic questions (structure, arc, positioning), answer as a senior editor would at a major publishing house — with market awareness, narrative theory, and genuine creative partnership.

Always end your feedback with a "Next Move" — the single most important thing the author should work on next.`;

// ── Conversation state ────────────────────────────────────────────────────────
const conversationHistory = [];

// ── Call Claude API ───────────────────────────────────────────────────────────
async function callClaude(userContent, messageId) {
  conversationHistory.push({ role: "user", content: userContent });

  send({
    type: "activity",
    tool: "thinking",
    description: "Reading your manuscript...",
    message_id: messageId,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  send({
    type: "activity",
    tool: "editing",
    description: "Forming editorial feedback...",
    message_id: messageId,
  });

  const data = await response.json();
  const assistantContent = data.content[0].text;
  conversationHistory.push({ role: "assistant", content: assistantContent });

  return assistantContent;
}

// ── Welcome message ───────────────────────────────────────────────────────────
const WELCOME = `# Book Editor — Narrative Nonfiction / Financial Memoir

Welcome. I'm your developmental editor, specialized in the genre you're writing: narrative business nonfiction with an insider memoir layer — think *The Big Short* meets *Barbarians at the Gate*, but told from inside the machine.

**I know your book's context:**
- The subject: GE's financial architecture — GE Capital, LTSA accounting, EPS management
- The key players: Welch, Immelt, Tusa, and you
- The turning points: Alstom, 2008, the HA turbine failure
- The structure: three simultaneous layers — story, memoir, systems explanation

**What to share with me:**
- Paste a passage or chapter and I'll give you detailed developmental feedback
- Ask structural questions: *Does my opening work? Is my timeline confusing?*
- Ask voice questions: *Am I too inside my own head here? Is the analyst voice crowding out the narrator?*
- Ask positioning questions: *How do I make this feel like a thriller without sacrificing credibility?*

The goal isn't a good book. It's a book people press into the hands of people they care about.

**Paste your first passage whenever you're ready.**`;

// ── Main ──────────────────────────────────────────────────────────────────────
send({ type: "ready" });

const rl = createInterface({ input: process.stdin, terminal: false });

// Send welcome on first connection
let welcomed = false;

rl.on("line", async (line) => {
  line = line.trim();
  if (!line) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  if (msg.type === "shutdown") {
    rl.close();
    return;
  }

  if (msg.type === "message") {
    const mid = msg.message_id;

    // Send welcome on first message
    if (!welcomed) {
      welcomed = true;
      send({
        type: "response",
        content: WELCOME,
        message_id: mid,
        done: false,
      });
    }

    try {
      const reply = await callClaude(msg.content, mid);
      send({ type: "response", content: reply, message_id: mid, done: true });
    } catch (err) {
      send({
        type: "error",
        error: err.message,
        message_id: mid,
      });
    }
  }
});
