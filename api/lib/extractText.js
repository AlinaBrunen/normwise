/**
 * NormWise – Gap-Analyse Upload-Pipeline
 * Text-Extraktion aus .docx, .xlsx/.xls und text-basierten .pdf Dateien.
 *
 * Grundprinzip (wie entschieden):
 *  - Keine OCR, keine gescannten Dokumente
 *  - PDF: nach der Extraktion Textdichte prüfen → wenn zu wenig Text pro Seite,
 *    gilt die Datei als Scan/Foto und wird mit klarer Fehlermeldung abgelehnt
 *    (kein stiller Fehlschlag, kein OCR-Versuch)
 */

const mammoth = require("mammoth");
const XLSX = require("xlsx");
const pdfParse = require("pdf-parse");

// Ab wie vielen Zeichen pro Seite ein PDF als "hat echten Text" gilt.
// Gescannte/fotografierte Seiten liefern beim Extrahieren nahe 0 Zeichen.
const MIN_CHARS_PER_PAGE = 50;

const SUPPORTED_EXTENSIONS = [".docx", ".xlsx", ".xls", ".pdf"];

class UnsupportedFileTypeError extends Error {
  constructor(filename) {
    super(`Dateityp nicht unterstützt: ${filename}. Erlaubt sind Word (.docx), Excel (.xlsx/.xls) und text-basierte PDFs (.pdf).`);
    this.name = "UnsupportedFileTypeError";
    this.filename = filename;
  }
}

class ScannedPdfError extends Error {
  constructor(filename) {
    super(`"${filename}" scheint ein gescanntes Dokument oder Foto zu sein — es enthält keinen auslesbaren Text. Bitte laden Sie eine text-basierte Version hoch (z. B. das Original-Word-/PDF-Dokument statt eines Scans).`);
    this.name = "ScannedPdfError";
    this.filename = filename;
  }
}

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

/**
 * Extrahiert Text aus einer .docx-Datei (Word).
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").trim();
}

/**
 * Extrahiert Text aus einer .xlsx/.xls-Datei (Excel).
 * Liest alle Sheets, alle Zellen (Werte, keine Formeln-Strings).
 * @param {Buffer} buffer
 * @returns {string}
 */
function extractXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellText: true });
  const parts = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) {
      parts.push(`--- Sheet: ${sheetName} ---\n${csv.trim()}`);
    }
  }
  return parts.join("\n\n").trim();
}

/**
 * Extrahiert Text aus einer text-basierten PDF-Datei.
 * Prüft nach der Extraktion die Textdichte pro Seite; wirft ScannedPdfError,
 * wenn die Datei wie ein Scan/Foto aussieht.
 * @param {Buffer} buffer
 * @param {string} filename – nur für Fehlermeldungen
 * @returns {Promise<string>}
 */
async function extractPdf(buffer, filename) {
  const data = await pdfParse(buffer);
  const text = (data.text || "").trim();
  const numPages = data.numpages || 1;

  const charsPerPage = text.length / numPages;
  if (charsPerPage < MIN_CHARS_PER_PAGE) {
    throw new ScannedPdfError(filename);
  }
  return text;
}

/**
 * Extrahiert Text aus einer einzelnen hochgeladenen Datei.
 * @param {{ filename: string, buffer: Buffer }} file
 * @returns {Promise<{ filename: string, text: string, charCount: number }>}
 */
async function extractFile(file) {
  const { filename, buffer } = file;
  const ext = getExtension(filename);

  let text;
  switch (ext) {
    case ".docx":
      text = await extractDocx(buffer);
      break;
    case ".xlsx":
    case ".xls":
      text = extractXlsx(buffer);
      break;
    case ".pdf":
      text = await extractPdf(buffer, filename);
      break;
    default:
      throw new UnsupportedFileTypeError(filename);
  }

  if (!text || text.length === 0) {
    // Leere, aber technisch valide Datei (z.B. leeres Word-Dokument)
    throw new Error(`"${filename}" enthält keinen auslesbaren Text. Bitte prüfen Sie die Datei.`);
  }

  return { filename, text, charCount: text.length };
}

module.exports = {
  extractFile,
  getExtension,
  SUPPORTED_EXTENSIONS,
  UnsupportedFileTypeError,
  ScannedPdfError,
  MIN_CHARS_PER_PAGE,
};
