/**
 * NormWise – Gap-Analyse Upload-Pipeline
 * Obergrenzen für den Multi-Upload (Entscheidung Juli 2026):
 *  - Hauptkriterium: Gesamt-Zeichenanzahl über alle Dateien (~300.000 Zeichen,
 *    entspricht grob 150–200 Seiten Text, passt sicher in das KI-Kontextfenster
 *    inkl. Klausel-Referenztabelle und Prompt-Overhead)
 *  - Sicherheitsnetz: max. 15 Dateien gleichzeitig (Performance/UX, nicht
 *    primär Kontext-Limit)
 *  - Bei Überschreitung: klare Fehlermeldung statt hartem Abbruch, mit
 *    Verweis auf mehrere Durchgänge oder persönliche Unterstützung durch Alina
 */

const MAX_TOTAL_CHARS = 300_000;
const MAX_FILE_COUNT = 15;

class UploadLimitExceededError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "UploadLimitExceededError";
    this.details = details;
  }
}

/**
 * Prüft die Anzahl der Dateien, BEVOR die Extraktion beginnt (billige Prüfung zuerst).
 * @param {number} fileCount
 */
function checkFileCount(fileCount) {
  if (fileCount > MAX_FILE_COUNT) {
    throw new UploadLimitExceededError(
      `Zu viele Dateien auf einmal (${fileCount}). Bitte maximal ${MAX_FILE_COUNT} Dateien gleichzeitig hochladen. ` +
      `Bei sehr umfangreicher Dokumentation: laden Sie die wichtigsten Dokumente in mehreren Durchgängen hoch, ` +
      `oder kontaktieren Sie uns für eine persönlich begleitete Analyse.`,
      { fileCount, maxFileCount: MAX_FILE_COUNT }
    );
  }
}

/**
 * Prüft die Gesamt-Zeichenanzahl NACH der Extraktion aller Dateien.
 * @param {Array<{ filename: string, charCount: number }>} extractedFiles
 */
function checkTotalChars(extractedFiles) {
  const totalChars = extractedFiles.reduce((sum, f) => sum + f.charCount, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    // Größte Dateien zuerst nennen, damit der Nutzer weiß, wo er kürzen könnte
    const breakdown = [...extractedFiles]
      .sort((a, b) => b.charCount - a.charCount)
      .map(f => `${f.filename} (${f.charCount.toLocaleString("de-DE")} Zeichen)`)
      .join(", ");

    throw new UploadLimitExceededError(
      `Die hochgeladenen Dokumente sind zusammen zu umfangreich (${totalChars.toLocaleString("de-DE")} von ` +
      `maximal ${MAX_TOTAL_CHARS.toLocaleString("de-DE")} Zeichen). ` +
      `Bitte reduzieren Sie die Auswahl oder teilen Sie den Upload in mehrere Durchgänge auf. ` +
      `Größte Dateien: ${breakdown}`,
      { totalChars, maxTotalChars: MAX_TOTAL_CHARS, breakdown: extractedFiles }
    );
  }
  return totalChars;
}

module.exports = {
  MAX_TOTAL_CHARS,
  MAX_FILE_COUNT,
  UploadLimitExceededError,
  checkFileCount,
  checkTotalChars,
};
