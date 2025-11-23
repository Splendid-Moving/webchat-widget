import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.CHATKIT_WORKFLOW_ID;

// This endpoint gives a ChatKit client secret
app.post("/session", async (req, res) => {
  const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      user: "test_user",
      workflow: { id: WORKFLOW_ID },
    }),
  });

  const data = await response.json();
  res.json(data);
});

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ChatKit server running on port ${PORT}`);
});