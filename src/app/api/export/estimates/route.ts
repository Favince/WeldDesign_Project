import { sampleEstimates } from "@/lib/weld-data";

export async function GET() {
  const rows = [
    [
      "Project",
      "Material",
      "Jenis Las",
      "Jumlah",
      "Lokasi",
      "Bahan Kg",
      "Jam Kerja",
      "Total IDR",
    ],
    ...sampleEstimates.map((estimate) => [
      estimate.project,
      estimate.input.material,
      estimate.input.weldType,
      estimate.input.quantity,
      estimate.input.location,
      estimate.result.consumableKg,
      estimate.result.laborHours,
      estimate.result.totalCost,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="weld-estimates.csv"',
    },
  });
}

function csvCell(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}
