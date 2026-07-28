/**
 * NormWise – Gap-Analyse: Upload-Endpoint
 * POST /api/gap-analyse-upload
 *
 * Nimmt mehrere Dateien (multipart/form-data) entgegen, extrahiert deren
 * Text (Word/Excel/text-PDF), prüft die Obergrenzen (Dateianzahl + Gesamt-
 * zeichen) und gibt den konsolidierten, gelabelten Text zurück – bereit für
 * den nachgelagerten KI-Normabgleich (Klausel-Referenztabelle).
 *
 * Dieser Endpoint macht KEINE KI-Bewertung selbst – das ist bewusst getrennt,
 * damit Extraktion/Validierung unabhängig getestet werden können.
 *
 * Voraussetzungen (package.json):
 *   "mammoth": "^1.7.0",
 *   "xlsx": "^0.18.5",
 *   "pdf-parse": "^1.1.1",
 *   "formidable": "^3.5.1"
 *
 * Vercel-Konfiguration: bodyParser muss deaktiviert sein (siehe config unten),
 * da wir multipart/form-data selbst mit formidable parsen.
 */

const formidable = require("formidable");
const fs = require("fs/promises");

const { extractFile, UnsupportedFileTypeError, ScannedPdfError } = require("./lib/extractText");
const { checkFileCount, checkTotalChars, UploadLimitExceededError } = require("./lib/uploadLimits");

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parst das multipart/form-data Request in eine Liste von { filename, buffer }.
 */
function parseUploadedFiles(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, maxFileSize: 50 * 1024 * 1024 }); // 50MB Sicherheitsnetz pro Datei
    form.parse(req, async (err, fields, files) => {
      if (err) return reject(err);

      // formidable liefert files.documents als Array oder Einzelobjekt,
      // je nachdem wie viele Dateien unter dem Feldnamen "documents" gesendet wurden
      const raw = files.documents;
      const fileList = Array.isArray(raw) ? raw : raw ? [raw] : [];

      try {
        const results = await Promise.all(
          fileList.map(async (f) => ({
            filename: f.originalFilename || f.newFilename,
            buffer: await fs.readFile(f.filepath),
          }))
        );
        resolve({ files: results, fields });
      } catch (readErr) {
        reject(readErr);
      }
    });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt. Bitte POST verwenden." });
  }

  let uploadedFiles;
  try {
    const parsed = await parseUploadedFiles(req);
    uploadedFiles = parsed.files;
  } catch (err) {
    return res.status(400).json({ error: "Upload konnte nicht gelesen werden.", detail: err.message });
  }

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: "Keine Dateien empfangen. Bitte mindestens ein Dokument hochladen." });
  }

  // 1. Billige Prüfung zuerst: Dateianzahl, bevor überhaupt extrahiert wird
  try {
    checkFileCount(uploadedFiles.length);
  } catch (err) {
    if (err instanceof UploadLimitExceededError) {
      return res.status(413).json({ error: err.message, details: err.details });
    }
    throw err;
  }

  // 2. Extraktion pro Datei — Fehler einzeln sammeln statt beim ersten Fehler abzubrechen,
  //    damit der Nutzer alle problematischen Dateien auf einmal sieht
  const extracted = [];
  const failures = [];

  for (const file of uploadedFiles) {
    try {
      const result = await extractFile(file);
      extracted.push(result);
    } catch (err) {
      if (err instanceof UnsupportedFileTypeError || err instanceof ScannedPdfError) {
        failures.push({ filename: file.filename, reason: err.message, type: err.name });
      } else {
        failures.push({ filename: file.filename, reason: `Unerwarteter Fehler beim Lesen: ${err.message}`, type: "ExtractionError" });
      }
    }
  }

  if (failures.length > 0) {
    return res.status(422).json({
      error: "Ein oder mehrere Dokumente konnten nicht verarbeitet werden.",
      failures,
      succeeded: extracted.map(e => ({ filename: e.filename, charCount: e.charCount })),
    });
  }

  // 3. Gesamt-Zeichenlimit erst NACH erfolgreicher Extraktion aller Dateien prüfen
  let totalChars;
  try {
    totalChars = checkTotalChars(extracted);
  } catch (err) {
    if (err instanceof UploadLimitExceededError) {
      return res.status(413).json({ error: err.message, details: err.details });
    }
    throw err;
  }

  // 4. Konsolidierten, gelabelten Text zusammenbauen — bereit für den KI-Normabgleich
  const consolidatedText = extracted
    .map(f => `=== Dokument: ${f.filename} ===\n${f.text}`)
    .join("\n\n");

  return res.status(200).json({
    success: true,
    fileCount: extracted.length,
    totalChars,
    files: extracted.map(f => ({ filename: f.filename, charCount: f.charCount })),
    consolidatedText,
  });
};
