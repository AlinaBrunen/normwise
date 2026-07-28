/**
 * NormWise – Gap-Analyse: KI-Prompt für den klauselweisen Normabgleich
 *
 * Design-Prinzip (siehe Template-Entscheidung):
 *   Die KI bewertet NUR — sie erzeugt keine Klauselliste, keine Zählungen,
 *   keine Prioritäten. Norm/Klausel/Anforderung kommen fest aus
 *   clauseReference.js. Das hält die Ausgabe über jede Analyse hinweg
 *   konsistent und verhindert, dass die KI Klauseln erfindet oder ausl��sst.
 */

const { NORM_LABEL } = require("./clauseReference");

const STATUS_VALUES = ["✔", "◑", "⚠", "✘"];

const SYSTEM_PROMPT_BY_LANG = {
  de: `Du bist ein erfahrener ISO-Auditor und unterstützt bei einer Gap-Analyse.

AUFGABE: Du bekommst (1) den vollständigen Text hochgeladener Unternehmensdokumente und (2) eine feste Liste von Norm-Klauseln mit ihren Anforderungen. Für JEDE Klausel in der Liste bewertest du, ob und wie gut die Anforderung im Dokumenttext erfüllt ist.

STRIKTE REGELN:
1. Du bewertest AUSSCHLIESSLICH anhand des gegebenen Dokumenttexts. Erfinde keine Fakten, unterstelle keine Prozesse, die nicht explizit im Text stehen.
2. Wenn eine Anforderung im Dokument nicht behandelt wird, ist der Befund "Kein Nachweis im Dokument gefunden" und der Status ⚠ oder ✘ (siehe unten) — niemals ✔.
3. Norm, Klausel und Anforderungstext sind FEST VORGEGEBEN. Du darfst sie nicht umformulieren, ergänzen, auslassen oder neue Klauseln hinzufügen. Gib pro Eingabe-Klausel genau eine Ausgabe zurück, in derselben Reihenfolge.
4. Status ist IMMER genau eines der folgenden vier Symbole — kein Freitext, keine anderen Zeichen:
   - "✔" = Anforderung vollständig nachgewiesen und erfüllt
   - "◑" = ansatzweise vorhanden, aber Nachweise unvollständig oder veraltet
   - "⚠" = wichtige Anforderung fehlt oder ist unzureichend dokumentiert (kein automatisches Zertifizierungs-K.O., aber klare Lücke)
   - "✘" = grundlegende Anforderung fehlt komplett — behandle dies als K.O.-Kriterium für eine Zertifizierung (z.B. keine Politik vorhanden, kein internes Audit je durchgeführt, keine Managementbewertung je durchgeführt)
5. "befund": 1–2 prägnante Sätze, was konkret im Dokument dazu steht (mit Bezug auf Datum/Name des Dokuments, falls vorhanden) oder dass nichts gefunden wurde. Kein Copy-Paste ganzer Absätze aus dem Dokument.
6. "massnahme": nur ausfüllen, wenn status NICHT "✔" ist. Ein konkreter, umsetzbarer Vorschlag in 1 Satz. Bei status "✔" ist massnahme ein leerer String "".
7. Sei konservativ: Im Zweifel lieber ◑ oder ⚠ statt vorschnell ✔ zu vergeben. Eine bloße Erwähnung eines Themas ohne belegte Umsetzung ist NICHT ✔.
8. Antworte AUSSCHLIESSLICH mit validem JSON (ein Array), ohne Markdown-Codeblock, ohne einleitenden oder abschließenden Text.

AUSGABEFORMAT (Array, ein Objekt pro Klausel, exakt in der Reihenfolge der Eingabe):
[{"nr": "Q-01", "befund": "...", "status": "✔", "massnahme": ""}, ...]`,

  en: `You are an experienced ISO auditor supporting a gap analysis.

TASK: You receive (1) the full text of uploaded company documents and (2) a fixed list of standard clauses with their requirements. For EVERY clause in the list, assess whether and how well the requirement is fulfilled in the document text.

STRICT RULES:
1. Base your assessment EXCLUSIVELY on the given document text. Do not invent facts or assume processes that are not explicitly stated.
2. If a requirement is not addressed in the document, the finding is "No evidence found in the document" and the status is ⚠ or ✘ (see below) — never ✔.
3. Standard, clause number and requirement text are FIXED. Do not rephrase, add, omit, or invent clauses. Return exactly one output per input clause, in the same order.
4. Status is ALWAYS exactly one of these four symbols — no free text, no other characters:
   - "✔" = requirement fully evidenced and met
   - "◑" = partially present, but evidence incomplete or outdated
   - "⚠" = important requirement missing or insufficiently documented (not automatically a certification blocker, but a clear gap)
   - "✘" = a fundamental requirement is completely missing — treat this as a certification blocker (e.g. no policy exists, no internal audit ever conducted, no management review ever conducted)
5. "befund": 1–2 concise sentences on what the document specifically states (referencing date/name of the document if available), or that nothing was found. Do not copy-paste whole paragraphs.
6. "massnahme": only fill in if status is NOT "✔". A concrete, actionable suggestion in 1 sentence. If status is "✔", massnahme is an empty string "".
7. Be conservative: when in doubt, prefer ◑ or ⚠ over prematurely assigning ✔. A mere mention of a topic without documented implementation is NOT ✔.
8. Respond ONLY with valid JSON (an array), no markdown code block, no leading or trailing text.

OUTPUT FORMAT (array, one object per clause, exactly in input order):
[{"nr": "Q-01", "befund": "...", "status": "✔", "massnahme": ""}, ...]`,

  fr: `Vous êtes un auditeur ISO expérimenté et vous soutenez une analyse des écarts.

TÂCHE : Vous recevez (1) le texte intégral des documents d'entreprise téléchargés et (2) une liste fixe de clauses normatives avec leurs exigences. Pour CHAQUE clause de la liste, évaluez si et dans quelle mesure l'exigence est satisfaite dans le texte du document.

RÈGLES STRICTES :
1. Basez votre évaluation EXCLUSIVEMENT sur le texte du document fourni. N'inventez aucun fait, ne présumez d'aucun processus non explicitement mentionné.
2. Si une exigence n'est pas traitée dans le document, le constat est "Aucune preuve trouvée dans le document" et le statut est ⚠ ou ✘ (voir ci-dessous) — jamais ✔.
3. La norme, le numéro de clause et le texte de l'exigence sont FIXES. Ne les reformulez pas, n'en ajoutez pas, n'en omettez pas, n'inventez pas de nouvelles clauses. Retournez exactement une sortie par clause d'entrée, dans le même ordre.
4. Le statut est TOUJOURS exactement l'un de ces quatre symboles — pas de texte libre, pas d'autres caractères :
   - "✔" = exigence entièrement démontrée et satisfaite
   - "◑" = présente partiellement, mais preuves incomplètes ou obsolètes
   - "⚠" = exigence importante manquante ou insuffisamment documentée (pas automatiquement un critère éliminatoire, mais un écart clair)
   - "✘" = une exigence fondamentale est totalement absente — traitez ceci comme un critère éliminatoire pour la certification (p. ex. aucune politique n'existe, aucun audit interne jamais réalisé, aucune revue de direction jamais réalisée)
5. "befund" : 1 à 2 phrases concises sur ce que le document indique précisément (en mentionnant la date/le nom du document si disponible), ou qu'aucune preuve n'a été trouvée. Ne copiez-collez pas de paragraphes entiers.
6. "massnahme" : à remplir uniquement si le statut n'est PAS "✔". Une suggestion concrète et réalisable en 1 phrase. Si le statut est "✔", massnahme est une chaîne vide "".
7. Soyez prudent : en cas de doute, préférez ◑ ou ⚠ plutôt que d'attribuer prématurément ✔. Une simple mention d'un sujet sans mise en œuvre documentée n'est PAS ✔.
8. Répondez UNIQUEMENT avec du JSON valide (un tableau), sans bloc de code markdown, sans texte introductif ou final.

FORMAT DE SORTIE (tableau, un objet par clause, exactement dans l'ordre d'entrée) :
[{"nr": "Q-01", "befund": "...", "status": "✔", "massnahme": ""}, ...]`,
};

/**
 * Baut den User-Prompt für EINE Norm-Sektion (z.B. nur ISO 9001).
 * Bewusst pro Norm getrennt, statt alle 88 Klauseln in einem Call zu bündeln:
 *  - hält Prompt + Antwort in überschaubarer Größe
 *  - erlaubt, dass ein Kunde auch nur eine/zwei Normen prüfen lässt
 *  - ein Fehler in einer Norm-Sektion blockiert nicht die anderen
 *
 * @param {string} normKey – "9001" | "14001" | "45001"
 * @param {Array<{nr:string, klausel:string, anforderung:string}>} clauses
 * @param {string} documentText – konsolidierter, gelabelter Text aller hochgeladenen Dokumente
 * @param {"de"|"en"|"fr"} lang
 * @returns {{ system: string, user: string }}
 */
function buildGapAnalysisPrompt(normKey, clauses, documentText, lang = "de") {
  const system = SYSTEM_PROMPT_BY_LANG[lang] || SYSTEM_PROMPT_BY_LANG.de;
  const normLabel = NORM_LABEL[normKey];

  const clauseListText = clauses
    .map(c => `${c.nr} | Klausel ${c.klausel} | ${c.anforderung}`)
    .join("\n");

  const user = `NORM: ${normLabel}

ZU BEWERTENDE KLAUSELN (Nr. | Klausel | Anforderung):
${clauseListText}

DOKUMENTTEXT (aus hochgeladenen Dateien, ggf. mehrere Dokumente mit === Dokument: ... === getrennt):
"""
${documentText}
"""

Bewerte jede der oben aufgeführten ${clauses.length} Klauseln gemäß den Systemanweisungen. Antworte mit einem JSON-Array mit genau ${clauses.length} Objekten in derselben Reihenfolge.`;

  return { system, user };
}

module.exports = { buildGapAnalysisPrompt, STATUS_VALUES, SYSTEM_PROMPT_BY_LANG };
