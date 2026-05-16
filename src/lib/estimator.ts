export const materials = [
  "Mild Steel",
  "Stainless Steel",
  "Aluminum",
  "Galvanized Steel",
] as const;

export const weldTypes = ["SMAW", "GMAW", "GTAW", "FCAW"] as const;
export const projectLocations = ["Workshop", "On-site", "Remote site"] as const;
export const urgencyLevels = ["Normal", "Rush"] as const;

export type Material = (typeof materials)[number];
export type WeldType = (typeof weldTypes)[number];
export type ProjectLocation = (typeof projectLocations)[number];
export type UrgencyLevel = (typeof urgencyLevels)[number];

export type EstimateInput = {
  material: Material;
  thicknessMm: number;
  lengthMm: number;
  weldType: WeldType;
  quantity: number;
  location: ProjectLocation;
  urgency: UrgencyLevel;
};

export type EstimateResult = {
  consumableKg: number;
  laborHours: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  logisticsCost: number;
  totalCost: number;
  unitCost: number;
  durationDays: number;
};

const materialRate: Record<Material, number> = {
  "Mild Steel": 38000,
  "Stainless Steel": 76000,
  Aluminum: 92000,
  "Galvanized Steel": 54000,
};

const weldEfficiency: Record<WeldType, number> = {
  SMAW: 1,
  GMAW: 0.82,
  GTAW: 1.35,
  FCAW: 0.9,
};

const locationMultiplier: Record<ProjectLocation, number> = {
  Workshop: 1,
  "On-site": 1.18,
  "Remote site": 1.32,
};

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateWeldEstimate(input: EstimateInput): EstimateResult {
  const normalizedLength = Math.max(input.lengthMm, 1) / 1000;
  const normalizedThickness = Math.max(input.thicknessMm, 1);
  const normalizedQuantity = Math.max(input.quantity, 1);
  const weldFactor = weldEfficiency[input.weldType];
  const locationFactor = locationMultiplier[input.location];
  const rushFactor = input.urgency === "Rush" ? 1.16 : 1;

  const consumableKg =
    normalizedLength * normalizedThickness * 0.105 * normalizedQuantity * weldFactor;
  const laborHours =
    normalizedLength * normalizedThickness * 0.18 * normalizedQuantity * weldFactor;
  const materialCost = consumableKg * materialRate[input.material];
  const laborCost = laborHours * 65000 * locationFactor * rushFactor;
  const overheadCost = (materialCost + laborCost) * 0.18;
  const logisticsCost = input.location === "Workshop" ? 125000 : 475000 * locationFactor;
  const totalCost = (materialCost + laborCost + overheadCost + logisticsCost) * rushFactor;

  return {
    consumableKg: round(consumableKg, 2),
    laborHours: round(laborHours, 1),
    materialCost: Math.round(materialCost),
    laborCost: Math.round(laborCost),
    overheadCost: Math.round(overheadCost),
    logisticsCost: Math.round(logisticsCost),
    totalCost: Math.round(totalCost),
    unitCost: Math.round(totalCost / normalizedQuantity),
    durationDays: Math.max(1, Math.ceil(laborHours / 7)),
  };
}

function round(value: number, precision: number) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
