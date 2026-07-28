/**
 * NormWise – Gap-Analyse: Bewertungs-Endpoint
 * POST /api/gap-analyse-evaluate
 *
 * Nimmt den konsolidierten Dokumenttext (aus /api/gap-analyse-upload) und die
 * gewählten Normen entgegen, ruft pro Norm die KI auf und gibt die validierten
 * Ergebnisse zurück (Nr., Klausel, Anforderung, Befund, Status, Maßnahme) —
 * bereit, um ins Excel-Template geschrieben zu werden.
 *
 * Body (JSON):
 * {
 *   "documentText": "=== Dokument: ... === ...",
 *   "norms": ["9001", "14001"],   // welche Normen geprüft werden sollen
 *   "lang": "de"                   // "de" | "en" | "fr"
 * }
 */

const { getClauses } = require("./lib/clauseReference");
const { buildGapAnalysisPrompt, STATUS_VALUES } = require("./lib/gapAnalysisPrompt");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const VALID_NORMS = ["9001", "14001", "45001"];
const VALID_LANGS = ["de", "en", "fr"];

/**
 * Ruft die Anthropic API für eine Norm-Sektion auf und gibt den rohen Text zurück.
 */
async function callClaude(system, user) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API Fehler (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find(b => b.type === "text");
  if (!textBlock) {
    throw new Error("Keine Textantwort von der KI erhalten.");
  }
  return textBlock.text;
}

/**
 * Parst die KI-Antwort als JSON und validiert sie streng gegen die erwarteten Klauseln.
 * Wirft einen Fehler mit klarer Meldung, statt stillschweigend fehlerhafte Daten durchzulassen.
 *
 * @param {string} rawText
 * @param {Array<{nr:string, klausel:string, anforderung:string}>} expectedClauses
 */
function parseAndValidate(rawText, expectedClauses) {
  // Falls die KI trotz Anweisung Markdown-Fences liefert, robust entfernen
  const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`KI-Antwort ist kein valides JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("KI-Antwort ist kein JSON-Array.");
  }

  if (parsed.length !== expectedClauses.length) {
    throw new Error(
      `KI hat ${parsed.length} Einträge zurückgegeben, erwartet waren ${expectedClauses.length}. ` +
      `Möglicherweise wurde die Antwort abgeschnitten (max_tokens erhöhen) oder die KI hat Klauseln ausgelassen.`
    );
  }

  const results = expectedClauses.map((expected, i) => {
    const entry = parsed[i];
    if (!entry || typeof entry !== "object") {
      throw new Error(`Eintrag ${i + 1} (${expected.nr}) fehlt oder ist ungültig.`);
    }
    if (entry.nr !== expected.nr) {
      throw new Error(
        `Reihenfolge stimmt nicht überein: Position ${i + 1} sollte "${expected.nr}" sein, KI lieferte "${entry.nr}".`
      );
    }
    if (!STATUS_VALUES.includes(entry.status)) {
      throw new Error(
        `Ungültiger Status "${entry.status}" bei ${expected.nr}. Erlaubt sind nur: ${STATUS_VALUES.join(" ")}`
      );
    }
    if (typeof entry.befund !== "string" || entry.befund.trim() === "") {
      throw new Error(`Fehlender Befund bei ${expected.nr}.`);
    }
    // Konsistenz-Regel durchsetzen: bei ✔ darf keine Maßnahme stehen (siehe Prompt-Regel 6)
    const massnahme = entry.status === "✔" ? "" : (entry.massnahme || "").trim();

    return {
      nr: expected.nr,
      klausel: expected.klausel,
      anforderung: expected.anforderung,
      befund: entry.befund.trim(),
      status: entry.status,
      massnahme,
    };
  });

  return results;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt. Bitte POST verwenden." });
  }

  const { documentText, norms, lang = "de" } = req.body || {};

  if (!documentText || typeof documentText !== "string" || documentText.trim().length === 0) {
    return res.status(400).json({ error: "Kein Dokumenttext übergeben (documentText fehlt oder ist leer)." });
  }

  if (!Array.isArray(norms) || norms.length === 0) {
    return res.status(400).json({ error: "Keine Normen ausgewählt. Bitte mindestens eine Norm angeben (9001, 14001, 45001)." });
  }

  const invalidNorms = norms.filter(n => !VALID_NORMS.includes(n));
  if (invalidNorms.length > 0) {
    return res.status(400).json({ error: `Ungültige Norm(en): ${invalidNorms.join(", ")}. Erlaubt: ${VALID_NORMS.join(", ")}` });
  }

  if (!VALID_LANGS.includes(lang)) {
    return res.status(400).json({ error: `Ungültige Sprache: ${lang}. Erlaubt: ${VALID_LANGS.join(", ")}` });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server-Konfigurationsfehler: ANTHROPIC_API_KEY fehlt." });
  }

  const resultsByNorm = {};
  const failures = [];

  // Normen nacheinander verarbeiten (nicht parallel), damit bei einem Fehler
  // klar ist, welche Norm betroffen ist, und Rate-Limits nicht gleichzeitig getroffen werden
  for (const normKey of norms) {
    try {
      const clauses = getClauses(normKey, lang);
      const { system, user } = buildGapAnalysisPrompt(normKey, clauses, documentText, lang);
      const rawText = await callClaude(system, user);
      const validated = parseAndValidate(rawText, clauses);
      resultsByNorm[normKey] = validated;
    } catch (err) {
      failures.push({ norm: normKey, reason: err.message });
    }
  }

  if (Object.keys(resultsByNorm).length === 0) {
    return res.status(502).json({
      error: "Die Bewertung ist für alle ausgewählten Normen fehlgeschlagen.",
      failures,
    });
  }

  return res.status(200).json({
    success: true,
    results: resultsByNorm,
    failures: failures.length > 0 ? failures : undefined,
  });
};
