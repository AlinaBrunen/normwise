/**
 * NormWise – Gap-Analyse: Klausel-Referenzdaten
 *
 * WICHTIG: Diese Liste ist die "single source of truth" für Norm, Klausel und
 * Anforderung. Sie MUSS mit den drei Excel-Templates (DE/EN/FR) übereinstimmen.
 * Die KI bekommt diese Zeilen als feste Vorgabe und darf sie nicht verändern,
 * ergänzen oder auslassen — sie füllt ausschließlich "befund", "status" und
 * optional "massnahme" pro Zeile.
 */

const CLAUSES = {
  "9001": [
    { klausel: "4.1", de: "Verstehen der Organisation und ihres Kontexts (relevante interne/externe Themen)", en: "Understanding the organization and its context (relevant internal/external issues)", fr: "Compréhension de l'organisme et de son contexte (enjeux internes/externes pertinents)" },
    { klausel: "4.2", de: "Verstehen der Erfordernisse und Erwartungen interessierter Parteien", en: "Understanding the needs and expectations of interested parties", fr: "Compréhension des besoins et attentes des parties intéressées" },
    { klausel: "4.3", de: "Festlegung des Anwendungsbereichs des QMS", en: "Determining the scope of the QMS", fr: "Détermination du domaine d'application du SMQ" },
    { klausel: "4.4", de: "QMS und seine Prozesse (Prozessmodell, Wechselwirkungen, Verantwortlichkeiten)", en: "QMS and its processes (process model, interactions, responsibilities)", fr: "SMQ et ses processus (modèle de processus, interactions, responsabilités)" },
    { klausel: "5.1", de: "Führung und Verpflichtung der obersten Leitung zum QMS", en: "Leadership and commitment of top management to the QMS", fr: "Leadership et engagement de la direction envers le SMQ" },
    { klausel: "5.1.2", de: "Kundenorientierung", en: "Customer focus", fr: "Orientation client" },
    { klausel: "5.2", de: "Qualitätspolitik (schriftlich, kommuniziert, verfügbar)", en: "Quality policy (documented, communicated, available)", fr: "Politique qualité (écrite, communiquée, disponible)" },
    { klausel: "5.3", de: "Rollen, Verantwortlichkeiten und Befugnisse in der Organisation", en: "Organizational roles, responsibilities and authorities", fr: "Rôles, responsabilités et autorités au sein de l'organisme" },
    { klausel: "6.1", de: "Maßnahmen zum Umgang mit Risiken und Chancen", en: "Actions to address risks and opportunities", fr: "Actions à mettre en œuvre face aux risques et opportunités" },
    { klausel: "6.2", de: "Qualitätsziele und Planung zu deren Erreichung (messbar, terminiert)", en: "Quality objectives and planning to achieve them (measurable, time-bound)", fr: "Objectifs qualité et planification pour les atteindre (mesurables, datés)" },
    { klausel: "6.3", de: "Planung von Änderungen am QMS", en: "Planning of changes to the QMS", fr: "Planification des modifications du SMQ" },
    { klausel: "7.1", de: "Ressourcen (Personal, Infrastruktur, Arbeitsumgebung, Überwachungs-/Messmittel, Wissen)", en: "Resources (people, infrastructure, work environment, monitoring/measuring equipment, knowledge)", fr: "Ressources (personnel, infrastructure, environnement de travail, équipements de surveillance/mesure, connaissances)" },
    { klausel: "7.2", de: "Kompetenz (Qualifikation, Schulung, Nachweise)", en: "Competence (qualification, training, records)", fr: "Compétences (qualification, formation, preuves)" },
    { klausel: "7.3", de: "Bewusstsein der Mitarbeitenden für Politik, Ziele und ihren Beitrag", en: "Awareness of employees regarding policy, objectives and their contribution", fr: "Sensibilisation du personnel à la politique, aux objectifs et à sa contribution" },
    { klausel: "7.4", de: "Interne und externe Kommunikation zum QMS", en: "Internal and external communication on the QMS", fr: "Communication interne et externe relative au SMQ" },
    { klausel: "7.5", de: "Dokumentierte Information (Lenkung, Erstellung, Aktualisierung)", en: "Documented information (control, creation, updating)", fr: "Informations documentées (maîtrise, création, mise à jour)" },
    { klausel: "8.1", de: "Betriebliche Planung und Steuerung", en: "Operational planning and control", fr: "Planification et maîtrise opérationnelles" },
    { klausel: "8.2", de: "Anforderungen an Produkte und Dienstleistungen", en: "Requirements for products and services", fr: "Exigences relatives aux produits et services" },
    { klausel: "8.3", de: "Entwicklung von Produkten und Dienstleistungen", en: "Design and development of products and services", fr: "Conception et développement des produits et services" },
    { klausel: "8.4", de: "Steuerung extern bereitgestellter Prozesse/Produkte/DL (Lieferantenbewertung)", en: "Control of externally provided processes/products/services (supplier evaluation)", fr: "Maîtrise des processus/produits/services fournis par des prestataires externes (évaluation des fournisseurs)" },
    { klausel: "8.5", de: "Produktion und Dienstleistungserbringung", en: "Production and service provision", fr: "Production et prestation de service" },
    { klausel: "8.6", de: "Freigabe von Produkten und Dienstleistungen", en: "Release of products and services", fr: "Libération des produits et services" },
    { klausel: "8.7", de: "Steuerung nichtkonformer Ergebnisse", en: "Control of nonconforming outputs", fr: "Maîtrise des éléments de sortie non conformes" },
    { klausel: "9.1", de: "Überwachung, Messung, Analyse und Bewertung (KPI-System, Kundenzufriedenheit)", en: "Monitoring, measurement, analysis and evaluation (KPI system, customer satisfaction)", fr: "Surveillance, mesure, analyse et évaluation (système d'indicateurs, satisfaction client)" },
    { klausel: "9.2", de: "Internes Audit (Programm, Plan, Durchführung, Berichte)", en: "Internal audit (program, plan, execution, reports)", fr: "Audit interne (programme, plan, réalisation, rapports)" },
    { klausel: "9.3", de: "Managementbewertung (Eingaben, Ergebnisse, Protokoll)", en: "Management review (inputs, outputs, minutes)", fr: "Revue de direction (éléments d'entrée, résultats, compte-rendu)" },
    { klausel: "10.1", de: "Allgemeines zur Verbesserung", en: "General (improvement)", fr: "Généralités (amélioration)" },
    { klausel: "10.2", de: "Nichtkonformität und Korrekturmaßnahmen", en: "Nonconformity and corrective action", fr: "Non-conformité et action corrective" },
    { klausel: "10.3", de: "Fortlaufende Verbesserung des QMS", en: "Continual improvement of the QMS", fr: "Amélioration continue du SMQ" },
  ],
  "14001": [
    { klausel: "4.1", de: "Verstehen der Organisation und ihres Kontexts (Umweltbedingungen einbeziehen)", en: "Understanding the organization and its context (including environmental conditions)", fr: "Compréhension de l'organisme et de son contexte (en intégrant les conditions environnementales)" },
    { klausel: "4.2", de: "Verstehen der Erfordernisse und Erwartungen interessierter Parteien (inkl. bindende Verpflichtungen)", en: "Understanding the needs and expectations of interested parties (incl. compliance obligations)", fr: "Compréhension des besoins et attentes des parties intéressées (y compris les obligations de conformité)" },
    { klausel: "4.3", de: "Festlegung des Anwendungsbereichs des Umweltmanagementsystems", en: "Determining the scope of the environmental management system", fr: "Détermination du domaine d'application du système de management environnemental" },
    { klausel: "4.4", de: "Umweltmanagementsystem und seine Prozesse", en: "Environmental management system and its processes", fr: "Système de management environnemental et ses processus" },
    { klausel: "5.1", de: "Führung und Verpflichtung der obersten Leitung", en: "Leadership and commitment of top management", fr: "Leadership et engagement de la direction" },
    { klausel: "5.2", de: "Umweltpolitik (schriftlich, unterzeichnet, kommuniziert)", en: "Environmental policy (documented, signed, communicated)", fr: "Politique environnementale (écrite, signée, communiquée)" },
    { klausel: "5.3", de: "Rollen, Verantwortlichkeiten und Befugnisse", en: "Roles, responsibilities and authorities", fr: "Rôles, responsabilités et autorités" },
    { klausel: "6.1.1", de: "Allgemeines zu Risiken und Chancen", en: "General (risks and opportunities)", fr: "Généralités (risques et opportunités)" },
    { klausel: "6.1.2", de: "Umweltaspekte (Ermittlung, Bewertungsmatrix, signifikante Aspekte)", en: "Environmental aspects (identification, evaluation matrix, significant aspects)", fr: "Aspects environnementaux (identification, matrice d'évaluation, aspects significatifs)" },
    { klausel: "6.1.3", de: "Bindende Verpflichtungen (Rechtskataster mit Gesetzen/Vorschriften)", en: "Compliance obligations (legal register with applicable laws/regulations)", fr: "Obligations de conformité (registre juridique des lois/réglementations applicables)" },
    { klausel: "6.1.4", de: "Planung von Maßnahmen zum Umgang mit Risiken/Chancen und bindenden Verpflichtungen", en: "Planning action to address risks/opportunities and compliance obligations", fr: "Planification d'actions face aux risques/opportunités et obligations de conformité" },
    { klausel: "6.2.1", de: "Umweltziele (messbar, dokumentiert)", en: "Environmental objectives (measurable, documented)", fr: "Objectifs environnementaux (mesurables, documentés)" },
    { klausel: "6.2.2", de: "Planung von Maßnahmen zur Erreichung der Umweltziele", en: "Planning actions to achieve environmental objectives", fr: "Planification des actions pour atteindre les objectifs environnementaux" },
    { klausel: "7.1", de: "Ressourcen", en: "Resources", fr: "Ressources" },
    { klausel: "7.2", de: "Kompetenz (Umweltschulungen, Nachweise)", en: "Competence (environmental training, records)", fr: "Compétences (formations environnementales, preuves)" },
    { klausel: "7.3", de: "Bewusstsein für Umweltpolitik und -auswirkungen", en: "Awareness of environmental policy and impacts", fr: "Sensibilisation à la politique environnementale et aux impacts" },
    { klausel: "7.4", de: "Kommunikation (intern/extern zu Umweltthemen)", en: "Communication (internal/external on environmental matters)", fr: "Communication (interne/externe sur les questions environnementales)" },
    { klausel: "7.5", de: "Dokumentierte Information", en: "Documented information", fr: "Informations documentées" },
    { klausel: "8.1", de: "Betriebliche Planung und Steuerung (Arbeitsanweisungen, Betriebsstandards)", en: "Operational planning and control (work instructions, operating standards)", fr: "Planification et maîtrise opérationnelles (instructions de travail, standards)" },
    { klausel: "8.2", de: "Notfallvorsorge und Gefahrenabwehr (Notfallplan, Übungen)", en: "Emergency preparedness and response (emergency plan, drills)", fr: "Préparation et réponse aux situations d'urgence (plan d'urgence, exercices)" },
    { klausel: "9.1.1", de: "Überwachung, Messung, Analyse und Bewertung – Allgemeines (Umwelt-KPIs)", en: "Monitoring, measurement, analysis and evaluation – General (environmental KPIs)", fr: "Surveillance, mesure, analyse et évaluation – Généralités (indicateurs environnementaux)" },
    { klausel: "9.1.2", de: "Bewertung der Einhaltung bindender Verpflichtungen", en: "Evaluation of compliance with compliance obligations", fr: "Évaluation de la conformité aux obligations de conformité" },
    { klausel: "9.2", de: "Internes Audit (Umwelt-Auditprogramm)", en: "Internal audit (environmental audit program)", fr: "Audit interne (programme d'audit environnemental)" },
    { klausel: "9.3", de: "Managementbewertung Umwelt", en: "Management review – environment", fr: "Revue de direction – environnement" },
    { klausel: "10.1", de: "Allgemeines zur Verbesserung", en: "General (improvement)", fr: "Généralités (amélioration)" },
    { klausel: "10.2", de: "Nichtkonformität und Korrekturmaßnahmen", en: "Nonconformity and corrective action", fr: "Non-conformité et action corrective" },
    { klausel: "10.3", de: "Fortlaufende Verbesserung", en: "Continual improvement", fr: "Amélioration continue" },
  ],
  "45001": [
    { klausel: "4.1", de: "Verstehen der Organisation und ihres Kontexts", en: "Understanding the organization and its context", fr: "Compréhension de l'organisme et de son contexte" },
    { klausel: "4.2", de: "Verstehen der Erfordernisse und Erwartungen von Beschäftigten und interessierten Parteien", en: "Understanding the needs and expectations of workers and other interested parties", fr: "Compréhension des besoins et attentes des travailleurs et autres parties intéressées" },
    { klausel: "4.3", de: "Festlegung des Anwendungsbereichs des OH&S-Managementsystems", en: "Determining the scope of the OH&S management system", fr: "Détermination du domaine d'application du système de management S&ST" },
    { klausel: "4.4", de: "OH&S-Managementsystem und seine Prozesse", en: "OH&S management system and its processes", fr: "Système de management S&ST et ses processus" },
    { klausel: "5.1", de: "Führung und Verpflichtung der obersten Leitung", en: "Leadership and commitment of top management", fr: "Leadership et engagement de la direction" },
    { klausel: "5.2", de: "OH&S-Politik (schriftlich, unterzeichnet, datiert)", en: "OH&S policy (documented, signed, dated)", fr: "Politique S&ST (écrite, signée, datée)" },
    { klausel: "5.3", de: "Rollen, Verantwortlichkeiten, Befugnisse und Rechenschaftspflicht", en: "Organizational roles, responsibilities, authorities and accountabilities", fr: "Rôles, responsabilités, autorités et obligations de rendre compte" },
    { klausel: "5.4", de: "Konsultation und Beteiligung der Beschäftigten", en: "Consultation and participation of workers", fr: "Consultation et participation des travailleurs" },
    { klausel: "6.1.1", de: "Allgemeines zu Maßnahmen für Risiken und Chancen", en: "General (actions to address risks and opportunities)", fr: "Généralités (actions face aux risques et opportunités)" },
    { klausel: "6.1.2.1", de: "Gefährdungsidentifizierung (tätigkeitsbezogen)", en: "Hazard identification (activity-based)", fr: "Identification des dangers (par activité)" },
    { klausel: "6.1.2.2", de: "Beurteilung von OH&S-Risiken und anderen Risiken für das Managementsystem", en: "Assessment of OH&S risks and other risks to the management system", fr: "Évaluation des risques S&ST et autres risques pour le système de management" },
    { klausel: "6.1.2.3", de: "Beurteilung von OH&S-Chancen und anderen Chancen", en: "Assessment of OH&S opportunities and other opportunities", fr: "Évaluation des opportunités S&ST et autres opportunités" },
    { klausel: "6.1.3", de: "Bestimmung rechtlicher und anderer Verpflichtungen", en: "Determination of legal requirements and other requirements", fr: "Détermination des exigences légales et autres exigences" },
    { klausel: "6.1.4", de: "Planung von Maßnahmen", en: "Planning action", fr: "Planification des actions" },
    { klausel: "6.2.1", de: "OH&S-Ziele (messbar, dokumentiert)", en: "OH&S objectives (measurable, documented)", fr: "Objectifs S&ST (mesurables, documentés)" },
    { klausel: "6.2.2", de: "Planung zur Erreichung der OH&S-Ziele", en: "Planning to achieve OH&S objectives", fr: "Planification pour atteindre les objectifs S&ST" },
    { klausel: "7.1", de: "Ressourcen", en: "Resources", fr: "Ressources" },
    { klausel: "7.2", de: "Kompetenz (Sicherheitsunterweisungen, Nachweise)", en: "Competence (safety training, records)", fr: "Compétences (formations sécurité, preuves)" },
    { klausel: "7.3", de: "Bewusstsein", en: "Awareness", fr: "Sensibilisation" },
    { klausel: "7.4", de: "Kommunikation (intern/extern zu OH&S-Themen)", en: "Communication (internal/external on OH&S matters)", fr: "Communication (interne/externe sur les questions S&ST)" },
    { klausel: "7.5", de: "Dokumentierte Information", en: "Documented information", fr: "Informations documentées" },
    { klausel: "8.1.1", de: "Betriebliche Planung und Steuerung – Allgemeines", en: "Operational planning and control – General", fr: "Planification et maîtrise opérationnelles – Généralités" },
    { klausel: "8.1.2", de: "Beseitigung von Gefährdungen und Minimierung von OH&S-Risiken (Hierarchie der Maßnahmen)", en: "Eliminating hazards and reducing OH&S risks (hierarchy of controls)", fr: "Élimination des dangers et réduction des risques S&ST (hiérarchie des mesures de prévention)" },
    { klausel: "8.1.3", de: "Änderungsmanagement (Management of Change)", en: "Management of change", fr: "Gestion du changement" },
    { klausel: "8.1.4", de: "Beschaffung (inkl. Auftragnehmer, Ausgliederung)", en: "Procurement (incl. contractors, outsourcing)", fr: "Achats (y compris sous-traitants, externalisation)" },
    { klausel: "8.2", de: "Notfallvorsorge und -reaktion", en: "Emergency preparedness and response", fr: "Préparation et réponse aux situations d'urgence" },
    { klausel: "9.1.1", de: "Überwachung, Messung, Analyse und Leistungsbewertung", en: "Monitoring, measurement, analysis and performance evaluation", fr: "Surveillance, mesure, analyse et évaluation de la performance" },
    { klausel: "9.1.2", de: "Bewertung der Einhaltung rechtlicher und anderer Verpflichtungen", en: "Evaluation of compliance with legal and other requirements", fr: "Évaluation de la conformité aux exigences légales et autres exigences" },
    { klausel: "9.2", de: "Internes Audit (OH&S-Auditprogramm)", en: "Internal audit (OH&S audit program)", fr: "Audit interne (programme d'audit S&ST)" },
    { klausel: "9.3", de: "Managementbewertung", en: "Management review", fr: "Revue de direction" },
    { klausel: "10.1", de: "Allgemeines zur Verbesserung", en: "General (improvement)", fr: "Généralités (amélioration)" },
    { klausel: "10.2", de: "Vorfälle, Nichtkonformitäten und Korrekturmaßnahmen", en: "Incident, nonconformity and corrective action", fr: "Incidents, non-conformités et actions correctives" },
    { klausel: "10.3", de: "Fortlaufende Verbesserung", en: "Continual improvement", fr: "Amélioration continue" },
  ],
};

const NORM_PREFIX = { "9001": "Q", "14001": "U", "45001": "S" };
const NORM_LABEL = {
  "9001": "ISO 9001:2015",
  "14001": "ISO 14001:2015",
  "45001": "ISO 45001:2018",
};

/**
 * Gibt die Klauselliste einer Norm in einer Sprache zurück, inkl. fester Nr. (Q-01, U-01, S-01…).
 * @param {"9001"|"14001"|"45001"} norm
 * @param {"de"|"en"|"fr"} lang
 * @returns {Array<{ nr: string, klausel: string, anforderung: string }>}
 */
function getClauses(norm, lang = "de") {
  const list = CLAUSES[norm];
  if (!list) throw new Error(`Unbekannte Norm: ${norm}`);
  const prefix = NORM_PREFIX[norm];
  return list.map((c, i) => ({
    nr: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    klausel: c.klausel,
    anforderung: c[lang] || c.de,
  }));
}

module.exports = { CLAUSES, NORM_PREFIX, NORM_LABEL, getClauses };
