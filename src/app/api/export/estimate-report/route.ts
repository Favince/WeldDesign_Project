import { calculateWeldEstimate, formatRupiah } from "@/lib/estimator";

export async function GET() {
  const estimate = calculateWeldEstimate({
    material: "Mild Steel",
    thicknessMm: 6,
    lengthMm: 4200,
    weldType: "SMAW",
    quantity: 8,
    location: "On-site",
    urgency: "Normal",
  });

  const lines = [
    "WeldDesign Production",
    "Laporan Estimasi Biaya",
    `Total: ${formatRupiah(estimate.totalCost)}`,
    `Bahan las: ${estimate.consumableKg} kg`,
    `Tenaga kerja: ${estimate.laborHours} jam`,
    `Durasi: ${estimate.durationDays} hari`,
    `Per unit: ${formatRupiah(estimate.unitCost)}`,
  ];

  return new Response(createSimplePdf(lines), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="weld-estimate-report.pdf"',
    },
  });
}

function createSimplePdf(lines: string[]) {
  const escapedLines = lines.map((line) =>
    line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)"),
  );
  const textCommands = escapedLines
    .map((line, index) => `BT /F1 14 Tf 72 ${760 - index * 28} Td (${line}) Tj ET`)
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${textCommands.length} >>\nstream\n${textCommands}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}
