/*import express from "express";
import cors from "cors";
 
const app = express();
app.use(cors());
app.use(express.json());
 
app.post("/support", async (req, res) => {
  const { issue, context } = req.body;
 
  // This is where Cursor / OpenAI / local LLM plugs in
  const reply = `
Diagnosis:
Insufficient data
 
Evidence:
Issue description provided without system details
 
Recommended Fix:
Collect OS, version, error codes, and recent changes
 
Commands:
N/A
 
Next Question:
What OS, version, and exact error message are you seeing?
`;
 
  res.json({ reply });
});
 
app.listen(3000, () =>
  console.log("Tech Support AI backend running on port 3000")
); */
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
 
dotenv.config();
 
const app = express();
app.use(cors());
app.use(express.json());
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
 
app.post("/support", async (req, res) => {
  try {
    const { issue, logs } = req.body;
 
 /*const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", // <- change this
  messages: [
    {
      role: "system",
      content: "You are a helpful tech support assistant."
    },
    {
      role: "user",
      content: `Issue: ${issue}\nLogs: ${logs}`
    }
  ],
  max_tokens: 500,
});*/
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", // <- change this
  messages: [
    {
      role: "system",
      content: "You are a helpful tech support assistant."
    },
    {
      role: "user",
      content: `Issue: ${issue}\nLogs: ${logs}`
    }
  ],
  max_tokens: 500,
});
 
    res.json({ solution: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ solution: "Error: Could not fetch AI response." });
  }
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));