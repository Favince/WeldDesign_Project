import { calculateWeldEstimate, type EstimateInput } from "@/lib/estimator";

export const dashboardStats = [
  {
    label: "Project aktif",
    value: "18",
    delta: "+4 minggu ini",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  {
    label: "Estimasi bulan ini",
    value: "Rp 184,6 jt",
    delta: "42 dokumen",
    tone: "border-amber-300 bg-amber-50 text-amber-950",
  },
  {
    label: "Stok kritis",
    value: "7",
    delta: "Elektroda dan gas",
    tone: "border-red-300 bg-red-50 text-red-950",
  },
  {
    label: "AI scan",
    value: "126",
    delta: "91% lolos QC",
    tone: "border-cyan-300 bg-cyan-50 text-cyan-950",
  },
] as const;

export const featureModules = [
  {
    id: "security",
    title: "Security & User",
    owner: "Admin",
    status: "Ready scaffold",
    metric: "4 role RBAC",
  },
  {
    id: "estimator",
    title: "Estimasi Biaya",
    owner: "Guru",
    status: "Live calculator",
    metric: "PDF/Excel-ready",
  },
  {
    id: "inventory",
    title: "Inventaris",
    owner: "Admin",
    status: "Maintenance queue",
    metric: "7 stok kritis",
  },
  {
    id: "projects",
    title: "Monitoring Proyek",
    owner: "Guru",
    status: "Approval flow",
    metric: "18 aktif",
  },
  {
    id: "ai-weld",
    title: "AI Identifikasi Las",
    owner: "Siswa",
    status: "Mock inference",
    metric: "Confidence score",
  },
  {
    id: "design",
    title: "AI Generator DKV",
    owner: "Siswa",
    status: "Prompt studio",
    metric: "Poster/blueprint",
  },
  {
    id: "portfolio",
    title: "Portofolio Siswa",
    owner: "Siswa",
    status: "CV-style",
    metric: "Public link",
  },
  {
    id: "gallery",
    title: "Galeri Digital",
    owner: "Publik",
    status: "Moderated",
    metric: "Like/rating",
  },
  {
    id: "social",
    title: "Sosial Media",
    owner: "Admin",
    status: "Schedule queue",
    metric: "IG/TikTok",
  },
  {
    id: "learning",
    title: "E-Learning",
    owner: "Guru",
    status: "Quiz module",
    metric: "3 materi",
  },
  {
    id: "analytics",
    title: "Analytics",
    owner: "Admin",
    status: "Dashboard",
    metric: "Biaya rata-rata",
  },
  {
    id: "mobile",
    title: "PWA & AR Preview",
    owner: "Client",
    status: "Roadmap",
    metric: "Android/iOS",
  },
] as const;

export const projectStages = [
  {
    name: "Survey lokasi",
    owner: "Client",
    progress: 100,
    start: "13 Mei",
    end: "14 Mei",
    state: "Approved",
  },
  {
    name: "Pemotongan material",
    owner: "Siswa",
    progress: 78,
    start: "15 Mei",
    end: "17 Mei",
    state: "On track",
  },
  {
    name: "Root pass SMAW",
    owner: "Guru",
    progress: 52,
    start: "18 Mei",
    end: "20 Mei",
    state: "QC watch",
  },
  {
    name: "Finishing dan cat",
    owner: "Siswa",
    progress: 18,
    start: "21 Mei",
    end: "23 Mei",
    state: "Waiting",
  },
] as const;

export const inventoryItems = [
  {
    code: "WLD-TRF-018",
    name: "Trafo las SMAW 300A",
    condition: "Baik",
    location: "Workshop A",
    age: "2,1 th",
    stock: "Ready",
  },
  {
    code: "MAT-ELK-7018",
    name: "Elektroda E7018 3.2mm",
    condition: "Kritis",
    location: "Gudang B",
    age: "Stok",
    stock: "12 kg",
  },
  {
    code: "PPE-HLM-044",
    name: "Helm auto darkening",
    condition: "Service",
    location: "QC room",
    age: "3,4 th",
    stock: "6 unit",
  },
  {
    code: "GAS-ARG-022",
    name: "Tabung argon",
    condition: "Baik",
    location: "Gudang gas",
    age: "Isi ulang",
    stock: "3 tabung",
  },
] as const;

export const maintenanceEvents = [
  { date: "20 Mei", title: "Kalibrasi clamp meter", assignee: "Admin" },
  { date: "22 Mei", title: "Inspeksi kabel massa", assignee: "Guru" },
  { date: "25 Mei", title: "Refill argon dan CO2", assignee: "Admin" },
] as const;

export const scanSamples = [
  {
    title: "Fillet weld corner joint",
    result: "Undercut ringan",
    confidence: 87,
    recommendation: "Turunkan travel speed dan ulang pass tipis pada sisi toe.",
  },
  {
    title: "Butt joint root pass",
    result: "Porosity spot",
    confidence: 82,
    recommendation: "Bersihkan permukaan, cek kelembapan elektroda, dan rescan.",
  },
  {
    title: "Lap joint GMAW",
    result: "Accepted",
    confidence: 94,
    recommendation: "Masuk tahap finishing, simpan foto sebagai bukti QC.",
  },
] as const;

export const socialPosts = [
  {
    platform: "Instagram",
    time: "Sabtu 18.30",
    caption: "Progress railing tangga client portal",
    engagement: "8,4%",
  },
  {
    platform: "TikTok",
    time: "Minggu 10.00",
    caption: "Before-after meja fabrikasi siswa",
    engagement: "11,2%",
  },
  {
    platform: "Instagram",
    time: "Senin 07.15",
    caption: "Poster safety welding DKV",
    engagement: "6,9%",
  },
] as const;

export const portfolioItems = [
  {
    student: "Raka Pratama",
    major: "Teknik Las",
    title: "Kanopi hollow minimalis",
    rating: 4.8,
    year: "2026",
  },
  {
    student: "Nadia Safira",
    major: "DKV",
    title: "Poster safety SMAW",
    rating: 4.7,
    year: "2026",
  },
  {
    student: "Dimas Arya",
    major: "Teknik Las",
    title: "Workbench mobile",
    rating: 4.9,
    year: "2025",
  },
] as const;

export const learningModules = [
  { title: "Dasar K3 Pengelasan", progress: 88, quiz: "12 soal" },
  { title: "Cacat Las dan QC Visual", progress: 64, quiz: "18 soal" },
  { title: "Branding Proyek DKV", progress: 71, quiz: "10 soal" },
] as const;

export const analyticsRows = [
  { label: "Biaya rata-rata project", value: "Rp 10,2 jt", trend: "+6%" },
  { label: "Waktu pengerjaan rata-rata", value: "6,4 hari", trend: "-12%" },
  { label: "Approval client", value: "93%", trend: "+8%" },
  { label: "Nilai portofolio siswa", value: "4,7/5", trend: "+0,3" },
] as const;

export const chatThreads = [
  { room: "Project Kanopi B-21", unread: 4, last: "Foto root pass sudah masuk" },
  { room: "Guru QC", unread: 2, last: "Butuh approval tahap finishing" },
  { room: "Client Portal", unread: 1, last: "Client menyetujui jadwal survey" },
] as const;

export const auditTrail = [
  {
    actor: "Admin",
    action: "Mengubah role user menjadi Guru",
    time: "09.12",
    risk: "Medium",
  },
  {
    actor: "Guru",
    action: "Approve tahap root pass",
    time: "08.45",
    risk: "Low",
  },
  {
    actor: "System",
    action: "Blokir login gagal 6x",
    time: "07.58",
    risk: "High",
  },
] as const;

const baseEstimate: EstimateInput = {
  material: "Mild Steel",
  thicknessMm: 6,
  lengthMm: 4200,
  weldType: "SMAW",
  quantity: 8,
  location: "On-site",
  urgency: "Normal",
};

export const sampleEstimates = [
  {
    project: "Kanopi Hollow A-12",
    input: baseEstimate,
    result: calculateWeldEstimate(baseEstimate),
  },
  {
    project: "Workbench DKV Lab",
    input: {
      ...baseEstimate,
      material: "Stainless Steel",
      weldType: "GTAW",
      quantity: 4,
      location: "Workshop",
    },
    result: calculateWeldEstimate({
      ...baseEstimate,
      material: "Stainless Steel",
      weldType: "GTAW",
      quantity: 4,
      location: "Workshop",
    }),
  },
] as const;
