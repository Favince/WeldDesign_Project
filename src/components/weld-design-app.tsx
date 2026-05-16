"use client";

import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  Bot,
  Calculator,
  Camera,
  ChartNoAxesGantt,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Copy,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  FileText,
  GalleryVerticalEnd,
  GraduationCap,
  HardHat,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Megaphone,
  MessageSquareText,
  Package,
  PenTool,
  Play,
  Plus,
  RefreshCw,
  ScanSearch,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  ThumbsUp,
  Upload,
  UserRound,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import {
  calculateWeldEstimate,
  formatRupiah,
  materials,
  projectLocations,
  urgencyLevels,
  weldTypes,
  type EstimateInput,
  type EstimateResult,
} from "@/lib/estimator";
import {
  canAccess,
  permissions,
  roleLabels,
  rolePermissions,
  roles,
  securityControls,
  type Permission,
  type Role,
} from "@/lib/security";
import {
  analyticsRows,
  auditTrail,
  chatThreads,
  dashboardStats,
  inventoryItems,
  learningModules,
  maintenanceEvents,
  portfolioItems,
  projectStages,
  scanSamples,
  socialPosts,
} from "@/lib/weld-data";

type SectionId =
  | "overview"
  | "security"
  | "estimator"
  | "inventory"
  | "projects"
  | "ai"
  | "design"
  | "portfolio"
  | "gallery"
  | "social"
  | "learning"
  | "analytics"
  | "client"
  | "mobile";

type NavItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  summary: string;
};

const navigation: NavItem[] = [
  {
    id: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:read",
    summary: "Ringkasan produksi, deadline, dan modul prioritas.",
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    permission: "users:manage",
    summary: "RBAC, session policy, OTP, audit log, dan hardening.",
  },
  {
    id: "estimator",
    label: "Estimasi",
    icon: Calculator,
    permission: "estimate:create",
    summary: "Hitung bahan, waktu, tenaga, overhead, dan export.",
  },
  {
    id: "inventory",
    label: "Inventaris",
    icon: Package,
    permission: "inventory:manage",
    summary: "Alat, stok bahan, maintenance, dan laporan kerusakan.",
  },
  {
    id: "projects",
    label: "Proyek",
    icon: ChartNoAxesGantt,
    permission: "project:update",
    summary: "Timeline, progress harian, media, GPS, dan approval.",
  },
  {
    id: "ai",
    label: "AI Las",
    icon: ScanSearch,
    permission: "ai:scan",
    summary: "Upload foto, deteksi cacat, rekomendasi, confidence.",
  },
  {
    id: "design",
    label: "DKV",
    icon: PenTool,
    permission: "design:generate",
    summary: "Generate poster, blueprint, logo, mockup, dan animasi.",
  },
  {
    id: "portfolio",
    label: "Portofolio",
    icon: UserRound,
    permission: "portfolio:publish",
    summary: "Karya siswa, CV-style, upload PDF/video, share link.",
  },
  {
    id: "gallery",
    label: "Galeri",
    icon: GalleryVerticalEnd,
    permission: "gallery:moderate",
    summary: "Karya publik dengan like, komentar, rating, filter.",
  },
  {
    id: "social",
    label: "Sosmed",
    icon: Megaphone,
    permission: "social:schedule",
    summary: "Jadwal IG/TikTok, template, dan analytics engagement.",
  },
  {
    id: "learning",
    label: "E-Learning",
    icon: BookOpenCheck,
    permission: "project:update",
    summary: "Materi las, DKV, quiz, dan progress pembelajaran.",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    permission: "analytics:read",
    summary: "Performa siswa, biaya rata-rata, approval, dan SLA.",
  },
  {
    id: "client",
    label: "Client",
    icon: ClipboardList,
    permission: "project:approve",
    summary: "Portal client untuk progress dan approval real-time.",
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: Smartphone,
    permission: "dashboard:read",
    summary: "PWA, AR preview, backup, dan push WA/email.",
  },
];

const initialEstimate: EstimateInput = {
  material: "Mild Steel",
  thicknessMm: 6,
  lengthMm: 4200,
  weldType: "SMAW",
  quantity: 8,
  location: "On-site",
  urgency: "Normal",
};

type ApiState =
  | { state: "idle"; message: string }
  | { state: "loading"; message: string }
  | { state: "done"; message: string; result?: EstimateResult }
  | { state: "error"; message: string };

type ProjectStageState = {
  name: string;
  owner: string;
  progress: number;
  start: string;
  end: string;
  state: string;
};

type InventoryState = {
  code: string;
  name: string;
  condition: string;
  location: string;
  age: string;
  stock: string;
};

type SocialPostState = {
  platform: string;
  time: string;
  caption: string;
  engagement: string;
};

type WeldScanResult = {
  detectedType: string;
  quality: string;
  confidence: number;
  recommendation: string;
  createdAt: string;
};

type GeneratedAsset = {
  id: string;
  kind: string;
  title: string;
  prompt: string;
  status: string;
};

export function WeldDesignApp() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [selectedRole, setSelectedRole] = useState<Role>("GURU");
  const [notice, setNotice] = useState("Ready");

  const [estimateInput, setEstimateInput] = useState<EstimateInput>(initialEstimate);
  const [estimateState, setEstimateState] = useState<ApiState>({
    state: "idle",
    message: "Draft lokal belum dikirim ke API.",
  });

  const [projectStageList, setProjectStageList] = useState<ProjectStageState[]>(() =>
    projectStages.map((stage) => ({ ...stage })),
  );
  const [inventoryList, setInventoryList] = useState<InventoryState[]>(() =>
    inventoryItems.map((item) => ({ ...item })),
  );
  const [uploadName, setUploadName] = useState("weld-qc-sample.jpg");
  const [scanResult, setScanResult] = useState<WeldScanResult>({
    detectedType: scanSamples[0].title,
    quality: scanSamples[0].result,
    confidence: scanSamples[0].confidence,
    recommendation: scanSamples[0].recommendation,
    createdAt: new Date().toISOString(),
  });
  const [scanState, setScanState] = useState<ApiState>({
    state: "idle",
    message: "Pilih foto lalu jalankan scan.",
  });

  const [designPrompt, setDesignPrompt] = useState(
    "Poster safety welding untuk workshop sekolah, warna steel dan amber",
  );
  const [designKind, setDesignKind] = useState("Poster");
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([
    {
      id: "asset-1",
      kind: "Blueprint",
      title: "Welding Safety Campaign",
      prompt: "Blueprint safety workshop",
      status: "Generated",
    },
  ]);

  const [scheduledPosts, setScheduledPosts] = useState<SocialPostState[]>(() =>
    socialPosts.map((post) => ({ ...post })),
  );
  const [socialDraft, setSocialDraft] = useState({
    platform: "Instagram",
    caption: "Progress proyek welding siswa Aerovin",
    scheduledAt: "2026-05-18T07:30",
  });
  const [galleryLikes, setGalleryLikes] = useState<Record<string, number>>(() =>
    Object.fromEntries(portfolioItems.map((item) => [item.title, Math.round(item.rating * 10)])),
  );

  const estimate = useMemo(() => calculateWeldEstimate(estimateInput), [estimateInput]);
  const activeNav = navigation.find((item) => item.id === activeSection) ?? navigation[0];
  const accessibleModules = navigation.filter((item) =>
    canAccess(selectedRole, item.permission),
  ).length;

  function openSection(section: SectionId) {
    setActiveSection(section);
    setNotice(`${navigation.find((item) => item.id === section)?.label ?? "Modul"} dibuka`);
  }

  function updateEstimate<K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) {
    setEstimateInput((current) => ({ ...current, [key]: value }));
    setEstimateState({ state: "idle", message: "Ada perubahan yang belum disimpan." });
  }

  async function syncEstimate() {
    setEstimateState({ state: "loading", message: "Mengirim estimasi ke API..." });

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estimateInput),
      });
      const payload = (await response.json()) as
        | { estimate: EstimateResult }
        | { error: string };

      if (!response.ok || !("estimate" in payload)) {
        throw new Error("error" in payload ? payload.error : "API estimate gagal");
      }

      setEstimateState({
        state: "done",
        message: "Estimasi tersimpan sebagai draft API.",
        result: payload.estimate,
      });
      setNotice("Estimasi berhasil disimpan");
    } catch (error) {
      setEstimateState({
        state: "error",
        message: error instanceof Error ? error.message : "API estimate gagal",
      });
    }
  }

  async function runWeldScan() {
    setScanState({ state: "loading", message: "AI scan sedang berjalan..." });

    try {
      const response = await fetch("/api/ai/weld-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: uploadName, projectId: "demo-project" }),
      });
      const payload = (await response.json()) as WeldScanResult | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "AI scan gagal");
      }

      setScanResult(payload);
      setScanState({ state: "done", message: "Scan selesai dan tersimpan di riwayat." });
      setNotice("AI scan selesai");
    } catch (error) {
      setScanState({
        state: "error",
        message: error instanceof Error ? error.message : "AI scan gagal",
      });
    }
  }

  function approveStage(stageName: string) {
    setProjectStageList((stages) =>
      stages.map((stage) =>
        stage.name === stageName ? { ...stage, progress: 100, state: "Approved" } : stage,
      ),
    );
    setNotice(`Tahap "${stageName}" disetujui`);
  }

  function advanceStage(stageName: string) {
    setProjectStageList((stages) =>
      stages.map((stage) =>
        stage.name === stageName
          ? {
              ...stage,
              progress: Math.min(100, stage.progress + 12),
              state: stage.progress + 12 >= 100 ? "Ready approval" : "On track",
            }
          : stage,
      ),
    );
  }

  function markInventoryDamaged(code: string) {
    setInventoryList((items) =>
      items.map((item) =>
        item.code === code ? { ...item, condition: "Service", stock: "Perlu cek" } : item,
      ),
    );
    setNotice(`Laporan kerusakan dibuat untuk ${code}`);
  }

  function addInventoryDemoItem() {
    const nextIndex = inventoryList.length + 1;
    setInventoryList((items) => [
      {
        code: `WLD-NEW-${String(nextIndex).padStart(3, "0")}`,
        name: "Clamp fabrikasi baru",
        condition: "Baik",
        location: "Workshop A",
        age: "0 th",
        stock: "1 unit",
      },
      ...items,
    ]);
    setNotice("Item inventaris demo ditambahkan");
  }

  function generateDesignAsset() {
    const nextAsset: GeneratedAsset = {
      id: `asset-${Date.now()}`,
      kind: designKind,
      title: `${designKind} proyek las`,
      prompt: designPrompt,
      status: "Generated",
    };

    setGeneratedAssets((assets) => [nextAsset, ...assets]);
    setNotice(`${designKind} berhasil digenerate`);
  }

  async function scheduleSocialPost() {
    setNotice("Mengirim jadwal post...");

    try {
      const response = await fetch("/api/social/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socialDraft),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Schedule post gagal");
      }

      setScheduledPosts((posts) => [
        {
          platform: socialDraft.platform,
          time: socialDraft.scheduledAt.replace("T", " "),
          caption: socialDraft.caption,
          engagement: "Baru",
        },
        ...posts,
      ]);
      setNotice("Post berhasil dijadwalkan");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Schedule post gagal");
    }
  }

  function likeGalleryItem(title: string) {
    setGalleryLikes((likes) => ({ ...likes, [title]: (likes[title] ?? 0) + 1 }));
  }

  function startQuiz(title: string) {
    setNotice(`Quiz "${title}" dibuka`);
  }

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-stone-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] gap-4 p-3 lg:grid-cols-[272px_1fr] lg:p-5">
        <aside className="border-line bg-panel flex flex-col gap-4 rounded-lg border p-3 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-stone-950 text-amber-300">
              <HardHat className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Aerovin
              </p>
              <h1 className="text-lg font-semibold leading-tight">WeldDesign</h1>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-2">
            <p className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              Role aktif
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setNotice(`Role diganti ke ${roleLabels[role]}`);
                  }}
                  className={`rounded-md px-2 py-2 text-xs font-semibold transition ${
                    selectedRole === role
                      ? "bg-stone-950 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isAccessible = canAccess(selectedRole, item.permission);

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.summary}
                  onClick={() => openSection(item.id)}
                  className={`group flex min-w-max items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition lg:min-w-0 ${
                    isActive
                      ? "bg-stone-950 text-white shadow-sm"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {!isAccessible && (
                    <LockKeyhole
                      className={`size-3 shrink-0 ${
                        isActive ? "text-amber-200" : "text-stone-400"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              krisavaaerovin.my.id
            </p>
            <p className="mt-2 text-sm font-semibold">{accessibleModules} modul aktif</p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Status: {notice}
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <Header
            activeNav={activeNav}
            selectedRole={selectedRole}
            accessibleModules={accessibleModules}
            notice={notice}
          />

          <ActiveWorkspace
            activeSection={activeSection}
            selectedRole={selectedRole}
            openSection={openSection}
            estimateInput={estimateInput}
            estimate={estimate}
            estimateState={estimateState}
            updateEstimate={updateEstimate}
            syncEstimate={syncEstimate}
            projectStageList={projectStageList}
            approveStage={approveStage}
            advanceStage={advanceStage}
            inventoryList={inventoryList}
            addInventoryDemoItem={addInventoryDemoItem}
            markInventoryDamaged={markInventoryDamaged}
            uploadName={uploadName}
            setUploadName={setUploadName}
            scanResult={scanResult}
            scanState={scanState}
            runWeldScan={runWeldScan}
            designPrompt={designPrompt}
            setDesignPrompt={setDesignPrompt}
            designKind={designKind}
            setDesignKind={setDesignKind}
            generatedAssets={generatedAssets}
            generateDesignAsset={generateDesignAsset}
            scheduledPosts={scheduledPosts}
            socialDraft={socialDraft}
            setSocialDraft={setSocialDraft}
            scheduleSocialPost={scheduleSocialPost}
            galleryLikes={galleryLikes}
            likeGalleryItem={likeGalleryItem}
            startQuiz={startQuiz}
            setNotice={setNotice}
          />
        </section>
      </div>
    </main>
  );
}

function Header({
  activeNav,
  selectedRole,
  accessibleModules,
  notice,
}: {
  activeNav: NavItem;
  selectedRole: Role;
  accessibleModules: number;
  notice: string;
}) {
  const Icon = activeNav.icon;

  return (
    <header className="border-line bg-panel rounded-lg border p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            <Icon className="size-4" aria-hidden="true" />
            {activeNav.label}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950 md:text-3xl">
            {activeNav.summary}
          </h2>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[460px]">
          <MiniStatus label="Role" value={roleLabels[selectedRole]} />
          <MiniStatus label="Access" value={`${accessibleModules}/${navigation.length}`} />
          <MiniStatus label="Status" value={notice} />
        </div>
      </div>
    </header>
  );
}

function ActiveWorkspace(props: {
  activeSection: SectionId;
  selectedRole: Role;
  openSection: (section: SectionId) => void;
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  estimateState: ApiState;
  updateEstimate: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void;
  syncEstimate: () => void;
  projectStageList: ProjectStageState[];
  approveStage: (stageName: string) => void;
  advanceStage: (stageName: string) => void;
  inventoryList: InventoryState[];
  addInventoryDemoItem: () => void;
  markInventoryDamaged: (code: string) => void;
  uploadName: string;
  setUploadName: (name: string) => void;
  scanResult: WeldScanResult;
  scanState: ApiState;
  runWeldScan: () => void;
  designPrompt: string;
  setDesignPrompt: (prompt: string) => void;
  designKind: string;
  setDesignKind: (kind: string) => void;
  generatedAssets: GeneratedAsset[];
  generateDesignAsset: () => void;
  scheduledPosts: SocialPostState[];
  socialDraft: { platform: string; caption: string; scheduledAt: string };
  setSocialDraft: (draft: { platform: string; caption: string; scheduledAt: string }) => void;
  scheduleSocialPost: () => void;
  galleryLikes: Record<string, number>;
  likeGalleryItem: (title: string) => void;
  startQuiz: (title: string) => void;
  setNotice: (notice: string) => void;
}) {
  switch (props.activeSection) {
    case "security":
      return <SecurityWorkspace selectedRole={props.selectedRole} setNotice={props.setNotice} />;
    case "estimator":
      return (
        <EstimatorWorkspace
          estimateInput={props.estimateInput}
          estimate={props.estimate}
          apiState={props.estimateState}
          updateEstimate={props.updateEstimate}
          syncEstimate={props.syncEstimate}
        />
      );
    case "inventory":
      return (
        <InventoryWorkspace
          inventoryList={props.inventoryList}
          addInventoryDemoItem={props.addInventoryDemoItem}
          markInventoryDamaged={props.markInventoryDamaged}
        />
      );
    case "projects":
      return (
        <ProjectWorkspace
          projectStageList={props.projectStageList}
          approveStage={props.approveStage}
          advanceStage={props.advanceStage}
        />
      );
    case "ai":
      return (
        <AiWorkspace
          uploadName={props.uploadName}
          setUploadName={props.setUploadName}
          scanResult={props.scanResult}
          scanState={props.scanState}
          runWeldScan={props.runWeldScan}
        />
      );
    case "design":
      return (
        <DesignWorkspace
          designPrompt={props.designPrompt}
          setDesignPrompt={props.setDesignPrompt}
          designKind={props.designKind}
          setDesignKind={props.setDesignKind}
          generatedAssets={props.generatedAssets}
          generateDesignAsset={props.generateDesignAsset}
        />
      );
    case "portfolio":
      return <PortfolioWorkspace setNotice={props.setNotice} />;
    case "gallery":
      return (
        <GalleryWorkspace
          galleryLikes={props.galleryLikes}
          likeGalleryItem={props.likeGalleryItem}
        />
      );
    case "social":
      return (
        <SocialWorkspace
          scheduledPosts={props.scheduledPosts}
          socialDraft={props.socialDraft}
          setSocialDraft={props.setSocialDraft}
          scheduleSocialPost={props.scheduleSocialPost}
        />
      );
    case "learning":
      return <LearningWorkspace startQuiz={props.startQuiz} />;
    case "analytics":
      return <AnalyticsWorkspace />;
    case "client":
      return (
        <ClientWorkspace
          projectStageList={props.projectStageList}
          approveStage={props.approveStage}
        />
      );
    case "mobile":
      return <MobileWorkspace setNotice={props.setNotice} />;
    case "overview":
    default:
      return <OverviewWorkspace openSection={props.openSection} />;
  }
}

function OverviewWorkspace({ openSection }: { openSection: (section: SectionId) => void }) {
  const priorityModules: SectionId[] = ["estimator", "projects", "inventory", "ai"];

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className={`rounded-lg border p-4 ${stat.tone}`}>
            <p className="text-sm font-medium opacity-80">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-xs font-semibold">{stat.delta}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelTitle
            icon={LayoutDashboard}
            eyebrow="Workspace"
            title="Modul utama yang siap dipakai"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {navigation
              .filter((item) => item.id !== "overview")
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSection(item.id)}
                    className="rounded-lg border border-stone-200 bg-white p-3 text-left transition hover:border-stone-400 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="size-5 text-stone-600" aria-hidden="true" />
                      {priorityModules.includes(item.id) && (
                        <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                          prioritas
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{item.summary}</p>
                  </button>
                );
              })}
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={Bell} eyebrow="Hari ini" title="Antrian kerja" />
          <div className="mt-4 space-y-3">
            {chatThreads.map((thread) => (
              <button
                key={thread.room}
                type="button"
                onClick={() => openSection(thread.room.includes("Client") ? "client" : "projects")}
                className="flex w-full items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 text-left hover:bg-stone-50"
              >
                <div>
                  <p className="text-sm font-semibold">{thread.room}</p>
                  <p className="mt-1 text-xs text-stone-500">{thread.last}</p>
                </div>
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                  {thread.unread}
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function SecurityWorkspace({
  selectedRole,
  setNotice,
}: {
  selectedRole: Role;
  setNotice: (notice: string) => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
      <Panel>
        <PanelTitle icon={ShieldCheck} eyebrow="RBAC" title="Role dan permission" />
        <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="grid grid-cols-[120px_1fr_90px] gap-3 bg-stone-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            <span>Role</span>
            <span>Permission</span>
            <span>Status</span>
          </div>
          {roles.map((role) => (
            <div
              key={role}
              className="grid grid-cols-[120px_1fr_90px] gap-3 border-t border-stone-100 px-3 py-3 text-sm"
            >
              <span className="font-semibold">{roleLabels[role]}</span>
              <span className="text-stone-600">{rolePermissions[role].length} akses</span>
              <span
                className={`rounded-md px-2 py-1 text-center text-xs font-bold ${
                  selectedRole === role
                    ? "bg-stone-950 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {selectedRole === role ? "Aktif" : "Ready"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {permissions.slice(0, 8).map((permission) => (
            <div
              key={permission}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium">{permission}</span>
              {canAccess(selectedRole, permission) ? (
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <LockKeyhole className="size-4 text-stone-400" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon={LockKeyhole} eyebrow="Security" title="Kontrol aktif" />
        <div className="mt-4 space-y-3">
          {securityControls.map((control) => (
            <div
              key={control.label}
              className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-semibold">{control.label}</p>
                <p className="mt-1 text-xs text-stone-500">{control.state}</p>
              </div>
              <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">
                {control.owner}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3">
          <p className="text-sm font-semibold">Audit log</p>
          <div className="mt-2 space-y-2">
            {auditTrail.map((entry) => (
              <div
                key={`${entry.time}-${entry.action}`}
                className="flex items-start justify-between gap-3 border-t border-stone-100 pt-2 text-sm first:border-t-0 first:pt-0"
              >
                <div>
                  <p className="font-medium">{entry.action}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {entry.actor} | {entry.time}
                  </p>
                </div>
                <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700">
                  {entry.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setNotice("Audit log direfresh dari /api/audit")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh audit
        </button>
      </Panel>
    </section>
  );
}

function EstimatorWorkspace({
  estimateInput,
  estimate,
  apiState,
  updateEstimate,
  syncEstimate,
}: {
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  apiState: ApiState;
  updateEstimate: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void;
  syncEstimate: () => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel>
        <PanelTitle icon={CircleDollarSign} eyebrow="Input" title="Parameter estimasi" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Material">
            <select
              name="material"
              value={estimateInput.material}
              onChange={(event) =>
                updateEstimate("material", event.target.value as EstimateInput["material"])
              }
              className="field"
            >
              {materials.map((material) => (
                <option key={material}>{material}</option>
              ))}
            </select>
          </Field>
          <Field label="Jenis las">
            <select
              name="weldType"
              value={estimateInput.weldType}
              onChange={(event) =>
                updateEstimate("weldType", event.target.value as EstimateInput["weldType"])
              }
              className="field"
            >
              {weldTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Tebal material (mm)">
            <input
              name="thicknessMm"
              className="field"
              type="number"
              min={1}
              value={estimateInput.thicknessMm}
              onChange={(event) =>
                updateEstimate("thicknessMm", Number(event.target.value) || 1)
              }
            />
          </Field>
          <Field label="Panjang las (mm)">
            <input
              name="lengthMm"
              className="field"
              type="number"
              min={10}
              value={estimateInput.lengthMm}
              onChange={(event) =>
                updateEstimate("lengthMm", Number(event.target.value) || 10)
              }
            />
          </Field>
          <Field label="Jumlah">
            <input
              name="quantity"
              className="field"
              type="number"
              min={1}
              value={estimateInput.quantity}
              onChange={(event) => updateEstimate("quantity", Number(event.target.value) || 1)}
            />
          </Field>
          <Field label="Lokasi">
            <select
              name="location"
              value={estimateInput.location}
              onChange={(event) =>
                updateEstimate("location", event.target.value as EstimateInput["location"])
              }
              className="field"
            >
              {projectLocations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {urgencyLevels.map((urgency) => (
            <button
              key={urgency}
              type="button"
              onClick={() => updateEstimate("urgency", urgency)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                estimateInput.urgency === urgency
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
              }`}
            >
              {urgency}
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon={Calculator} eyebrow="Output" title="Hasil perhitungan" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label="Bahan las" value={`${estimate.consumableKg} kg`} />
          <Metric label="Tenaga kerja" value={`${estimate.laborHours} jam`} />
          <Metric label="Durasi" value={`${estimate.durationDays} hari`} />
          <Metric label="Per unit" value={formatRupiah(estimate.unitCost)} />
        </div>

        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-500">Total estimasi</p>
          <p className="mt-1 text-3xl font-semibold">{formatRupiah(estimate.totalCost)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={syncEstimate}
              disabled={apiState.state === "loading"}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
            >
              <Calculator className="size-4" aria-hidden="true" />
              {apiState.state === "loading" ? "Menyimpan..." : "Simpan draft"}
            </button>
            <a
              href="/api/export/estimates"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Export CSV
            </a>
            <a
              href="/api/export/estimate-report"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              <FileText className="size-4" aria-hidden="true" />
              PDF
            </a>
          </div>
          <p
            className={`mt-3 text-xs font-semibold ${
              apiState.state === "error" ? "text-red-700" : "text-stone-500"
            }`}
          >
            {apiState.message}
          </p>
        </div>
      </Panel>
    </section>
  );
}

function ProjectWorkspace({
  projectStageList,
  approveStage,
  advanceStage,
}: {
  projectStageList: ProjectStageState[];
  approveStage: (stageName: string) => void;
  advanceStage: (stageName: string) => void;
}) {
  return (
    <Panel>
      <PanelTitle icon={ChartNoAxesGantt} eyebrow="Monitoring" title="Timeline proyek" />
      <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="grid grid-cols-[1fr_92px_110px] gap-3 bg-stone-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-500 md:grid-cols-[1fr_90px_90px_180px]">
          <span>Tahap</span>
          <span>Mulai</span>
          <span>Selesai</span>
          <span className="hidden md:block">Aksi</span>
        </div>
        {projectStageList.map((stage) => (
          <div key={stage.name} className="border-t border-stone-100 px-3 py-3">
            <div className="grid grid-cols-[1fr_92px_110px] gap-3 text-sm md:grid-cols-[1fr_90px_90px_180px] md:items-center">
              <div>
                <p className="font-semibold">{stage.name}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {stage.owner} | {stage.state}
                </p>
              </div>
              <span className="text-stone-600">{stage.start}</span>
              <span className="text-stone-600">{stage.end}</span>
              <div className="col-span-3 flex gap-2 md:col-span-1">
                <button
                  type="button"
                  onClick={() => advanceStage(stage.name)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  + Progress
                </button>
                <button
                  type="button"
                  onClick={() => approveStage(stage.name)}
                  className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  Approve
                </button>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-stone-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ActionTile icon={Camera} label="Before-after" value="24 media" />
        <ActionTile icon={MapPin} label="GPS opsional" value="3 lokasi" />
        <ActionTile icon={CheckCircle2} label="Approval" value="Live action" />
      </div>
    </Panel>
  );
}

function InventoryWorkspace({
  inventoryList,
  addInventoryDemoItem,
  markInventoryDamaged,
}: {
  inventoryList: InventoryState[];
  addInventoryDemoItem: () => void;
  markInventoryDamaged: (code: string) => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.7fr]">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PanelTitle icon={Package} eyebrow="Inventaris" title="Alat dan bahan" />
          <button
            type="button"
            onClick={addInventoryDemoItem}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <Plus className="size-4" aria-hidden="true" />
            Tambah item
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {inventoryList.map((item) => (
            <div key={item.code} className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 font-mono text-xs text-stone-500">{item.code}</p>
                </div>
                <ConditionBadge condition={item.condition} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-stone-500">
                <span>{item.location}</span>
                <span>{item.age}</span>
                <span className="text-right font-semibold text-stone-700">{item.stock}</span>
              </div>
              <button
                type="button"
                onClick={() => markInventoryDamaged(item.code)}
                className="mt-3 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Laporkan kerusakan
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon={Bell} eyebrow="Maintenance" title="Jadwal otomatis" />
        <div className="mt-4 space-y-2">
          {maintenanceEvents.map((event) => (
            <div
              key={event.title}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <span className="font-semibold">{event.date}</span>
              <span className="text-stone-600">{event.title}</span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function AiWorkspace({
  uploadName,
  setUploadName,
  scanResult,
  scanState,
  runWeldScan,
}: {
  uploadName: string;
  setUploadName: (name: string) => void;
  scanResult: WeldScanResult;
  scanState: ApiState;
  runWeldScan: () => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.75fr_1fr]">
      <Panel>
        <PanelTitle icon={Bot} eyebrow="Upload" title="Foto sambungan las" />
        <label className="mt-4 flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-300 bg-white p-4 text-center hover:bg-stone-50">
          <Upload className="size-8 text-stone-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-stone-700">{uploadName}</span>
          <span className="text-xs text-stone-500">Klik untuk memilih gambar</span>
          <input
            type="file"
            name="weldScanImage"
            accept="image/*"
            className="sr-only"
            onChange={(event) =>
              setUploadName(event.target.files?.[0]?.name ?? "weld-qc-sample.jpg")
            }
          />
        </label>
        <button
          type="button"
          onClick={runWeldScan}
          disabled={scanState.state === "loading"}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          <ScanSearch className="size-4" aria-hidden="true" />
          {scanState.state === "loading" ? "Scanning..." : "Jalankan scan"}
        </button>
        <p
          className={`mt-3 text-xs font-semibold ${
            scanState.state === "error" ? "text-red-700" : "text-stone-500"
          }`}
        >
          {scanState.message}
        </p>
      </Panel>

      <Panel>
        <PanelTitle icon={Activity} eyebrow="Hasil AI" title="Deteksi dan rekomendasi" />
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{scanResult.detectedType}</p>
              <p className="mt-1 text-2xl font-semibold">{scanResult.quality}</p>
            </div>
            <div className="rounded-lg bg-cyan-50 px-3 py-2 text-center text-cyan-950">
              <p className="text-xs font-semibold">Confidence</p>
              <p className="text-xl font-bold">{scanResult.confidence}%</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            {scanResult.recommendation}
          </p>
          <p className="mt-4 text-xs font-semibold text-stone-500">
            Riwayat: {new Date(scanResult.createdAt).toLocaleString("id-ID")}
          </p>
        </div>
      </Panel>
    </section>
  );
}

function DesignWorkspace({
  designPrompt,
  setDesignPrompt,
  designKind,
  setDesignKind,
  generatedAssets,
  generateDesignAsset,
}: {
  designPrompt: string;
  setDesignPrompt: (prompt: string) => void;
  designKind: string;
  setDesignKind: (kind: string) => void;
  generatedAssets: GeneratedAsset[];
  generateDesignAsset: () => void;
}) {
  const designKinds = ["Poster", "Blueprint", "3D Mockup", "Logo", "Animasi"];

  return (
    <section className="grid gap-4 xl:grid-cols-[0.75fr_1fr]">
      <Panel>
        <PanelTitle icon={WandSparkles} eyebrow="DKV" title="Generator desain" />
        <div className="mt-4 flex flex-wrap gap-2">
          {designKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setDesignKind(kind)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                designKind === kind
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
              }`}
            >
              {kind}
            </button>
          ))}
        </div>
        <Field label="Prompt desain">
          <textarea
            name="designPrompt"
            value={designPrompt}
            onChange={(event) => setDesignPrompt(event.target.value)}
            className="field min-h-32 resize-none"
          />
        </Field>
        <button
          type="button"
          onClick={generateDesignAsset}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Generate
        </button>
      </Panel>

      <Panel>
        <PanelTitle icon={PenTool} eyebrow="Asset" title="Preview dan riwayat" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-72 overflow-hidden rounded-lg border border-stone-200 bg-stone-950 text-white">
            <Image
              src="/blueprint.svg"
              alt=""
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover opacity-75"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">
                {generatedAssets[0]?.kind ?? "Template"}
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {generatedAssets[0]?.title ?? "Welding Safety Campaign"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {generatedAssets.map((asset) => (
              <div key={asset.id} className="rounded-lg border border-stone-200 bg-white p-3">
                <p className="text-sm font-semibold">{asset.title}</p>
                <p className="mt-1 text-xs text-stone-500">{asset.kind}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">
                  {asset.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function PortfolioWorkspace({ setNotice }: { setNotice: (notice: string) => void }) {
  return (
    <Panel>
      <PanelTitle icon={Share2} eyebrow="Portofolio" title="Karya siswa" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {portfolioItems.map((item) => (
          <article key={`${item.student}-${item.title}`} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {item.student} | {item.major} | {item.year}
                </p>
              </div>
              <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                {item.rating}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(`Link publik ${item.student} disiapkan`)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
            >
              <Copy className="size-3" aria-hidden="true" />
              Share link
            </button>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function GalleryWorkspace({
  galleryLikes,
  likeGalleryItem,
}: {
  galleryLikes: Record<string, number>;
  likeGalleryItem: (title: string) => void;
}) {
  return (
    <Panel>
      <PanelTitle icon={GalleryVerticalEnd} eyebrow="Galeri Publik" title="Filter dan rating" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {portfolioItems.map((item) => (
          <article key={item.title} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {item.major} | {item.year}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                <Star className="size-3" aria-hidden="true" />
                {item.rating}
              </span>
            </div>
            <button
              type="button"
              onClick={() => likeGalleryItem(item.title)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              <ThumbsUp className="size-3" aria-hidden="true" />
              Like {galleryLikes[item.title] ?? 0}
            </button>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function SocialWorkspace({
  scheduledPosts,
  socialDraft,
  setSocialDraft,
  scheduleSocialPost,
}: {
  scheduledPosts: SocialPostState[];
  socialDraft: { platform: string; caption: string; scheduledAt: string };
  setSocialDraft: (draft: { platform: string; caption: string; scheduledAt: string }) => void;
  scheduleSocialPost: () => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.75fr_1fr]">
      <Panel>
        <PanelTitle icon={Megaphone} eyebrow="Scheduler" title="Buat jadwal post" />
        <div className="mt-4 space-y-3">
          <Field label="Platform">
            <select
              name="socialPlatform"
              value={socialDraft.platform}
              onChange={(event) =>
                setSocialDraft({ ...socialDraft, platform: event.target.value })
              }
              className="field"
            >
              <option>Instagram</option>
              <option>TikTok</option>
            </select>
          </Field>
          <Field label="Caption">
            <textarea
              name="socialCaption"
              value={socialDraft.caption}
              onChange={(event) =>
                setSocialDraft({ ...socialDraft, caption: event.target.value })
              }
              className="field min-h-28 resize-none"
            />
          </Field>
          <Field label="Jadwal">
            <input
              name="scheduledAt"
              type="datetime-local"
              value={socialDraft.scheduledAt}
              onChange={(event) =>
                setSocialDraft({ ...socialDraft, scheduledAt: event.target.value })
              }
              className="field"
            />
          </Field>
          <button
            type="button"
            onClick={scheduleSocialPost}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <Send className="size-4" aria-hidden="true" />
            Jadwalkan post
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon={Activity} eyebrow="Queue" title="Post terjadwal" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scheduledPosts.map((post) => (
            <div key={`${post.platform}-${post.time}-${post.caption}`} className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{post.platform}</p>
                <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-900">
                  {post.engagement}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{post.caption}</p>
              <p className="mt-2 text-xs font-semibold text-stone-500">{post.time}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function LearningWorkspace({ startQuiz }: { startQuiz: (title: string) => void }) {
  return (
    <Panel>
      <PanelTitle icon={GraduationCap} eyebrow="E-Learning" title="Materi dan quiz" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {learningModules.map((module) => (
          <div key={module.title} className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm font-semibold">{module.title}</p>
            <p className="mt-1 text-xs text-stone-500">{module.quiz}</p>
            <div className="mt-4 h-2 rounded-full bg-stone-100">
              <div
                className="h-2 rounded-full bg-amber-500"
                style={{ width: `${module.progress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => startQuiz(module.title)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
            >
              <Play className="size-3" aria-hidden="true" />
              Mulai quiz
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AnalyticsWorkspace() {
  return (
    <Panel>
      <PanelTitle icon={BarChart3} eyebrow="Analytics" title="Performa produksi" />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {analyticsRows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-stone-200 bg-white p-4"
          >
            <p className="text-sm font-semibold">{row.label}</p>
            <p className="mt-3 text-2xl font-bold">{row.value}</p>
            <span className="mt-3 inline-block rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
              {row.trend}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {[82, 67, 93, 74].map((value, index) => (
          <div key={value} className="rounded-lg border border-stone-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
              Minggu {index + 1}
            </p>
            <div className="mt-3 h-28 rounded-lg bg-stone-100 p-2">
              <div
                className="mt-auto rounded-md bg-stone-950"
                style={{ height: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ClientWorkspace({
  projectStageList,
  approveStage,
}: {
  projectStageList: ProjectStageState[];
  approveStage: (stageName: string) => void;
}) {
  return (
    <Panel>
      <PanelTitle icon={ClipboardList} eyebrow="Client Portal" title="Laporan real-time" />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {projectStageList.map((stage) => (
          <div key={stage.name} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{stage.name}</p>
                <p className="mt-1 text-xs text-stone-500">{stage.state}</p>
              </div>
              <span className="text-sm font-bold">{stage.progress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-stone-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => approveStage(stage.name)}
              className="mt-4 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              Approve client
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MobileWorkspace({ setNotice }: { setNotice: (notice: string) => void }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
      <Panel>
        <PanelTitle icon={Smartphone} eyebrow="PWA" title="Mobile app readiness" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ActionTile icon={Smartphone} label="Android/iOS" value="Installable PWA" />
          <ActionTile icon={Camera} label="AR preview" value="3D joint roadmap" />
          <ActionTile icon={DatabaseBackup} label="Auto backup" value="Manual trigger ready" />
          <ActionTile icon={MessageSquareText} label="WA/Email" value="Provider-ready" />
        </div>
        <button
          type="button"
          onClick={() => setNotice("Backup demo berhasil dijalankan")}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <DatabaseBackup className="size-4" aria-hidden="true" />
          Jalankan backup demo
        </button>
      </Panel>

      <Panel>
        <PanelTitle icon={Download} eyebrow="Export" title="Backup dan arsip" />
        <div className="mt-4 space-y-3">
          <a
            href="/api/export/estimates"
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold hover:bg-stone-50"
          >
            Export estimasi CSV
            <Download className="size-4" aria-hidden="true" />
          </a>
          <a
            href="/api/export/estimate-report"
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold hover:bg-stone-50"
          >
            Export laporan PDF
            <Download className="size-4" aria-hidden="true" />
          </a>
        </div>
      </Panel>
    </section>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="border-line bg-panel rounded-lg border p-4 shadow-sm">
      {children}
    </section>
  );
}

function PanelTitle({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      </div>
      <div className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
        <Icon className="size-5" aria-hidden="true" />
      </div>
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <Icon className="size-4 text-stone-500" aria-hidden="true" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const className =
    condition === "Kritis"
      ? "bg-red-100 text-red-800"
      : condition === "Service"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-800";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${className}`}>
      {condition}
    </span>
  );
}
