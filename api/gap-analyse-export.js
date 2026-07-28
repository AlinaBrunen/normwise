/**
 * NormWise – Gap-Analyse: Export-Endpoint
 * POST /api/gap-analyse-export
 *
 * Nimmt die Ergebnisse aus /api/gap-analyse-evaluate entgegen, lädt das
 * passende Sprach-Template aus /downloads, befüllt es und liefert die
 * fertige xlsx-Datei direkt als Download zurück.
 *
 * Body (JSON):
 * {
 *   "results": { "9001": [...], "14001": [...] },   // von gap-analyse-evaluate
 *   "lang": "de",                                     // "de" | "en" | "fr"
 *   "metadata": { "company": "Kanneccino GmbH", "documents": ["QM-Handbuch.docx"], "date": "28.07.2026" }
 * }
 */

const fs = require("fs/promises");
const path = require("path");
const { fillGapAnalysisTemplate } = require("./lib/gapAnalysisExport");

const TEMPLATE_FILENAMES = {
  de: "NormWise_Gap_Analyse_Template.xlsx",
  en: "NormWise_Gap_Analyse_Template_EN.xlsx",
  fr: "NormWise_Gap_Analyse_Template_FR.xlsx",
};

// Templates liegen im Repo unter /downloads (wie die anderen Paket-Templates)
const TEMPLATE_DIR = path.join(process.cwd(), "downloads");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt. Bitte POST verwenden." });
  }

  const { results, lang = "de", metadata = {} } = req.body || {};

  if (!results || typeof results !== "object" || Object.keys(results).length === 0) {
    return res.status(400).json({ error: "Keine Ergebnisse übergeben (results fehlt oder ist leer)." });
  }

  const templateFilename = TEMPLATE_FILENAMES[lang];
  if (!templateFilename) {
    return res.status(400).json({ error: `Ungültige Sprache: ${lang}. Erlaubt: de, en, fr.` });
  }

  const templatePath = path.join(TEMPLATE_DIR, templateFilename);

  let templateBuffer;
  try {
    templateBuffer = await fs.readFile(templatePath);
  } catch (err) {
    return res.status(500).json({
      error: `Template-Datei nicht gefunden: ${templateFilename}. Erwartet unter /downloads im Projekt.`,
      detail: err.message,
    });
  }

  let outBuffer;
  try {
    outBuffer = fillGapAnalysisTemplate(templateBuffer, results, metadata, lang);
  } catch (err) {
    return res.status(422).json({ error: "Template konnte nicht befüllt werden.", detail: err.message });
  }

  const downloadName = `NormWise_Gap-Analyse_${metadata.company ? metadata.company.replace(/[^a-zA-Z0-9]/g, "_") + "_" : ""}${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  return res.status(200).send(outBuffer);
};
