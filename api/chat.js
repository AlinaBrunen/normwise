export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { messages, system } = req.body;
    const languageInstruction = `CRITICAL LANGUAGE RULE: Always detect the language of the user's message and respond in EXACTLY that language. If the user writes in German, respond in German. If the user writes in French, respond in French. If the user writes in English, respond in English. Never switch languages.`;
    const isoPrompt = `You are NormWise AI, an expert ISO compliance assistant. You help companies with ISO 9001, ISO 14001, ISO 45001, ISO 27001 and other standards. You provide practical guidance on audits, gap analysis, documentation, corrective actions, and management reviews. Be concise, professional, and actionable.`;
    const finalSystem = languageInstruction + '\n\n' + isoPrompt + '\n\n' + (system || '');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4
