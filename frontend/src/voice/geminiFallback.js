const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

const PROMPT_TEMPLATE = (transcript) =>
  `You are the command parser for SQA (Skadoosh Quantum Aegis) voice assistant called Dragon Warrior.
The user said: "${transcript}"
Available feature IDs: M1-M7 (Monkey), C1-C7 (Crane), S1-S7 (Snake), A1-A9 (Mantis), T1-T6 (Tigress), P1-P11 (PO), MIRROR_1 to MIRROR_11.
Navigation sections: monkey, crane, snake, mantis, tigress, po, mirror, overview.
Return ONLY a valid JSON object on a single line. No markdown, no explanation, nothing else.
If it is a feature: {"id":"M1","section":"monkey","confidence":0.9}
If it is navigation: {"id":"NAV_MONKEY","section":"monkey","nav":true,"confidence":0.8}
If you cannot match: {"id":null,"error":"no match"}`;

export async function geminiFallback(transcript) {
  if (!GEMINI_KEY) return { id: null, error: 'no key' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT_TEMPLATE(transcript) }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 64 },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) return { id: null, error: 'api error' };

    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    clearTimeout(timeout);
    return { id: null, error: 'timeout or parse error' };
  }
}
