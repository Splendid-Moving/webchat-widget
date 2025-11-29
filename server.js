import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.CHATKIT_WORKFLOW_ID;

// This endpoint gives a ChatKit client secret
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

        // Optional but recommended: turn off visible history + auto titles
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

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ChatKit server running on port ${PORT}`);
});
