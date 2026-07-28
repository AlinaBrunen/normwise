/**
 * NormWise – Gap-Analyse: Export in das xlsx-Template
 *
 * Design-Prinzip: Zeilen werden NICHT über hardcodierte Zeilennummern
 * angesprochen (das wäre fragil, sobald sich am Template etwas verschiebt),
 * sondern über die feste "Nr."-Spalte (Q-01, U-01, S-01, …), die in jedem
 * Template bereits vorausgefüllt ist. Das funktioniert identisch für DE/EN/FR,
 * da die Nr.-Präfixe in allen drei Sprachversionen gleich sind.
 */

const XLSX = require("xlsx");

// Spalten-Layout, wie beim Template-Bau festgelegt:
// A=Nr. | B=Klausel | C=Anforderung | D=Befund | E=Status | F=Maßnahme | G=Verantwortlich | H=Frist
const COL = { NR: "A", BEFUND: "D", STATUS: "E", MASSNAHME: "F" };

const METADATA_LABELS = {
  de: { company: "Unternehmen:", documents: "Analysierte Dokumente:", date: "Stand:" },
  en: { company: "Company:", documents: "Documents analyzed:", date: "Date:" },
  fr: { company: "Entreprise :", documents: "Documents analysés :", date: "Date :" },
};

/**
 * Findet in der gesamten Sheet die Zellkoordinate, deren Wert exakt `nr` entspricht.
 * @returns {string|null} z.B. "A23"
 */
function findRowByNr(sheet, nr) {
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cellRef = `${COL.NR}${r + 1}`;
    const cell = sheet[cellRef];
    if (cell && cell.v === nr) {
      return r + 1; // 1-basierte Zeilennummer
    }
  }
  return null;
}

/**
 * Findet die Zeile, die IRGENDWO eine Zelle enthält, deren Wert mit dem
 * gegebenen Label beginnt, und gibt Zeile + Spaltenbuchstabe der Fundstelle zurück.
 * (Nicht auf Spalte A beschränkt, da "Analysierte Dokumente:"/"Stand:" in
 * Spalte E bzw. G liegen, siehe Metadaten-Zeile im Template.)
 */
function findLabelCell(sheet, label) {
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[ref];
      if (cell && typeof cell.v === "string" && cell.v.trim().startsWith(label.trim())) {
        return { row: r + 1, col: XLSX.utils.encode_col(c) };
      }
    }
  }
  return null;
}

function setCell(sheet, ref, value) {
  sheet[ref] = { t: "s", v: value };
}

/**
 * Füllt ein geladenes Template-Workbook mit den KI-Ergebnissen.
 *
 * @param {Buffer} templateBuffer – Rohinhalt der xlsx-Template-Datei
 * @param {Record<string, Array<{nr:string, befund:string, status:string, massnahme:string}>>} resultsByNorm
 *   z.B. { "9001": [...], "14001": [...] } – nur die tatsächlich geprüften Normen
 * @param {{ company?: string, documents?: string[], date?: string }} metadata
 * @param {"de"|"en"|"fr"} lang
 * @returns {Buffer} – fertige xlsx-Datei als Buffer
 */
function fillGapAnalysisTemplate(templateBuffer, resultsByNorm, metadata = {}, lang = "de") {
  const workbook = XLSX.read(templateBuffer, { type: "buffer", cellFormula: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const notFound = [];

  for (const [normKey, results] of Object.entries(resultsByNorm)) {
    for (const entry of results) {
      const rowNum = findRowByNr(sheet, entry.nr);
      if (rowNum === null) {
        notFound.push(entry.nr);
        continue;
      }
      setCell(sheet, `${COL.BEFUND}${rowNum}`, entry.befund);
      setCell(sheet, `${COL.STATUS}${rowNum}`, entry.status);
      setCell(sheet, `${COL.MASSNAHME}${rowNum}`, entry.massnahme || "");
    }
  }

  if (notFound.length > 0) {
    // Nicht stillschweigend ignorieren: Wenn eine Nr. im Template fehlt, stimmt
    // die Klausel-Referenz (clauseReference.js) nicht mehr mit dem Template überein.
    throw new Error(
      `Folgende Klausel-Nummern wurden im Template nicht gefunden: ${notFound.join(", ")}. ` +
      `Vermutlich ist das Template nicht mehr synchron mit clauseReference.js.`
    );
  }

  // Metadaten (Unternehmen, Dokumente, Datum) in die vorbereiteten Label-Zeilen schreiben
  const labels = METADATA_LABELS[lang] || METADATA_LABELS.de;

  if (metadata.company) {
    const hit = findLabelCell(sheet, labels.company);
    if (hit) setCell(sheet, `${hit.col}${hit.row}`, `${labels.company} ${metadata.company}`);
  }
  if (metadata.documents && metadata.documents.length > 0) {
    const hit = findLabelCell(sheet, labels.documents);
    if (hit) setCell(sheet, `${hit.col}${hit.row}`, `${labels.documents} ${metadata.documents.join(", ")}`);
  }
  if (metadata.date) {
    const hit = findLabelCell(sheet, labels.date);
    if (hit) setCell(sheet, `${hit.col}${hit.row}`, `${labels.date} ${metadata.date}`);
  }

  // Erzwingt, dass Excel/LibreOffice beim Öffnen ALLE Formeln neu berechnet
  // (u.a. die COUNTIF/SUM-Formeln in der Zusammenfassung) statt die im Template
  // gecachten Werte (aktuell 0, da leer erzeugt) unverändert anzuzeigen.
  workbook.Workbook = workbook.Workbook || {};
  workbook.Workbook.CalcPr = { fullCalcOnLoad: true };

  const outBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return outBuffer;
}

module.exports = { fillGapAnalysisTemplate, findRowByNr, findLabelCell };
