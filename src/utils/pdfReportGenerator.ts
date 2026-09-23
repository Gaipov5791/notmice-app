import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HistoricalTestRecord } from '../types';
import { PHENOAGE_BIOMARKERS } from '../data/phenoAgeData';
import { getActiveI18n } from '../i18n/catalog';
import { isBiomarkerId } from '../i18n/biomarkerIds';
import { fill } from '../i18n/fill';

export function generateHistoricalReportPDF(history: HistoricalTestRecord[]): void {
  if (!history || history.length === 0) return;

  const { locale, messages } = getActiveI18n();
  const copy = messages.report;
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-US';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const earliest = sortedHistory[0];
  const latest = sortedHistory[sortedHistory.length - 1];
  const netBioChange = Number((latest.phenoAge - earliest.phenoAge).toFixed(1));
  const netChronoChange = Number((latest.chronologicalAge - earliest.chronologicalAge).toFixed(1));
  const agingPace =
    netChronoChange > 0 ? Number((netBioChange / netChronoChange).toFixed(2)) : 0.82;
  const avgDelta = Number(
    (sortedHistory.reduce((acc, h) => acc + h.delta, 0) / sortedHistory.length).toFixed(1)
  );
  const latestAdvantage = Number(Math.max(0, -latest.delta).toFixed(1));

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner Background
  doc.setFillColor(11, 28, 48); // #0b1c30 deep navy
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent line
  doc.setFillColor(0, 97, 148); // #006194 primary cyan-blue
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(copy.pdfTitle, margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // #cbd5e1
  doc.text(
    copy.pdfSubtitle,
    margin,
    22
  );

  // Top Right Header Metadata
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const printDate = new Date().toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(fill(copy.generatedLine, { date: printDate }), pageWidth - margin, 15, { align: 'right' });
  doc.text(fill(copy.panelsLine, { count: sortedHistory.length }), pageWidth - margin, 21, { align: 'right' });
  doc.text(copy.statusLine, pageWidth - margin, 27, { align: 'right' });

  let currentY = 48;

  // Executive Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 28, 48);
  doc.text(copy.pdfSummary, margin, currentY);

  currentY += 5;

  // Summary Metrics Grid (4 boxes)
  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  const boxHeight = 22;

  const kpis = [
    {
      title: copy.latestPhenoPdf,
      value: fill(copy.yrs, { value: latest.phenoAge.toFixed(1) }),
      sub: `${messages.history.chronoLegend} ${latest.chronologicalAge.toFixed(1)}`,
      color: [0, 105, 71], // emerald
    },
    {
      title: copy.variancePdf,
      value: latest.delta <= 0 ? fill(copy.yrs, { value: latest.delta.toFixed(1) }) : fill(copy.plusYrs, { value: latest.delta.toFixed(1) }),
      sub: latest.delta <= 0 ? copy.decelerated : copy.accelerated,
      color: latest.delta <= 0 ? [0, 105, 71] : [186, 26, 26],
    },
    {
      title: copy.pacePdf,
      value: fill(copy.paceValue, { value: agingPace }),
      sub: agingPace < 1.0 ? copy.slowedPdf : copy.baselineRate,
      color: [0, 97, 148],
    },
    {
      title: copy.avgPdf,
      value: fill(copy.yrs, { value: Math.abs(avgDelta).toFixed(1) }),
      sub: fill(copy.acrossPdf, { count: sortedHistory.length }),
      color: [0, 105, 71],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (boxWidth + 3);
    // Background
    doc.setFillColor(248, 249, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(86, 94, 116);
    doc.text(kpi.title, x + 3, currentY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 12);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, currentY + 18);
  });

  currentY += boxHeight + 8;

  // Historical Panels Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 28, 48);
  doc.text(copy.panelsPdf, margin, currentY);

  currentY += 2;

  const panelRows = sortedHistory.map((item) => {
    const isDecel = item.delta <= 0;
    const deltaStr = isDecel
      ? fill(copy.yrs, { value: item.delta.toFixed(1) })
      : fill(copy.plusYrs, { value: item.delta.toFixed(1) });
    const statusStr = isDecel
      ? fill(copy.deceleratedShort, { value: Math.abs(item.delta).toFixed(1) })
      : copy.acceleratedShort;
    return [
      item.date,
      item.labSource,
      fill(copy.yrs, { value: item.chronologicalAge.toFixed(1) }),
      fill(copy.yrs, { value: item.phenoAge.toFixed(1) }),
      deltaStr,
      statusStr,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[copy.colDate, copy.colLab, copy.colCalendar, copy.colPhenoShort, copy.colVariance, copy.colProfile]],
    body: panelRows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [0, 97, 148],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      1: { cellWidth: 32 },
      2: { cellWidth: 22 },
      3: { fontStyle: 'bold', textColor: [0, 105, 71], cellWidth: 22 },
      4: { fontStyle: 'bold', cellWidth: 22 },
      5: { cellWidth: 34 },
      6: { fontSize: 7, textColor: [100, 116, 139] },
    },
    margin: { left: margin, right: margin },
  });

  // Calculate position after first table
  const afterFirstTable = (doc as any).lastAutoTable.finalY || currentY + 40;
  currentY = afterFirstTable + 7;

  // Longitudinal Biomarker Measurements Matrix Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 28, 48);
  doc.text(copy.matrixPdf, margin, currentY);

  currentY += 2;

  // Header row for biomarkers: Biomarker Name, Domain, Optimal, then columns for each date
  const biomarkerHead = [
    copy.colBiomarker,
    copy.colUnit,
    copy.colOptimalPdf,
    ...sortedHistory.map((h) => h.date),
  ];

  const biomarkerBody = PHENOAGE_BIOMARKERS.map((bio) => {
    const row = [
      isBiomarkerId(bio.id) ? messages.biomarkers[bio.id].name : bio.name,
      bio.unit,
      `${bio.optimalRange[0]} - ${bio.optimalRange[1]}`,
    ];

    sortedHistory.forEach((h) => {
      const val = h.biomarkers ? h.biomarkers[bio.id] : undefined;
      if (val !== undefined && val !== null) {
        row.push(String(val));
      } else {
        row.push('—');
      }
    });

    return row;
  });

  autoTable(doc, {
    startY: currentY,
    head: [biomarkerHead],
    body: biomarkerBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [11, 28, 48],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 16 },
      2: { cellWidth: 26, fontStyle: 'italic', textColor: [0, 105, 71] },
    },
    margin: { left: margin, right: margin },
  });

  const afterSecondTable = (doc as any).lastAutoTable.finalY || currentY + 60;
  currentY = afterSecondTable + 7;

  // Check if we have enough room for clinical interpretation, or add a page
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // Clinical Longevity Interpretation Box
  doc.setFillColor(239, 244, 255); // #eff4ff
  doc.setDrawColor(220, 233, 255);
  const boxH = 34;
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 97, 148);
  doc.text(copy.methodPdf, margin + 3, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const interpretationText = [
    fill(copy.bulletPace, {
      pace: agingPace,
      tone: agingPace < 1.0 ? copy.paceFavorable : copy.paceNormal,
    }),
    copy.bulletMarkers,
    copy.bulletMath,
  ];

  interpretationText.forEach((line, lIdx) => {
    doc.text(line, margin + 3, currentY + 13 + lIdx * 6);
  });

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      copy.footer,
      margin,
      pageHeight - 8
    );
    doc.text(fill(copy.page, { page: i, total: totalPages }), pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Save the PDF
  const filename = `PhenoAge_Longitudinal_Report_${latest.date}.pdf`;
  doc.save(filename);
}
