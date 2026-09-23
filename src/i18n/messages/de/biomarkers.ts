import type { BiomarkerCopyMap } from '../../biomarkerIds';

export const biomarkers: BiomarkerCopyMap = {
  albumin: {
    name: 'Serumalbumin',
    shortName: 'Albumin',
    domain: 'Hepatische / nutritive Synthese',
    risk: 'Negativ (schützend)',
    weight: 'Eine starke Leberfunktion und geringe Gebrechlichkeit verlangsamen das biologische Altern.',
  },
  creatinine: {
    name: 'Serumkreatinin',
    shortName: 'Kreatinin',
    domain: 'Renale Filtration',
    risk: 'Positiv (beschleunigend)',
    weight: 'Höheres Kreatinin weist auf eine geringere glomeruläre Filtration und eine muskuläre Belastungslast hin.',
  },
  glucose: {
    name: 'Nüchtern-Serumglukose',
    shortName: 'Nüchternglukose',
    domain: 'Stoffwechsel / Insulinsensitivität',
    risk: 'Positiv (beschleunigend)',
    weight: 'Erhöhte Nüchternglykämie geht mit fortgeschrittenen Glykierungsendprodukten einher.',
  },
  crp: {
    name: 'hs-C-reaktives Protein',
    shortName: 'hs-CRP',
    domain: 'Systemische sterile Entzündung',
    risk: 'Stark positiv',
    weight: 'Logarithmischer Treiber systemischen Inflammagings und arterieller Steifigkeit.',
  },
  lymphocyte: {
    name: 'Lymphozytenanteil',
    shortName: 'Lymphozyten',
    domain: 'Gleichgewicht der Immunseneszenz',
    risk: 'Negativ (schützend)',
    weight: 'Eine erhaltene lymphatische Linie gegenüber myeloischer Expansion spricht für eine junge Immunität.',
  },
  mcv: {
    name: 'Mittleres Erythrozytenvolumen (MCV)',
    shortName: 'MCV',
    domain: 'Hämatologie und Methylierung',
    risk: 'Positiv (beschleunigend)',
    weight: 'Eine Erythrozyten-Makrozytose hängt mit gestörter Folat-/B12-Methylierung zusammen.',
  },
  rdw: {
    name: 'Erythrozytenverteilungsbreite (RDW)',
    shortName: 'RDW',
    domain: 'Erythrozytenumsatz / Frailty',
    risk: 'Stark positiv',
    weight: 'Eine hohe Anisozytose gehört in NHANES zu den stärksten Markern der Gesamtmortalität.',
  },
  alp: {
    name: 'Alkalische Phosphatase (ALP)',
    shortName: 'AP',
    domain: 'Biliär / Knochenmineralisation',
    risk: 'Positiv (beschleunigend)',
    weight: 'Marker für Gefäßverkalkung, hepatischen Stress und den Umbau des Knochenstoffwechsels.',
  },
  wbc: {
    name: 'Leukozytenzahl (WBC)',
    shortName: 'Leukozyten',
    domain: 'Aktivierung der angeborenen Immunität',
    risk: 'Positiv (beschleunigend)',
    weight: 'Eine erhöhte Leukozytenzahl in Ruhe weist auf eine anhaltende, nicht abklingende Entzündung hin.',
  },
};
