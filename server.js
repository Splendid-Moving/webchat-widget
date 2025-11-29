import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.CHATKIT_WORKFLOW_ID;
const MAKE_QUOTE_WEBHOOK_URL = "https://hook.us2.make.com/gl48gm7pev7xqxjvoa1couugqwwta2wo";

// Create ChatKit session and return client_secret
app.post("/session", async (req, res) => {
  try {
    // Get user ID from frontend, or fall back to a random one
    const userIdFromClient = req.body?.user;
    const userId =
      typeof userIdFromClient === "string" && userIdFromClient.trim().length > 0
        ? userIdFromClient.trim()
        : "anon_" + Math.random().toString(36).substring(2);

    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        user: userId,
        workflow: { id: WORKFLOW_ID },
        // Turn off visible history + auto titles
        chatkit_configuration: {
          history: {
            enabled: false,
          },
          automatic_thread_titling: {
            enabled: false,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI /chatkit/sessions error:", data);
      return res.status(500).json({ error: "OpenAI error", details: data });
    }

    res.json(data);
  } catch (err) {
    console.error("Error creating ChatKit session:", err);
    res.status(500).json({ error: "Session creation failed" });
  }
});

// Tool endpoint: send quote email via Make webhook
app.post("/tool/send_quote_email", async (req, res) => {
  try {
    if (!MAKE_QUOTE_WEBHOOK_URL) {
      return res
        .status(500)
        .json({ error: "MAKE_QUOTE_WEBHOOK_URL is not configured" });
    }

    const { email, name, quote_text } = req.body || {};

    if (!email || !quote_text) {
      return res
        .status(400)
        .json({ error: "Missing required fields: email or quote_text" });
    }

    const makeResponse = await fetch(MAKE_QUOTE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name, quote_text }),
    });

    if (!makeResponse.ok) {
      const text = await makeResponse.text();
      console.error("Make webhook error:", text);
      return res.status(500).json({ error: "Make webhook failed", details: text });
    }

    res.json({ status: "sent" });
  } catch (err) {
    console.error("Error in send_quote_email tool:", err);
    res.status(500).json({ error: "send_quote_email failed" });
  }
});

// Serve index.html (local test page)
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ChatKit server running on port ${PORT}`);
});
