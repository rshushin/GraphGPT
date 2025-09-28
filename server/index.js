import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // set your default

// Loads the original few-shot prompt (kept in the repo)
const loadSystemPrompt = async () =>
  await fs.readFile('./public/prompts/main.prompt', 'utf8');

app.post('/api/extract', async (req, res) => {
  try {
    const { text, previousGraph } = req.body || {};
    const system = await loadSystemPrompt();

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ text, previousGraph }) },
    ];

    const out = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages,
      // expect a JSON object with { nodes: [...], edges: [...] }
      response_format: { type: 'json_object' },
    });

    const content = out.choices?.[0]?.message?.content || '{}';
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 8787;
app.use(express.static('public'));
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
