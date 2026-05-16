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
    label: "Order client",
    value: "14",
    delta: "6 menunggu approval",
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
    status: "Materi + Google Form",
    metric: "Sheet response",
  },
  {
    id: "analytics",
    title: "Analytics",
    owner: "Admin",
    status: "Google Sheet",
    metric: "CSV-ready",
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
    caption: "Poster safety welding",
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
    major: "Desain Produk",
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
  {
    kind: "Materi",
    title: "Dasar K3 Pengelasan",
    description: "PDF/teks materi K3 untuk siswa sebelum praktik.",
    progress: 88,
    score: 0,
    materialFileName: "dasar-k3-pengelasan.txt",
    materialBody:
      "Dasar K3 Pengelasan: APD lengkap, ventilasi area, pengecekan kabel massa, dan prosedur darurat workshop.",
    formUrl: "",
    sheetUrl: "",
  },
  {
    kind: "Soal",
    title: "Soal Cacat Las dan QC Visual",
    description: "Quiz Google Form dengan koreksi otomatis dan response Sheet.",
    progress: 64,
    score: 80,
    materialFileName: "",
    materialBody: "",
    formUrl: "https://docs.google.com/forms/create",
    sheetUrl: "https://docs.google.com/spreadsheets/create",
  },
  {
    kind: "Materi",
    title: "Dokumentasi Proyek Las",
    description: "Template laporan before-after dan checklist portofolio.",
    progress: 71,
    score: 0,
    materialFileName: "dokumentasi-proyek-las.txt",
    materialBody:
      "Dokumentasi proyek las: foto before-after, catatan material, progres harian, masalah, solusi, dan approval akhir.",
    formUrl: "",
    sheetUrl: "",
  },
] as const;

export const analyticsRows = [
  {
    label: "Order aktif",
    value: "14",
    trend: "6 pending",
    source: "Orders!A:H",
  },
  {
    label: "Progress rata-rata",
    value: "57%",
    trend: "+11%",
    source: "Projects!A:G",
  },
  {
    label: "Masalah aktif",
    value: "3",
    trend: "-2 minggu ini",
    source: "Issues!A:F",
  },
  {
    label: "Approval client",
    value: "93%",
    trend: "+8%",
    source: "Approvals!A:E",
  },
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
    project: "Workbench Lab Las",
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
