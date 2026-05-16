"use client";

import {
  Activity,
  Bell,
  BookOpenCheck,
  Calculator,
  Camera,
  ChartNoAxesGantt,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Copy,
  DatabaseBackup,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  HardHat,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquareText,
  Package,
  Play,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { LoginPage } from "@/components/auth/login-page";
import { type AppUser } from "@/lib/auth-demo";
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
  auditTrail,
  chatThreads,
  dashboardStats,
  inventoryItems,
  learningModules,
  maintenanceEvents,
  portfolioItems,
  projectStages,
  sampleEstimates,
  socialPosts,
} from "@/lib/weld-data";

type SectionId =
  | "overview"
  | "security"
  | "estimator"
  | "inventory"
  | "projects"
  | "portfolio"
  | "automation"
  | "social"
  | "learning"
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
    summary: "RBAC, session policy, audit log, dan hardening.",
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
    id: "portfolio",
    label: "Portofolio",
    icon: UserRound,
    permission: "portfolio:publish",
    summary: "Karya siswa, CV-style, upload PDF/video, share link.",
  },
  {
    id: "automation",
    label: "Automation",
    icon: DatabaseBackup,
    permission: "automation:manage",
    summary: "Auto-create Google Spreadsheet lewat Apps Script.",
  },
  {
    id: "social",
    label: "Sosmed",
    icon: Megaphone,
    permission: "social:schedule",
    summary: "Jadwal IG/TikTok, template, dan engagement.",
  },
  {
    id: "learning",
    label: "E-Learning",
    icon: BookOpenCheck,
    permission: "learning:access",
    summary: "Materi download, soal Google Form, score, dan koreksi otomatis.",
  },
  {
    id: "client",
    label: "Client",
    icon: ClipboardList,
    permission: "project:approve",
    summary: "Order, progress 0-100, finish, dan persetujuan aman client.",
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

const defaultSpreadsheetAppsScript = `var WELDDESIGN_SHEETS = {
  Orders: ["id", "title", "client", "issue", "status", "progress", "approved", "accepted", "updatedAt"],
  Projects: ["id", "name", "owner", "progress", "start", "end", "state", "updatedAt"],
  Inventory: ["id", "code", "name", "condition", "location", "age", "stock", "updatedAt"],
  Estimates: ["id", "project", "material", "weldType", "quantity", "totalCost", "createdAt", "updatedAt"],
  Portfolio: ["id", "title", "student", "major", "year", "rating", "summary", "updatedAt"],
  Learning: ["id", "title", "type", "description", "score", "progress", "formUrl", "sheetUrl", "updatedAt"],
  Social: ["id", "platform", "time", "caption", "engagement", "updatedAt"],
  Automation: ["id", "name", "spreadsheetName", "webAppUrl", "status", "lastRun", "updatedAt"]
};

function doGet() {
  var ss = ensureSpreadsheet_("WeldDesign Production Data");
  return HtmlService.createHtmlOutput(
    '<p>WeldDesign Spreadsheet connected.</p><p><a target="_blank" href="' + ss.getUrl() + '">Open Spreadsheet</a></p>'
  );
}

function doPost(e) {
  var payload = parsePayload_(e);
  var ss = ensureSpreadsheet_(payload.spreadsheetName || "WeldDesign Production Data");
  setupSheets_(ss);

  if (!payload.table) {
    return htmlResponse_({ ok: true, action: "create-spreadsheet", spreadsheetUrl: ss.getUrl(), spreadsheetId: ss.getId() });
  }

  var table = String(payload.table);
  var sheet = getOrCreateSheet_(ss, table);
  var records = payload.records || (payload.record ? [payload.record] : []);
  var action = payload.action || "upsert";

  records.forEach(function(record) {
    if (action === "delete") {
      deleteRecord_(sheet, String(record.id || record.code || record.name || record.title));
      return;
    }

    upsertRecord_(sheet, normalizeRecord_(table, record));
  });

  return jsonResponse_({ ok: true, action: action, table: table, count: records.length, spreadsheetUrl: ss.getUrl(), spreadsheetId: ss.getId() });
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return {};
}

function ensureSpreadsheet_(name) {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty("WELDDESIGN_SPREADSHEET_ID");
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  var ss = SpreadsheetApp.create(name);
  props.setProperty("WELDDESIGN_SPREADSHEET_ID", ss.getId());
  setupSheets_(ss);
  return ss;
}

function setupSheets_(ss) {
  Object.keys(WELDDESIGN_SHEETS).forEach(function(table, index) {
    var sheet = ss.getSheetByName(table);
    if (!sheet) {
      sheet = index === 0 ? ss.getSheets()[0] : ss.insertSheet(table);
      sheet.setName(table);
    }
    ensureHeaders_(sheet, WELDDESIGN_SHEETS[table]);
  });
}

function getOrCreateSheet_(ss, table) {
  var sheet = ss.getSheetByName(table) || ss.insertSheet(table);
  ensureHeaders_(sheet, WELDDESIGN_SHEETS[table] || ["id", "data", "updatedAt"]);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  var current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (current.join("") === "") {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function normalizeRecord_(table, record) {
  var headers = WELDDESIGN_SHEETS[table] || ["id", "data", "updatedAt"];
  var normalized = {};
  headers.forEach(function(header) {
    normalized[header] = record[header] !== undefined ? record[header] : "";
  });
  normalized.id = String(normalized.id || record.code || record.name || record.title || new Date().getTime());
  normalized.updatedAt = new Date().toISOString();
  return normalized;
}

function upsertRecord_(sheet, record) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIndex = findRecordRow_(sheet, String(record.id));
  var row = headers.map(function(header) { return record[header] !== undefined ? record[header] : ""; });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function deleteRecord_(sheet, id) {
  var rowIndex = findRecordRow_(sheet, id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex);
  }
}

function findRecordRow_(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return i + 2;
    }
  }
  return -1;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function htmlResponse_(body) {
  return HtmlService.createHtmlOutput(
    '<p>Spreadsheet ready.</p><p><a target="_blank" href="' + body.spreadsheetUrl + '">Open Spreadsheet</a></p>'
  );
}`;

type ApiState =
  | { state: "idle"; message: string }
  | { state: "loading"; message: string }
  | { state: "done"; message: string; result?: EstimateResult }
  | { state: "error"; message: string };

function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  });
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedValue = window.localStorage.getItem(key);
        if (savedValue) {
          setState(JSON.parse(savedValue) as T);
        }
      } catch {
        window.localStorage.removeItem(key);
      } finally {
        hasLoadedRef.current = true;
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!hasLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

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

type EstimateRecordState = {
  id: string;
  project: string;
  input: EstimateInput;
  result: EstimateResult;
  createdAt: string;
};

type PortfolioState = {
  id: string;
  title: string;
  student: string;
  major: string;
  year: string;
  rating: number;
  summary: string;
  pdfName: string;
};

type AutomationState = {
  id: string;
  name: string;
  spreadsheetName: string;
  script: string;
  webAppUrl: string;
  status: string;
  createdAt: string;
  lastRun: string;
};

type LearningState = {
  id: string;
  title: string;
  type: "Materi" | "Soal";
  description: string;
  progress: number;
  score: number;
  corrected: string;
  materialFileName?: string;
  materialDownloadUrl?: string;
  materialBody?: string;
  formUrl?: string;
  sheetUrl?: string;
};

type ClientOrderState = {
  id: string;
  title: string;
  client: string;
  issue: string;
  status: string;
  progress: number;
  approved: boolean;
  accepted: boolean;
};

export function WeldDesignApp() {
  const [activeSection, setActiveSection] = usePersistentState<SectionId>(
    "welddesign.activeSection",
    "overview",
  );
  const [isWorkspaceOpen, setIsWorkspaceOpen] = usePersistentState(
    "welddesign.workspaceOpen",
    false,
  );
  const [currentUser, setCurrentUser] = usePersistentState<AppUser | null>(
    "welddesign.currentUser",
    null,
  );
  const [authState, setAuthState] = usePersistentState<ApiState>("welddesign.authState", {
    state: "idle",
    message: "Belum login. Role otomatis: Client.",
  });
  const [notice, setNotice] = useState("Mode Client");

  const [estimateInput, setEstimateInput] = usePersistentState<EstimateInput>(
    "welddesign.estimateInput",
    initialEstimate,
  );
  const [estimateState, setEstimateState] = useState<ApiState>({
    state: "idle",
    message: "Draft lokal belum dikirim ke API.",
  });

  const [projectStageList, setProjectStageList] = usePersistentState<ProjectStageState[]>(
    "welddesign.projectStages",
    () =>
    projectStages.map((stage) => ({ ...stage })),
  );
  const [inventoryList, setInventoryList] = usePersistentState<InventoryState[]>(
    "welddesign.inventory",
    () =>
    inventoryItems.map((item) => ({ ...item })),
  );

  const [scheduledPosts, setScheduledPosts] = usePersistentState<SocialPostState[]>(
    "welddesign.scheduledPosts",
    () =>
    socialPosts.map((post) => ({ ...post })),
  );
  const [socialDraft, setSocialDraft] = usePersistentState("welddesign.socialDraft", {
    platform: "Instagram",
    caption: "Progress proyek welding siswa Aerovin",
    scheduledAt: "2026-05-18T07:30",
  });

  const selectedRole: Role = currentUser?.role ?? "CLIENT";
  const estimate = useMemo(() => calculateWeldEstimate(estimateInput), [estimateInput]);
  const activeNav = navigation.find((item) => item.id === activeSection) ?? navigation[0];
  const accessibleModules = navigation.filter((item) =>
    canAccess(selectedRole, item.permission),
  ).length;

  function openSection(section: SectionId) {
    const navItem = navigation.find((item) => item.id === section);
    setActiveSection(section);

    if (navItem && !canAccess(selectedRole, navItem.permission)) {
      setNotice(`Akses ${navItem.label} ditolak untuk ${roleLabels[selectedRole]}`);
      return;
    }

    setNotice(`${navItem?.label ?? "Modul"} dibuka`);
  }

  async function loginAs(user: AppUser, password = "password-demo-123") {
    setAuthState({ state: "loading", message: `Login sebagai ${roleLabels[user.role]}...` });

    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password,
          role: user.role,
        }),
      });
      const payload = (await response.json()) as
        | { session: { token: string } }
        | { error: string };

      if (!response.ok || !("session" in payload)) {
        throw new Error("error" in payload ? payload.error : "Login gagal");
      }

      setCurrentUser({ ...user, token: payload.session.token });
      setAuthState({
        state: "done",
        message: `Login aktif: ${user.name} (${roleLabels[user.role]}).`,
      });
      setNotice(`Login sebagai ${roleLabels[user.role]}`);
      setActiveSection("overview");
      setIsWorkspaceOpen(true);
    } catch (error) {
      setAuthState({
        state: "error",
        message: error instanceof Error ? error.message : "Login gagal",
      });
    }
  }

  function logout() {
    setCurrentUser(null);
    setAuthState({ state: "idle", message: "Logout. Role otomatis kembali ke Client." });
    setNotice("Mode Client");
    setActiveSection("overview");
    setIsWorkspaceOpen(false);
  }

  function continueAsClient() {
    setCurrentUser(null);
    setAuthState({ state: "idle", message: "Mode Client tanpa login aktif." });
    setNotice("Mode Client");
    setActiveSection("client");
    setIsWorkspaceOpen(true);
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

  function approveStage(stageName: string) {
    setProjectStageList((stages) =>
      stages.map((stage) =>
        stage.name === stageName ? { ...stage, progress: 100, state: "Approved" } : stage,
      ),
    );
    setNotice(`Tahap "${stageName}" disetujui`);
    void syncGoogleSheet(
      "Projects",
      "upsert",
      { id: stageName, name: stageName, progress: 100, state: "Approved" },
      setNotice,
    );
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
    const currentStage = projectStageList.find((stage) => stage.name === stageName);
    if (currentStage) {
      const progress = Math.min(100, currentStage.progress + 12);
      void syncGoogleSheet(
        "Projects",
        "upsert",
        {
          id: currentStage.name,
          ...currentStage,
          progress,
          state: progress >= 100 ? "Ready approval" : "On track",
        },
        setNotice,
      );
    }
  }

  function regressStage(stageName: string) {
    setProjectStageList((stages) =>
      stages.map((stage) =>
        stage.name === stageName
          ? {
              ...stage,
              progress: Math.max(0, stage.progress - 12),
              state: Math.max(0, stage.progress - 12) === 0 ? "Waiting" : "Need revision",
            }
          : stage,
      ),
    );
    setNotice(`Progress "${stageName}" dikurangi`);
    const currentStage = projectStageList.find((stage) => stage.name === stageName);
    if (currentStage) {
      const progress = Math.max(0, currentStage.progress - 12);
      void syncGoogleSheet(
        "Projects",
        "upsert",
        {
          id: currentStage.name,
          ...currentStage,
          progress,
          state: progress === 0 ? "Waiting" : "Need revision",
        },
        setNotice,
      );
    }
  }

  function updateProjectStage(stageName: string, nextStage: ProjectStageState) {
    setProjectStageList((stages) =>
      stages.map((stage) => (stage.name === stageName ? nextStage : stage)),
    );
    setNotice(`Tahap "${nextStage.name}" berhasil diedit`);
    void syncGoogleSheet("Projects", "upsert", { id: nextStage.name, ...nextStage }, setNotice);
  }

  function deleteProjectStage(stageName: string) {
    setProjectStageList((stages) => stages.filter((stage) => stage.name !== stageName));
    setNotice(`Tahap "${stageName}" dihapus`);
    void syncGoogleSheet("Projects", "delete", { id: stageName }, setNotice);
  }

  function markInventoryDamaged(code: string) {
    setInventoryList((items) =>
      items.map((item) =>
        item.code === code ? { ...item, condition: "Service", stock: "Perlu cek" } : item,
      ),
    );
    setNotice(`Laporan kerusakan dibuat untuk ${code}`);
    const item = inventoryList.find((entry) => entry.code === code);
    if (item) {
      void syncGoogleSheet(
        "Inventory",
        "upsert",
        { id: code, ...item, condition: "Service", stock: "Perlu cek" },
        setNotice,
      );
    }
  }

  function updateInventoryItem(code: string, nextItem: InventoryState) {
    setInventoryList((items) =>
      items.map((item) =>
        item.code === code ? { ...nextItem, code: nextItem.code.trim() || code } : item,
      ),
    );
    setNotice(`Inventaris ${nextItem.code.trim() || code} berhasil diupdate`);
    void syncGoogleSheet(
      "Inventory",
      "upsert",
      { id: nextItem.code.trim() || code, ...nextItem },
      setNotice,
    );
  }

  function deleteInventoryItem(code: string) {
    setInventoryList((items) => items.filter((item) => item.code !== code));
    setNotice(`Inventaris ${code} dihapus`);
    void syncGoogleSheet("Inventory", "delete", { id: code }, setNotice);
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
      void syncGoogleSheet(
        "Social",
        "upsert",
        {
          id: `${socialDraft.platform}-${socialDraft.scheduledAt}-${socialDraft.caption}`,
          platform: socialDraft.platform,
          time: socialDraft.scheduledAt.replace("T", " "),
          caption: socialDraft.caption,
          engagement: "Baru",
        },
        setNotice,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Schedule post gagal");
    }
  }

  function updateScheduledPost(originalKey: string, nextPost: SocialPostState) {
    setScheduledPosts((posts) =>
      posts.map((post) => (socialPostKey(post) === originalKey ? nextPost : post)),
    );
    setNotice("Jadwal post berhasil disimpan");
    void syncGoogleSheet(
      "Social",
      "upsert",
      { id: socialPostKey(nextPost), ...nextPost },
      setNotice,
    );
  }

  function deleteScheduledPost(postKey: string) {
    setScheduledPosts((posts) => posts.filter((post) => socialPostKey(post) !== postKey));
    setNotice("Jadwal post dihapus");
    void syncGoogleSheet("Social", "delete", { id: postKey }, setNotice);
  }

  if (!isWorkspaceOpen) {
    return (
      <LoginPage
        authMessage={authState.message}
        authState={authState.state}
        onContinueAsClient={continueAsClient}
        onSubmit={loginAs}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-stone-950">
      <AdminShellHeader
        activeSection={activeSection}
        accessibleModules={accessibleModules}
        currentUser={currentUser}
        logout={logout}
        openSection={openSection}
        selectedRole={selectedRole}
      />

      <section className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-6">
        <Header
          activeNav={activeNav}
          selectedRole={selectedRole}
          currentUser={currentUser}
          accessibleModules={accessibleModules}
          notice={notice}
        />

        <ActiveWorkspace
          activeSection={activeSection}
          selectedRole={selectedRole}
          currentUser={currentUser}
          openSection={openSection}
          estimateInput={estimateInput}
          estimate={estimate}
          estimateState={estimateState}
          updateEstimate={updateEstimate}
          syncEstimate={syncEstimate}
          projectStageList={projectStageList}
          approveStage={approveStage}
          advanceStage={advanceStage}
          regressStage={regressStage}
          updateProjectStage={updateProjectStage}
          deleteProjectStage={deleteProjectStage}
          inventoryList={inventoryList}
          addInventoryDemoItem={addInventoryDemoItem}
          markInventoryDamaged={markInventoryDamaged}
          updateInventoryItem={updateInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
          scheduledPosts={scheduledPosts}
          socialDraft={socialDraft}
          setSocialDraft={setSocialDraft}
          scheduleSocialPost={scheduleSocialPost}
          updateScheduledPost={updateScheduledPost}
          deleteScheduledPost={deleteScheduledPost}
          setNotice={setNotice}
        />
      </section>
    </main>
  );
}

function AdminShellHeader({
  activeSection,
  accessibleModules,
  currentUser,
  logout,
  openSection,
  selectedRole,
}: {
  activeSection: SectionId;
  accessibleModules: number;
  currentUser: AppUser | null;
  logout: () => void;
  openSection: (section: SectionId) => void;
  selectedRole: Role;
}) {
  const initials = (currentUser?.name ?? "Guest Client")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fffdf8]/95 shadow-[0_1px_2px_rgba(24,23,22,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col px-4">
        <div className="flex min-h-16 items-center gap-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-stone-950 text-amber-300">
              <HardHat className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">WeldDesign Production</p>
              <p className="truncate text-xs font-medium text-stone-500">
                krisavaaerovin.my.id
              </p>
            </div>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 md:block">
              {accessibleModules}/{navigation.length} modul aktif
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-stone-200 bg-white px-2.5 py-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-stone-100 text-xs font-bold text-stone-700">
                {initials}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold">
                  {currentUser?.name ?? "Guest Client"}
                </p>
                <p className="text-xs text-stone-500">{roleLabels[selectedRole]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-100"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{currentUser ? "Logout" : "Login"}</span>
            </button>
          </div>
        </div>

        <nav className="weld-nav-scroll flex gap-2 overflow-x-auto pb-3 lg:flex-wrap lg:overflow-visible">
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
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 lg:shrink ${
                  isActive
                    ? "border-stone-300 bg-white text-stone-950 shadow-sm"
                    : "border-transparent text-stone-500 hover:bg-white hover:text-stone-950"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
                {!isAccessible && (
                  <LockKeyhole className="size-3 text-stone-400" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function Header({
  activeNav,
  selectedRole,
  currentUser,
  accessibleModules,
  notice,
}: {
  activeNav: NavItem;
  selectedRole: Role;
  currentUser: AppUser | null;
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
          <MiniStatus label="User" value={currentUser?.name ?? "Guest Client"} />
          <MiniStatus label="Access" value={`${accessibleModules}/${navigation.length}`} />
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
        {notice}
      </p>
    </header>
  );
}

function ActiveWorkspace(props: {
  activeSection: SectionId;
  selectedRole: Role;
  currentUser: AppUser | null;
  openSection: (section: SectionId) => void;
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  estimateState: ApiState;
  updateEstimate: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void;
  syncEstimate: () => void;
  projectStageList: ProjectStageState[];
  approveStage: (stageName: string) => void;
  advanceStage: (stageName: string) => void;
  regressStage: (stageName: string) => void;
  updateProjectStage: (stageName: string, nextStage: ProjectStageState) => void;
  deleteProjectStage: (stageName: string) => void;
  inventoryList: InventoryState[];
  addInventoryDemoItem: () => void;
  markInventoryDamaged: (code: string) => void;
  updateInventoryItem: (code: string, nextItem: InventoryState) => void;
  deleteInventoryItem: (code: string) => void;
  scheduledPosts: SocialPostState[];
  socialDraft: { platform: string; caption: string; scheduledAt: string };
  setSocialDraft: (draft: { platform: string; caption: string; scheduledAt: string }) => void;
  scheduleSocialPost: () => void;
  updateScheduledPost: (originalKey: string, nextPost: SocialPostState) => void;
  deleteScheduledPost: (postKey: string) => void;
  setNotice: (notice: string) => void;
}) {
  const navItem = navigation.find((item) => item.id === props.activeSection) ?? navigation[0];

  if (!canAccess(props.selectedRole, navItem.permission)) {
    return (
      <AccessDenied
        navItem={navItem}
        selectedRole={props.selectedRole}
        currentUser={props.currentUser}
        openSection={props.openSection}
      />
    );
  }

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
          setNotice={props.setNotice}
        />
      );
    case "inventory":
      return (
        <InventoryWorkspace
          selectedRole={props.selectedRole}
          inventoryList={props.inventoryList}
          addInventoryDemoItem={props.addInventoryDemoItem}
          markInventoryDamaged={props.markInventoryDamaged}
          updateInventoryItem={props.updateInventoryItem}
          deleteInventoryItem={props.deleteInventoryItem}
          setNotice={props.setNotice}
        />
      );
    case "projects":
      return (
        <ProjectWorkspace
          selectedRole={props.selectedRole}
          projectStageList={props.projectStageList}
          approveStage={props.approveStage}
          advanceStage={props.advanceStage}
          regressStage={props.regressStage}
          updateProjectStage={props.updateProjectStage}
          deleteProjectStage={props.deleteProjectStage}
          setNotice={props.setNotice}
        />
      );
    case "portfolio":
      return <PortfolioWorkspace setNotice={props.setNotice} />;
    case "automation":
      return <AutomationWorkspace setNotice={props.setNotice} />;
    case "social":
      return (
        <SocialWorkspace
          scheduledPosts={props.scheduledPosts}
          socialDraft={props.socialDraft}
          setSocialDraft={props.setSocialDraft}
          scheduleSocialPost={props.scheduleSocialPost}
          updateScheduledPost={props.updateScheduledPost}
          deleteScheduledPost={props.deleteScheduledPost}
          setNotice={props.setNotice}
        />
      );
    case "learning":
      return <LearningWorkspace selectedRole={props.selectedRole} setNotice={props.setNotice} />;
    case "client":
      return (
        <ClientWorkspace
          selectedRole={props.selectedRole}
          projectStageList={props.projectStageList}
          approveStage={props.approveStage}
          setNotice={props.setNotice}
        />
      );
    case "mobile":
      return <MobileWorkspace setNotice={props.setNotice} />;
    case "overview":
    default:
      return (
        <OverviewWorkspace
          selectedRole={props.selectedRole}
          openSection={props.openSection}
        />
      );
  }
}

function OverviewWorkspace({
  selectedRole,
  openSection,
}: {
  selectedRole: Role;
  openSection: (section: SectionId) => void;
}) {
  const priorityModules: SectionId[] = ["estimator", "projects", "inventory", "client"];

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
                const isAccessible = canAccess(selectedRole, item.permission);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSection(item.id)}
                    className={`rounded-lg border p-3 text-left transition hover:border-stone-400 hover:shadow-sm ${
                      isAccessible
                        ? "border-stone-200 bg-white"
                        : "border-stone-200 bg-stone-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="size-5 text-stone-600" aria-hidden="true" />
                      {!isAccessible ? (
                        <LockKeyhole className="size-4 text-stone-400" aria-hidden="true" />
                      ) : priorityModules.includes(item.id) ? (
                        <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                          prioritas
                        </span>
                      ) : null}
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

function AccessDenied({
  navItem,
  selectedRole,
  currentUser,
  openSection,
}: {
  navItem: NavItem;
  selectedRole: Role;
  currentUser: AppUser | null;
  openSection: (section: SectionId) => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-xl font-semibold">Akses dibatasi</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Modul {navItem.label} membutuhkan permission{" "}
            <span className="font-semibold text-stone-950">{navItem.permission}</span>.
            Akun aktif adalah {currentUser?.name ?? "Guest"} dengan role{" "}
            <span className="font-semibold text-stone-950">{roleLabels[selectedRole]}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openSection(selectedRole === "CLIENT" ? "client" : "overview")}
          className="rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Buka modul yang tersedia
        </button>
      </div>
    </Panel>
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
  setNotice,
}: {
  estimateInput: EstimateInput;
  estimate: EstimateResult;
  apiState: ApiState;
  updateEstimate: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void;
  syncEstimate: () => void;
  setNotice: (notice: string) => void;
}) {
  const [estimateRecords, setEstimateRecords] = usePersistentState<EstimateRecordState[]>(
    "welddesign.estimateRecords",
    () =>
    sampleEstimates.map((sample, index) => ({
      id: `estimate-${index}`,
      project: sample.project,
      input: sample.input,
      result: sample.result,
      createdAt: "Data awal",
    })),
  );
  const [estimateQuery, setEstimateQuery] = useState("");
  const [viewingEstimateId, setViewingEstimateId] = useState<string | null>(
    estimateRecords[0]?.id ?? null,
  );
  const filteredEstimates = estimateRecords.filter((record) =>
    matchesSearch(
      estimateQuery,
      record.project,
      record.input.material,
      record.input.weldType,
      record.result.totalCost,
    ),
  );
  const viewingEstimate = estimateRecords.find((record) => record.id === viewingEstimateId);

  function saveEstimateRecord() {
    const nextRecord: EstimateRecordState = {
      id: `estimate-${Date.now()}`,
      project: `${estimateInput.weldType} ${estimateInput.material}`,
      input: { ...estimateInput },
      result: estimate,
      createdAt: new Date().toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    };

    setEstimateRecords((records) => [nextRecord, ...records]);
    setViewingEstimateId(nextRecord.id);
    syncEstimate();
    void syncGoogleSheet(
      "Estimates",
      "upsert",
      {
        id: nextRecord.id,
        project: nextRecord.project,
        material: nextRecord.input.material,
        weldType: nextRecord.input.weldType,
        quantity: nextRecord.input.quantity,
        totalCost: nextRecord.result.totalCost,
        createdAt: nextRecord.createdAt,
      },
      setNotice,
    );
  }

  function editEstimateRecord(record: EstimateRecordState) {
    updateEstimate("material", record.input.material);
    updateEstimate("thicknessMm", record.input.thicknessMm);
    updateEstimate("lengthMm", record.input.lengthMm);
    updateEstimate("weldType", record.input.weldType);
    updateEstimate("quantity", record.input.quantity);
    updateEstimate("location", record.input.location);
    updateEstimate("urgency", record.input.urgency);
    setViewingEstimateId(record.id);
  }

  function deleteEstimateRecord(recordId: string) {
    setEstimateRecords((records) => records.filter((record) => record.id !== recordId));
    setViewingEstimateId((current) => (current === recordId ? null : current));
    void syncGoogleSheet("Estimates", "delete", { id: recordId }, setNotice);
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
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
              onClick={saveEstimateRecord}
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
      </div>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={FileSpreadsheet} eyebrow="Riwayat" title="Cari, tampilkan, edit, hapus estimasi" />
          <label className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={estimateQuery}
              onChange={(event) => setEstimateQuery(event.target.value)}
              aria-label="Mencari estimasi"
              name="estimateSearch"
              className="field pl-9"
              placeholder="Cari estimasi..."
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-2">
            {filteredEstimates.map((record) => (
              <div key={record.id} className="rounded-lg border border-stone-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{record.project}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {record.input.material} | {record.input.weldType} | {record.createdAt}
                    </p>
                  </div>
                  <span className="text-sm font-bold">{formatRupiah(record.result.totalCost)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingEstimateId(record.id);
                      setNotice(`Detail estimasi ${record.project} ditampilkan`);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                  >
                    <Eye className="size-3" aria-hidden="true" />
                    Lihat
                  </button>
                  <button type="button" onClick={() => editEstimateRecord(record)} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100">
                    <Edit3 className="size-3" aria-hidden="true" />
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteEstimateRecord(record.id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                    <Trash2 className="size-3" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">Detail tampil</p>
            {viewingEstimate ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-semibold">{viewingEstimate.project}</p>
                <p className="text-stone-600">Material: {viewingEstimate.input.material}</p>
                <p className="text-stone-600">Jenis las: {viewingEstimate.input.weldType}</p>
                <p className="text-stone-600">Total: {formatRupiah(viewingEstimate.result.totalCost)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-500">Pilih estimasi untuk ditampilkan.</p>
            )}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function ProjectWorkspace({
  selectedRole,
  projectStageList,
  approveStage,
  advanceStage,
  regressStage,
  updateProjectStage,
  deleteProjectStage,
  setNotice,
}: {
  selectedRole: Role;
  projectStageList: ProjectStageState[];
  approveStage: (stageName: string) => void;
  advanceStage: (stageName: string) => void;
  regressStage: (stageName: string) => void;
  updateProjectStage: (stageName: string, nextStage: ProjectStageState) => void;
  deleteProjectStage: (stageName: string) => void;
  setNotice: (notice: string) => void;
}) {
  const canUpdate = canAccess(selectedRole, "project:update");
  const canApprove = canAccess(selectedRole, "project:approve");
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [stageDraft, setStageDraft] = useState<ProjectStageState | null>(null);
  const [stageQuery, setStageQuery] = useState("");
  const [viewingStageName, setViewingStageName] = useState(projectStageList[0]?.name ?? "");
  const filteredStages = projectStageList.filter((stage) =>
    matchesSearch(stageQuery, stage.name, stage.owner, stage.state, stage.start, stage.end),
  );
  const viewingStage = projectStageList.find((stage) => stage.name === viewingStageName);

  function startEdit(stage: ProjectStageState) {
    setEditingStage(stage.name);
    setStageDraft({ ...stage });
  }

  function cancelEdit() {
    setEditingStage(null);
    setStageDraft(null);
  }

  function updateDraft<K extends keyof ProjectStageState>(
    key: K,
    value: ProjectStageState[K],
  ) {
    setStageDraft((draft) => (draft ? { ...draft, [key]: value } : draft));
  }

  function saveStage(originalName: string) {
    if (!stageDraft) {
      return;
    }

    updateProjectStage(originalName, {
      ...stageDraft,
      name: stageDraft.name.trim() || originalName,
      progress: Math.min(100, Math.max(0, Number(stageDraft.progress) || 0)),
    });
    cancelEdit();
  }

  function removeStage(stageName: string) {
    deleteProjectStage(stageName);
    setViewingStageName((current) => (current === stageName ? "" : current));
    if (editingStage === stageName) {
      cancelEdit();
    }
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PanelTitle icon={ChartNoAxesGantt} eyebrow="Monitoring" title="Timeline proyek" />
        <label className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <input
            value={stageQuery}
            onChange={(event) => setStageQuery(event.target.value)}
            aria-label="Mencari tahap proyek"
            name="projectStageSearch"
            className="field pl-9"
            placeholder="Cari tahap proyek..."
          />
        </label>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="grid grid-cols-[1fr_78px_86px] gap-3 bg-stone-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-500 md:grid-cols-[1fr_90px_90px_260px]">
          <span>Tahap</span>
          <span>Mulai</span>
          <span>Selesai</span>
          <span className="hidden md:block">Aksi</span>
        </div>
        {filteredStages.map((stage) => {
          const editing = editingStage === stage.name ? stageDraft : null;

          return (
            <div key={stage.name} className="border-t border-stone-100 px-3 py-3">
              {editing ? (
                <div className="grid gap-2">
                  <div className="grid gap-2 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr]">
                    <input
                      name="projectStageName"
                      value={editing.name}
                      onChange={(event) => updateDraft("name", event.target.value)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                    <input
                      name="projectStageStart"
                      value={editing.start}
                      onChange={(event) => updateDraft("start", event.target.value)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                    <input
                      name="projectStageEnd"
                      value={editing.end}
                      onChange={(event) => updateDraft("end", event.target.value)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                    <input
                      name="projectStageProgress"
                      type="number"
                      min={0}
                      max={100}
                      value={editing.progress}
                      onChange={(event) =>
                        updateDraft("progress", Number(event.target.value))
                      }
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      name="projectStageOwner"
                      value={editing.owner}
                      onChange={(event) => updateDraft("owner", event.target.value)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                    <input
                      name="projectStageState"
                      value={editing.state}
                      onChange={(event) => updateDraft("state", event.target.value)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveStage(stage.name)}
                      className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      <X className="size-4" aria-hidden="true" />
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_78px_86px] gap-3 text-sm md:grid-cols-[1fr_90px_90px_260px] md:items-center">
                  <div>
                    <p className="font-semibold">{stage.name}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {stage.owner} | {stage.state}
                    </p>
                  </div>
                  <span className="text-stone-600">{stage.start}</span>
                  <span className="text-stone-600">{stage.end}</span>
                  <div className="col-span-3 flex flex-wrap gap-2 md:col-span-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingStageName(stage.name);
                        setNotice(`Detail tahap ${stage.name} ditampilkan`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      <Eye className="size-3" aria-hidden="true" />
                      Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceStage(stage.name)}
                      disabled={!canUpdate}
                      title={canUpdate ? "Tambah progress" : "Role ini tidak punya project:update"}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      + Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => regressStage(stage.name)}
                      disabled={!canUpdate}
                      title={canUpdate ? "Kurangi progress" : "Role ini tidak punya project:update"}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      - Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(stage)}
                      disabled={!canUpdate}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Edit3 className="size-3" aria-hidden="true" />
                      Edit / Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => approveStage(stage.name)}
                      disabled={!canApprove}
                      title={canApprove ? "Approve tahap" : "Role ini tidak punya project:approve"}
                      className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStage(stage.name)}
                      disabled={!canUpdate}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="size-3" aria-hidden="true" />
                      Hapus
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-3 h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${stage.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
          Detail tampil
        </p>
        {viewingStage ? (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p><span className="font-semibold">Tahap:</span> {viewingStage.name}</p>
            <p><span className="font-semibold">Owner:</span> {viewingStage.owner}</p>
            <p><span className="font-semibold">Progress:</span> {viewingStage.progress}%</p>
            <p><span className="font-semibold">Mulai:</span> {viewingStage.start}</p>
            <p><span className="font-semibold">Selesai:</span> {viewingStage.end}</p>
            <p><span className="font-semibold">Status:</span> {viewingStage.state}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">Pilih tahap untuk ditampilkan.</p>
        )}
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
  selectedRole,
  inventoryList,
  addInventoryDemoItem,
  markInventoryDamaged,
  updateInventoryItem,
  deleteInventoryItem,
  setNotice,
}: {
  selectedRole: Role;
  inventoryList: InventoryState[];
  addInventoryDemoItem: () => void;
  markInventoryDamaged: (code: string) => void;
  updateInventoryItem: (code: string, nextItem: InventoryState) => void;
  deleteInventoryItem: (code: string) => void;
  setNotice: (notice: string) => void;
}) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draftItem, setDraftItem] = useState<InventoryState | null>(null);
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [viewingInventoryCode, setViewingInventoryCode] = useState(inventoryList[0]?.code ?? "");
  const canEdit = canAccess(selectedRole, "inventory:manage");
  const filteredInventory = inventoryList.filter((item) =>
    matchesSearch(inventoryQuery, item.code, item.name, item.condition, item.location, item.stock),
  );
  const viewingInventory = inventoryList.find((item) => item.code === viewingInventoryCode);

  function startEdit(item: InventoryState) {
    setEditingCode(item.code);
    setDraftItem({ ...item });
  }

  function cancelEdit() {
    setEditingCode(null);
    setDraftItem(null);
  }

  function updateDraft<K extends keyof InventoryState>(key: K, value: InventoryState[K]) {
    setDraftItem((draft) => (draft ? { ...draft, [key]: value } : draft));
  }

  function saveDraft(originalCode: string) {
    if (!draftItem) {
      return;
    }

    updateInventoryItem(originalCode, draftItem);
    cancelEdit();
  }

  function removeInventoryItem(code: string) {
    deleteInventoryItem(code);
    setViewingInventoryCode((current) => (current === code ? "" : current));
    if (editingCode === code) {
      cancelEdit();
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.7fr]">
      <Panel>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <PanelTitle icon={Package} eyebrow="Inventaris" title="Alat dan bahan" />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:w-[520px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
              <input
                value={inventoryQuery}
                onChange={(event) => setInventoryQuery(event.target.value)}
                aria-label="Mencari inventaris"
                name="inventorySearch"
                className="field pl-9"
                placeholder="Cari inventaris..."
              />
            </label>
            <button
              type="button"
              onClick={addInventoryDemoItem}
              disabled={!canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah item
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filteredInventory.map((item) => {
            const editingItem = editingCode === item.code ? draftItem : null;

            return (
              <div key={item.code} className="rounded-lg border border-stone-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 font-mono text-xs text-stone-500">{item.code}</p>
                  </div>
                  <ConditionBadge condition={item.condition} />
                </div>

                {editingItem ? (
                  <div className="mt-3 grid gap-2">
                    <label className="grid gap-1 text-xs font-semibold text-stone-600">
                      Nama alat/bahan
                      <input
                        name="inventoryName"
                        value={editingItem.name}
                        onChange={(event) => updateDraft("name", event.target.value)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-500"
                      />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs font-semibold text-stone-600">
                        Kode
                        <input
                          name="inventoryCode"
                          value={editingItem.code}
                          onChange={(event) => updateDraft("code", event.target.value)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-500"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-stone-600">
                        Kondisi
                        <select
                          name="inventoryCondition"
                          value={editingItem.condition}
                          onChange={(event) => updateDraft("condition", event.target.value)}
                          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-500"
                        >
                          <option value="Baik">Baik</option>
                          <option value="Service">Service</option>
                          <option value="Kritis">Kritis</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="grid gap-1 text-xs font-semibold text-stone-600">
                        Lokasi
                        <input
                          name="inventoryLocation"
                          value={editingItem.location}
                          onChange={(event) => updateDraft("location", event.target.value)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-500"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-stone-600">
                        Umur
                        <input
                          name="inventoryAge"
                          value={editingItem.age}
                          onChange={(event) => updateDraft("age", event.target.value)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-500"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-stone-600">
                        Stok
                        <input
                          name="inventoryStock"
                          value={editingItem.stock}
                          onChange={(event) => updateDraft("stock", event.target.value)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-500"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveDraft(item.code)}
                        className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                      >
                        <Save className="size-4" aria-hidden="true" />
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        <X className="size-4" aria-hidden="true" />
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-stone-500">
                      <span>{item.location}</span>
                      <span>{item.age}</span>
                      <span className="text-right font-semibold text-stone-700">{item.stock}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingInventoryCode(item.code);
                          setNotice(`Detail inventaris ${item.name} ditampilkan`);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        Lihat
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={!canEdit}
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Edit3 className="size-4" aria-hidden="true" />
                        Edit / Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => markInventoryDamaged(item.code)}
                        disabled={!canEdit}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Laporkan kerusakan
                      </button>
                      <button
                        type="button"
                        onClick={() => removeInventoryItem(item.code)}
                        disabled={!canEdit}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Detail tampil
          </p>
          {viewingInventory ? (
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <p><span className="font-semibold">Nama:</span> {viewingInventory.name}</p>
              <p><span className="font-semibold">Kode:</span> {viewingInventory.code}</p>
              <p><span className="font-semibold">Kondisi:</span> {viewingInventory.condition}</p>
              <p><span className="font-semibold">Lokasi:</span> {viewingInventory.location}</p>
              <p><span className="font-semibold">Umur:</span> {viewingInventory.age}</p>
              <p><span className="font-semibold">Stok:</span> {viewingInventory.stock}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Pilih inventaris untuk ditampilkan.</p>
          )}
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

function PortfolioWorkspace({ setNotice }: { setNotice: (notice: string) => void }) {
  const [items, setItems] = usePersistentState<PortfolioState[]>(
    "welddesign.portfolios",
    () =>
    portfolioItems.map((item, index) => ({
      id: `portfolio-${index}`,
      title: item.title,
      student: item.student,
      major: item.major,
      year: item.year,
      rating: item.rating,
      summary: `${item.student} membuat karya ${item.title} untuk jurusan ${item.major}.`,
      pdfName: `${item.student.toLowerCase().replace(/\s+/g, "-")}-portfolio.pdf`,
    })),
  );
  const [draft, setDraft] = usePersistentState<PortfolioState>("welddesign.portfolioDraft", {
    id: "draft",
    title: "Railing tangga minimalis",
    student: "Nama Siswa",
    major: "Teknik Las",
    year: "2026",
    rating: 4.7,
    summary: "",
    pdfName: "portfolio-siswa.pdf",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const [viewingPortfolioId, setViewingPortfolioId] = useState(items[0]?.id ?? "");
  const filteredPortfolios = items.filter((item) =>
    matchesSearch(portfolioQuery, item.title, item.student, item.major, item.year, item.summary),
  );
  const viewingPortfolio = items.find((item) => item.id === viewingPortfolioId);

  function updateDraft<K extends keyof PortfolioState>(key: K, value: PortfolioState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function autoMakePortfolio() {
    setDraft((current) => ({
      ...current,
      summary: `${current.student} - ${current.major} ${current.year}. Karya utama: ${current.title}. Portofolio otomatis siap dibagikan dan dicetak.`,
      pdfName: `${current.student.toLowerCase().replace(/\s+/g, "-") || "portfolio"}-${current.year}.pdf`,
    }));
    setNotice("Portofolio otomatis dibuat dari isian");
  }

  function savePortfolio() {
    const nextItem = {
      ...draft,
      id: editingId ?? `portfolio-${Date.now()}`,
      title: draft.title.trim() || "Portofolio baru",
      student: draft.student.trim() || "Siswa",
      summary:
        draft.summary.trim() ||
        `${draft.student} membuat ${draft.title} sebagai karya portofolio.`,
    };

    setItems((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? nextItem : item))
        : [nextItem, ...current],
    );
    setEditingId(null);
    setNotice(editingId ? "Portofolio berhasil diedit" : "Portofolio baru dibuat");
    void syncGoogleSheet("Portfolio", "upsert", nextItem, setNotice);
  }

  function editPortfolio(item: PortfolioState) {
    setDraft(item);
    setEditingId(item.id);
  }

  function printPortfolio(item: PortfolioState) {
    setNotice(`Membuka print PDF untuk ${item.pdfName}`);
    window.print();
  }

  function deletePortfolio(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setViewingPortfolioId((current) => (current === itemId ? "" : current));
    setEditingId((current) => (current === itemId ? null : current));
    setNotice("Portofolio dihapus");
    void syncGoogleSheet("Portfolio", "delete", { id: itemId }, setNotice);
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
      <Panel>
        <PanelTitle
          icon={Share2}
          eyebrow={editingId ? "Edit" : "Create"}
          title="Auto portfolio builder"
        />
        <div className="mt-4 grid gap-3">
          <input
            name="portfolioTitle"
            value={draft.title}
            onChange={(event) => updateDraft("title", event.target.value)}
            className="field"
            placeholder="Judul karya"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="portfolioStudent"
              value={draft.student}
              onChange={(event) => updateDraft("student", event.target.value)}
              className="field"
              placeholder="Nama siswa"
            />
            <input
              name="portfolioMajor"
              value={draft.major}
              onChange={(event) => updateDraft("major", event.target.value)}
              className="field"
              placeholder="Jurusan"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="portfolioYear"
              value={draft.year}
              onChange={(event) => updateDraft("year", event.target.value)}
              className="field"
              placeholder="Tahun"
            />
            <input
              name="portfolioRating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={draft.rating}
              onChange={(event) => updateDraft("rating", Number(event.target.value))}
              className="field"
              placeholder="Rating"
            />
          </div>
          <textarea
            name="portfolioSummary"
            value={draft.summary}
            onChange={(event) => updateDraft("summary", event.target.value)}
            className="field min-h-28 resize-none"
            placeholder="Ringkasan otomatis akan dibuat dari isian"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={autoMakePortfolio}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-stone-100"
            >
              Auto make
            </button>
            <button
              type="button"
              onClick={savePortfolio}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              <Plus className="size-4" aria-hidden="true" />
              {editingId ? "Simpan edit" : "Simpan portofolio"}
            </button>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={FileText} eyebrow="Portofolio" title="Karya siswa" />
          <label className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={portfolioQuery}
              onChange={(event) => setPortfolioQuery(event.target.value)}
              aria-label="Mencari portofolio"
              name="portfolioSearch"
              className="field pl-9"
              placeholder="Cari portofolio..."
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredPortfolios.map((item) => (
            <article key={item.id} className="rounded-lg border border-stone-200 bg-white p-4">
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
              <p className="mt-3 text-sm leading-6 text-stone-600">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingPortfolioId(item.id);
                    setNotice(`Detail portofolio ${item.title} ditampilkan`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Eye className="size-3" aria-hidden="true" />
                  Lihat
                </button>
                <button
                  type="button"
                  onClick={() => editPortfolio(item)}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Edit3 className="size-3" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => printPortfolio(item)}
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  <FileText className="size-3" aria-hidden="true" />
                  Print PDF
                </button>
                <button
                  type="button"
                  onClick={() => setNotice(`Link publik ${item.student} disiapkan`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Copy className="size-3" aria-hidden="true" />
                  Share link
                </button>
                <button
                  type="button"
                  onClick={() => deletePortfolio(item.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Detail tampil
          </p>
          {viewingPortfolio ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold">{viewingPortfolio.title}</p>
              <p className="text-stone-600">
                {viewingPortfolio.student} | {viewingPortfolio.major} | {viewingPortfolio.year}
              </p>
              <p className="leading-6 text-stone-600">{viewingPortfolio.summary}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Pilih portofolio untuk ditampilkan.</p>
          )}
        </div>
      </Panel>
    </section>
  );
}

function AutomationWorkspace({ setNotice }: { setNotice: (notice: string) => void }) {
  const [automations, setAutomations] = usePersistentState<AutomationState[]>(
    "welddesign.automations",
    [
      {
      id: "automation-1",
      name: "WeldDesign Spreadsheet Builder",
      spreadsheetName: "WeldDesign Production Data",
      script: defaultSpreadsheetAppsScript,
      webAppUrl: "",
      status: "Script siap dipasang ke Apps Script",
      createdAt: "Default",
      lastRun: "-",
    },
    ],
  );
  const [draft, setDraft] = usePersistentState<AutomationState>(
    "welddesign.automationDraft",
    automations[0],
  );
  const [automationQuery, setAutomationQuery] = useState("");
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const [viewingAutomationId, setViewingAutomationId] = useState(automations[0]?.id ?? "");
  const filteredAutomations = automations.filter((automation) =>
    matchesSearch(
      automationQuery,
      automation.name,
      automation.spreadsheetName,
      automation.status,
      automation.webAppUrl,
    ),
  );
  const viewingAutomation = automations.find((automation) => automation.id === viewingAutomationId);

  function updateAutomationDraft<K extends keyof AutomationState>(
    key: K,
    value: AutomationState[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveAutomation() {
    const nextAutomation: AutomationState = {
      ...draft,
      id: editingAutomationId ?? `automation-${Date.now()}`,
      name: draft.name.trim() || "Automation Spreadsheet",
      spreadsheetName: draft.spreadsheetName.trim() || "WeldDesign Production Data",
      script: draft.script.trim() || defaultSpreadsheetAppsScript,
      status: "Script tersimpan",
      createdAt: editingAutomationId ? draft.createdAt : new Date().toLocaleString("id-ID"),
    };

    setAutomations((current) =>
      editingAutomationId
        ? current.map((automation) =>
            automation.id === editingAutomationId ? nextAutomation : automation,
          )
        : [nextAutomation, ...current],
    );
    setViewingAutomationId(nextAutomation.id);
    setEditingAutomationId(null);
    setDraft(nextAutomation);
    setNotice("Automation spreadsheet disimpan");
    window.localStorage.setItem("welddesign.automationDraft", JSON.stringify(nextAutomation));
    void syncGoogleSheet("Automation", "upsert", nextAutomation, setNotice);
  }

  function editAutomation(automation: AutomationState) {
    setEditingAutomationId(automation.id);
    setDraft(automation);
  }

  function deleteAutomation(automationId: string) {
    setAutomations((current) =>
      current.filter((automation) => automation.id !== automationId),
    );
    setViewingAutomationId((current) => (current === automationId ? "" : current));
    setEditingAutomationId((current) => (current === automationId ? null : current));
    setNotice("Automation dihapus");
    void syncGoogleSheet("Automation", "delete", { id: automationId }, setNotice);
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(draft.script);
      setNotice("Apps Script disalin");
    } catch {
      setNotice("Browser tidak mengizinkan copy otomatis");
    }
  }

  function exportSpreadsheetTemplate() {
    downloadCsvFile("welddesign-spreadsheet-template.csv", [
      ["Sheet", "Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6"],
      ["Orders", "Order ID", "Client", "Status", "Progress", "Issue", "Accepted"],
      ["Projects", "Project", "Owner", "Start", "End", "Progress", "State"],
      ["Inventory", "Code", "Name", "Condition", "Location", "Age", "Stock"],
      ["Learning", "Title", "Type", "Score", "Progress", "Sheet URL", ""],
    ]);
    setNotice("Template spreadsheet CSV dibuat");
  }

  function runAutomation(automation: AutomationState) {
    if (!automation.webAppUrl.trim()) {
      setNotice("Isi Web App URL dari Apps Script dulu");
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = automation.webAppUrl.trim();
    form.target = "_blank";

    const payloadInput = document.createElement("input");
    payloadInput.type = "hidden";
    payloadInput.name = "payload";
    payloadInput.value = JSON.stringify({
      spreadsheetName: automation.spreadsheetName,
      source: "WeldDesign Production",
    });
    form.appendChild(payloadInput);
    document.body.appendChild(form);
    form.submit();
    form.remove();

    const lastRun = new Date().toLocaleString("id-ID");
    setAutomations((current) =>
      current.map((item) =>
        item.id === automation.id
          ? { ...item, status: "Request spreadsheet dikirim ke Apps Script", lastRun }
          : item,
      ),
    );
    setNotice("Automation dijalankan di tab baru");
    void syncGoogleSheet(
      "Automation",
      "upsert",
      { ...automation, status: "Request spreadsheet dikirim ke Apps Script", lastRun },
      setNotice,
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
      <Panel>
        <PanelTitle icon={DatabaseBackup} eyebrow="Automation" title="Apps Script to Spreadsheet" />
        <div className="mt-4 grid gap-3">
          <Field label="Nama automation">
            <input
              name="automationName"
              value={draft.name}
              onChange={(event) => updateAutomationDraft("name", event.target.value)}
              className="field"
            />
          </Field>
          <Field label="Nama spreadsheet">
            <input
              name="automationSpreadsheetName"
              value={draft.spreadsheetName}
              onChange={(event) =>
                updateAutomationDraft("spreadsheetName", event.target.value)
              }
              className="field"
            />
          </Field>
          <Field label="Web App URL">
            <input
              name="automationWebAppUrl"
              value={draft.webAppUrl}
              onChange={(event) => updateAutomationDraft("webAppUrl", event.target.value)}
              className="field"
              placeholder="https://script.google.com/macros/s/..."
            />
          </Field>
          <Field label="Apps Script">
            <textarea
              name="automationScript"
              value={draft.script}
              onChange={(event) => updateAutomationDraft("script", event.target.value)}
              className="field min-h-72 resize-y font-mono text-xs leading-5"
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={saveAutomation}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              <Save className="size-4" aria-hidden="true" />
              Simpan automation
            </button>
            <button
              type="button"
              onClick={copyScript}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy Apps Script
            </button>
            <a
              href="https://script.google.com/home/projects/create"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100"
            >
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Buka Apps Script
            </a>
            <button
              type="button"
              onClick={exportSpreadsheetTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100"
            >
              <Download className="size-4" aria-hidden="true" />
              Export template CSV
            </button>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={Activity} eyebrow="Run" title="Automation tersimpan" />
          <label className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={automationQuery}
              onChange={(event) => setAutomationQuery(event.target.value)}
              aria-label="Mencari automation"
              name="automationSearch"
              className="field pl-9"
              placeholder="Cari automation..."
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filteredAutomations.map((automation) => (
            <article key={automation.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{automation.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {automation.spreadsheetName} | {automation.createdAt}
                  </p>
                </div>
                <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-900">
                  {automation.lastRun}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{automation.status}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingAutomationId(automation.id);
                    setNotice(`Detail automation ${automation.name} ditampilkan`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Eye className="size-3" aria-hidden="true" />
                  Lihat
                </button>
                <button
                  type="button"
                  onClick={() => editAutomation(automation)}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Edit3 className="size-3" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => runAutomation(automation)}
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  <RefreshCw className="size-3" aria-hidden="true" />
                  Buat Spreadsheet
                </button>
                <button
                  type="button"
                  onClick={() => deleteAutomation(automation.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Detail tampil
          </p>
          {viewingAutomation ? (
            <div className="mt-3 space-y-2 text-sm text-stone-600">
              <p className="font-semibold text-stone-950">{viewingAutomation.name}</p>
              <p>Spreadsheet: {viewingAutomation.spreadsheetName}</p>
              <p>Status: {viewingAutomation.status}</p>
              <p>Web App URL: {viewingAutomation.webAppUrl || "Belum diisi"}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Pilih automation untuk ditampilkan.</p>
          )}
        </div>
      </Panel>
    </section>
  );
}

function SocialWorkspace({
  scheduledPosts,
  socialDraft,
  setSocialDraft,
  scheduleSocialPost,
  updateScheduledPost,
  deleteScheduledPost,
  setNotice,
}: {
  scheduledPosts: SocialPostState[];
  socialDraft: { platform: string; caption: string; scheduledAt: string };
  setSocialDraft: (draft: { platform: string; caption: string; scheduledAt: string }) => void;
  scheduleSocialPost: () => void;
  updateScheduledPost: (originalKey: string, nextPost: SocialPostState) => void;
  deleteScheduledPost: (postKey: string) => void;
  setNotice: (notice: string) => void;
}) {
  const [socialQuery, setSocialQuery] = useState("");
  const [editingPostKey, setEditingPostKey] = useState<string | null>(null);
  const [viewingPostKey, setViewingPostKey] = useState(
    scheduledPosts[0] ? socialPostKey(scheduledPosts[0]) : "",
  );
  const filteredPosts = scheduledPosts.filter((post) =>
    matchesSearch(socialQuery, post.platform, post.caption, post.time, post.engagement),
  );
  const viewingPost = scheduledPosts.find((post) => socialPostKey(post) === viewingPostKey);

  function saveSocialPost() {
    if (!editingPostKey) {
      scheduleSocialPost();
      return;
    }

    updateScheduledPost(editingPostKey, {
      platform: socialDraft.platform,
      caption: socialDraft.caption,
      time: socialDraft.scheduledAt.replace("T", " "),
      engagement: "Diedit",
    });
    setEditingPostKey(null);
  }

  function editSocialPost(post: SocialPostState) {
    setEditingPostKey(socialPostKey(post));
    setSocialDraft({
      platform: post.platform,
      caption: post.caption,
      scheduledAt: post.time.includes(" ") ? post.time.replace(" ", "T") : socialDraft.scheduledAt,
    });
  }

  function removeSocialPost(post: SocialPostState) {
    const key = socialPostKey(post);
    deleteScheduledPost(key);
    setViewingPostKey((current) => (current === key ? "" : current));
    setEditingPostKey((current) => (current === key ? null : current));
  }

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
            onClick={saveSocialPost}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            {editingPostKey ? <Save className="size-4" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            {editingPostKey ? "Simpan post" : "Simpan jadwal"}
          </button>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={Activity} eyebrow="Queue" title="Post terjadwal" />
          <label className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={socialQuery}
              onChange={(event) => setSocialQuery(event.target.value)}
              aria-label="Mencari post sosmed"
              name="socialSearch"
              className="field pl-9"
              placeholder="Cari post..."
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <div key={socialPostKey(post)} className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{post.platform}</p>
                <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-900">
                  {post.engagement}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{post.caption}</p>
              <p className="mt-2 text-xs font-semibold text-stone-500">{post.time}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingPostKey(socialPostKey(post));
                    setNotice(`Detail post ${post.platform} ditampilkan`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Eye className="size-3" aria-hidden="true" />
                  Lihat
                </button>
                <button type="button" onClick={() => editSocialPost(post)} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100">
                  <Edit3 className="size-3" aria-hidden="true" />
                  Edit
                </button>
                <button type="button" onClick={() => removeSocialPost(post)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                  <Trash2 className="size-3" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">Detail tampil</p>
          {viewingPost ? (
            <p className="mt-3 text-sm text-stone-600">
              {viewingPost.platform} pada {viewingPost.time}: {viewingPost.caption} ({viewingPost.engagement}).
            </p>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Pilih post untuk ditampilkan.</p>
          )}
        </div>
      </Panel>
    </section>
  );
}

function LearningWorkspace({
  selectedRole,
  setNotice,
}: {
  selectedRole: Role;
  setNotice: (notice: string) => void;
}) {
  const canEditLearning = selectedRole === "GURU";
  const googleFormsCreateUrl = "https://docs.google.com/forms/create";
  const googleSheetsCreateUrl = "https://docs.google.com/spreadsheets/create";
  const [modules, setModules] = usePersistentState<LearningState[]>(
    "welddesign.learningModules",
    () =>
    learningModules.map((module, index) => ({
      id: `learning-${index}`,
      title: module.title,
      type: module.kind,
      description: module.description,
      progress: module.progress,
      score: module.score,
      corrected:
        module.kind === "Materi" ? "Materi siap di-download" : "Menunggu response Google Form",
      materialFileName: module.materialFileName,
      materialBody: module.materialBody,
      formUrl: module.formUrl,
      sheetUrl: module.sheetUrl,
    })),
  );

  const [materialDraft, setMaterialDraft] = usePersistentState<LearningState>(
    "welddesign.materialDraft",
    {
    id: "material-draft",
    title: "Materi inspeksi visual sambungan las",
    type: "Materi",
    description: "Upload PDF atau tulis ringkasan materi untuk siswa.",
    progress: 0,
    score: 0,
    corrected: "Draft materi",
    materialFileName: "materi-inspeksi-visual.txt",
    materialBody:
      "Materi inspeksi visual: cek undercut, porosity, overlap, spatter, dan dokumentasi before-after.",
    },
  );
  const [questionDraft, setQuestionDraft] = usePersistentState<LearningState>(
    "welddesign.questionDraft",
    {
    id: "question-draft",
    title: "Soal QC Visual",
    type: "Soal",
    description: "Soal memakai Google Form. Response diarahkan ke Google Spreadsheet.",
    progress: 0,
    score: 0,
    corrected: "Draft soal",
    formUrl: googleFormsCreateUrl,
    sheetUrl: googleSheetsCreateUrl,
    },
  );
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [learningQuery, setLearningQuery] = useState("");
  const [viewingLearningId, setViewingLearningId] = useState(modules[0]?.id ?? "");
  const filteredModules = modules.filter((module) =>
    matchesSearch(
      learningQuery,
      module.title,
      module.type,
      module.description,
      module.corrected,
      module.score,
    ),
  );
  const viewingLearning = modules.find((module) => module.id === viewingLearningId);

  function updateMaterialDraft<K extends keyof LearningState>(
    key: K,
    value: LearningState[K],
  ) {
    setMaterialDraft((current) => ({ ...current, [key]: value }));
  }

  function updateQuestionDraft<K extends keyof LearningState>(
    key: K,
    value: LearningState[K],
  ) {
    setQuestionDraft((current) => ({ ...current, [key]: value }));
  }

  function uploadMaterial(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    setMaterialDraft((current) => ({
      ...current,
      materialFileName: file.name,
      materialDownloadUrl: fileUrl,
      materialBody: `File upload: ${file.name}`,
    }));
    setNotice(`Materi "${file.name}" siap dipakai`);
  }

  function saveMaterialItem() {
    if (!canEditLearning) {
      return;
    }

    const nextModule = {
      ...materialDraft,
      id: editingMaterialId ?? `material-${Date.now()}`,
      type: "Materi" as const,
      title: materialDraft.title.trim() || "Materi baru",
      description: materialDraft.description.trim() || "Materi belum punya deskripsi.",
      materialFileName: materialDraft.materialFileName?.trim() || "materi-welddesign.txt",
      corrected: "Materi siap di-download",
    };

    setModules((current) =>
      editingMaterialId
        ? current.map((module) => (module.id === editingMaterialId ? nextModule : module))
        : [nextModule, ...current],
    );
    setEditingMaterialId(null);
    setNotice(editingMaterialId ? "Materi berhasil diedit" : "Materi berhasil dibuat");
    void syncGoogleSheet("Learning", "upsert", nextModule, setNotice);
  }

  function saveQuestionItem() {
    if (!canEditLearning) {
      return;
    }

    const nextModule = {
      ...questionDraft,
      id: editingQuestionId ?? `question-${Date.now()}`,
      type: "Soal" as const,
      title: questionDraft.title.trim() || "Soal baru",
      description:
        questionDraft.description.trim() ||
        "Soal memakai Google Form dan response masuk Google Spreadsheet.",
      formUrl: questionDraft.formUrl?.trim() || googleFormsCreateUrl,
      sheetUrl: questionDraft.sheetUrl?.trim() || googleSheetsCreateUrl,
      corrected: "Google Form siap dibuka",
    };

    setModules((current) =>
      editingQuestionId
        ? current.map((module) => (module.id === editingQuestionId ? nextModule : module))
        : [nextModule, ...current],
    );
    setEditingQuestionId(null);
    setNotice(editingQuestionId ? "Soal berhasil diedit" : "Soal Google Form berhasil dibuat");
    void syncGoogleSheet("Learning", "upsert", nextModule, setNotice);
  }

  function editLearningItem(module: LearningState) {
    if (module.type === "Materi") {
      setMaterialDraft(module);
      setEditingMaterialId(module.id);
      setEditingQuestionId(null);
    } else {
      setQuestionDraft(module);
      setEditingQuestionId(module.id);
      setEditingMaterialId(null);
    }
  }

  function automaticCorrection(moduleId: string) {
    const currentModule = modules.find((module) => module.id === moduleId);
    setModules((current) =>
      current.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              progress: module.type === "Soal" ? 100 : module.progress,
              score: module.type === "Soal" ? Math.min(100, Math.max(75, module.score + 18)) : module.score,
              corrected:
                module.type === "Soal"
                  ? "Google Form auto correction selesai"
                  : "Materi tidak membutuhkan koreksi soal",
            }
          : module,
      ),
    );
    setNotice("Koreksi otomatis diperbarui");
    if (currentModule) {
      void syncGoogleSheet(
        "Learning",
        "upsert",
        {
          ...currentModule,
          progress: currentModule.type === "Soal" ? 100 : currentModule.progress,
          score:
            currentModule.type === "Soal"
              ? Math.min(100, Math.max(75, currentModule.score + 18))
              : currentModule.score,
          corrected:
            currentModule.type === "Soal"
              ? "Google Form auto correction selesai"
              : "Materi tidak membutuhkan koreksi soal",
        },
        setNotice,
      );
    }
  }

  function markMaterialOpened(moduleId: string) {
    setModules((current) =>
      current.map((module) =>
        module.id === moduleId
          ? { ...module, progress: Math.max(module.progress, 100), corrected: "Materi sudah dibuka" }
          : module,
      ),
    );
  }

  function materialDownloadHref(module: LearningState) {
    if (module.materialDownloadUrl) {
      return module.materialDownloadUrl;
    }

    const body = module.materialBody?.trim() || module.description;
    return `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`;
  }

  function deleteLearningItem(moduleId: string) {
    if (!canEditLearning) {
      return;
    }

    setModules((current) => current.filter((module) => module.id !== moduleId));
    setViewingLearningId((current) => (current === moduleId ? "" : current));
    setEditingMaterialId((current) => (current === moduleId ? null : current));
    setEditingQuestionId((current) => (current === moduleId ? null : current));
    setNotice("Materi/soal dihapus");
    void syncGoogleSheet("Learning", "delete", { id: moduleId }, setNotice);
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
      <div className="grid gap-4">
        <Panel>
          <PanelTitle icon={FileText} eyebrow="Create materi" title="Upload dan download materi" />
          <div className="mt-4 grid gap-3">
            <Field label="Judul materi">
              <input
                name="materialTitle"
                value={materialDraft.title}
                onChange={(event) => updateMaterialDraft("title", event.target.value)}
                disabled={!canEditLearning}
                className="field disabled:bg-stone-100 disabled:text-stone-400"
              />
            </Field>
            <Field label="Upload materi">
              <input
                name="materialFile"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={uploadMaterial}
                disabled={!canEditLearning}
                className="field file:mr-3 file:rounded-md file:border-0 file:bg-stone-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:bg-stone-100 disabled:text-stone-400"
              />
            </Field>
            <Field label="Ringkasan materi">
              <textarea
                name="materialDescription"
                value={materialDraft.description}
                onChange={(event) => updateMaterialDraft("description", event.target.value)}
                disabled={!canEditLearning}
                className="field min-h-20 resize-none disabled:bg-stone-100 disabled:text-stone-400"
              />
            </Field>
            <button
              type="button"
              onClick={saveMaterialItem}
              disabled={!canEditLearning}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <Plus className="size-4" aria-hidden="true" />
              {editingMaterialId ? "Simpan materi" : "Simpan materi"}
            </button>
          </div>
        </Panel>

        <Panel>
          <PanelTitle icon={FileSpreadsheet} eyebrow="Create soal" title="Integrasi Google Form" />
          <div className="mt-4 grid gap-3">
            <Field label="Judul soal">
              <input
                name="questionTitle"
                value={questionDraft.title}
                onChange={(event) => updateQuestionDraft("title", event.target.value)}
                disabled={!canEditLearning}
                className="field disabled:bg-stone-100 disabled:text-stone-400"
              />
            </Field>
            <Field label="Link Google Form">
              <input
                name="questionFormUrl"
                value={questionDraft.formUrl}
                onChange={(event) => updateQuestionDraft("formUrl", event.target.value)}
                disabled={!canEditLearning}
                className="field disabled:bg-stone-100 disabled:text-stone-400"
                placeholder="https://docs.google.com/forms/..."
              />
            </Field>
            <Field label="Google Sheet jawaban">
              <input
                name="questionSheetUrl"
                value={questionDraft.sheetUrl}
                onChange={(event) => updateQuestionDraft("sheetUrl", event.target.value)}
                disabled={!canEditLearning}
                className="field disabled:bg-stone-100 disabled:text-stone-400"
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </Field>
            <Field label="Instruksi">
              <textarea
                name="questionDescription"
                value={questionDraft.description}
                onChange={(event) => updateQuestionDraft("description", event.target.value)}
                disabled={!canEditLearning}
                className="field min-h-20 resize-none disabled:bg-stone-100 disabled:text-stone-400"
              />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={googleFormsCreateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100"
              >
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Buat Form
              </a>
              <button
                type="button"
                onClick={saveQuestionItem}
                disabled={!canEditLearning}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                <Plus className="size-4" aria-hidden="true" />
                {editingQuestionId ? "Simpan soal" : "Simpan soal"}
              </button>
            </div>
            {!canEditLearning && (
              <p className="rounded-lg bg-stone-100 p-3 text-xs font-semibold text-stone-500">
                Create dan edit materi/soal hanya untuk Guru. Siswa dan Client tetap bisa membuka materi atau soal yang tersedia.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={BookOpenCheck} eyebrow="E-Learning" title="Materi dan soal aktif" />
          <label className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={learningQuery}
              onChange={(event) => setLearningQuery(event.target.value)}
              aria-label="Mencari materi atau soal"
              name="learningSearch"
              className="field pl-9"
              placeholder="Cari materi atau soal..."
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredModules.map((module) => (
            <div key={module.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{module.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {module.type} | {module.description}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${
                    module.type === "Materi"
                      ? "bg-cyan-100 text-cyan-900"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {module.type === "Materi" ? "Download" : `Score ${module.score}`}
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${module.progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-semibold text-stone-500">
                {module.corrected}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingLearningId(module.id);
                    setNotice(`Detail ${module.type.toLowerCase()} ${module.title} ditampilkan`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Eye className="size-3" aria-hidden="true" />
                  Lihat
                </button>
                {module.type === "Materi" ? (
                  <a
                    href={materialDownloadHref(module)}
                    download={module.materialFileName ?? `${module.title}.txt`}
                    onClick={() => markMaterialOpened(module.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                  >
                    <Download className="size-3" aria-hidden="true" />
                    Download materi
                  </a>
                ) : (
                  <>
                    <a
                      href={module.formUrl?.trim() || googleFormsCreateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                    >
                      <Play className="size-3" aria-hidden="true" />
                      Buka soal
                    </a>
                    <button
                      type="button"
                      onClick={() => automaticCorrection(module.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                    >
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Automatic correction
                    </button>
                    <a
                      href={module.sheetUrl?.trim() || googleSheetsCreateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                    >
                      <FileSpreadsheet className="size-3" aria-hidden="true" />
                      Sheet jawaban
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => editLearningItem(module)}
                  disabled={!canEditLearning}
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  <Edit3 className="size-3" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteLearningItem(module.id)}
                  disabled={!canEditLearning}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Detail tampil
          </p>
          {viewingLearning ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold">{viewingLearning.title}</p>
              <p className="text-stone-600">{viewingLearning.type} | {viewingLearning.description}</p>
              <p className="text-stone-600">Progress {viewingLearning.progress}% | Score {viewingLearning.score}</p>
              <p className="text-stone-600">{viewingLearning.corrected}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Pilih materi atau soal untuk ditampilkan.</p>
          )}
        </div>
      </Panel>
    </section>
  );
}

function ClientWorkspace({
  selectedRole,
  projectStageList,
  approveStage,
  setNotice,
}: {
  selectedRole: Role;
  projectStageList: ProjectStageState[];
  approveStage: (stageName: string) => void;
  setNotice: (notice: string) => void;
}) {
  const canApprove = canAccess(selectedRole, "project:approve");
  const canManageClientOrder = selectedRole !== "CLIENT";
  const [orders, setOrders] = usePersistentState<ClientOrderState[]>(
    "welddesign.clientOrders",
    [
      {
      id: "order-1",
      title: "Kanopi baja ringan B-21",
      client: "Client Portal",
      issue: "Order baru menunggu survey dan approval tim.",
      status: "Order baru",
      progress: 0,
      approved: false,
      accepted: false,
    },
    ],
  );
  const [draftOrder, setDraftOrder] = usePersistentState("welddesign.clientOrderDraft", {
    title: "Pagar workshop sekolah",
    client: currentClientLabel(selectedRole),
    issue: "Butuh estimasi dan jadwal survey.",
  });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderQuery, setOrderQuery] = useState("");
  const [viewingOrderId, setViewingOrderId] = useState(orders[0]?.id ?? "");
  const filteredOrders = orders.filter((order) =>
    matchesSearch(orderQuery, order.title, order.client, order.issue, order.status, order.progress),
  );
  const viewingOrder = orders.find((order) => order.id === viewingOrderId);

  function createOrder() {
    const existingOrder = editingOrderId
      ? orders.find((order) => order.id === editingOrderId)
      : null;
    const nextOrder: ClientOrderState = {
      id: editingOrderId ?? `order-${Date.now()}`,
      title: draftOrder.title.trim() || "Order baru",
      client: draftOrder.client.trim() || "Client",
      issue: draftOrder.issue.trim() || "Belum ada catatan masalah.",
      status: editingOrderId ? existingOrder?.status ?? "Order diedit" : "Order baru",
      progress: editingOrderId ? existingOrder?.progress ?? 0 : 0,
      approved: editingOrderId ? existingOrder?.approved ?? false : false,
      accepted: editingOrderId ? existingOrder?.accepted ?? false : false,
    };

    setOrders((current) =>
      editingOrderId
        ? current.map((order) => (order.id === editingOrderId ? nextOrder : order))
        : [nextOrder, ...current],
    );
    setEditingOrderId(null);
    setNotice(editingOrderId ? "Order berhasil diedit" : "Order client dibuat");
    void syncGoogleSheet("Orders", "upsert", nextOrder, setNotice);
  }

  function editOrder(order: ClientOrderState) {
    if (!canManageClientOrder) {
      return;
    }

    setDraftOrder({
      title: order.title,
      client: order.client,
      issue: order.issue,
    });
    setEditingOrderId(order.id);
  }

  function updateOrderProgress(orderId: string, progress: number) {
    if (!canManageClientOrder) {
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              progress,
              accepted: false,
              status: progress >= 100 ? "Siap finish" : "Progress diperbarui",
            }
          : order,
      ),
    );
    const currentOrder = orders.find((order) => order.id === orderId);
    if (currentOrder) {
      void syncGoogleSheet(
        "Orders",
        "upsert",
        {
          ...currentOrder,
          progress,
          accepted: false,
          status: progress >= 100 ? "Siap finish" : "Progress diperbarui",
        },
        setNotice,
      );
    }
  }

  function finishOrder(orderId: string) {
    if (!canManageClientOrder) {
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              progress: 100,
              accepted: false,
              status: "Menunggu persetujuan aman dari client",
            }
          : order,
      ),
    );
    setNotice("Order difinish. Client wajib menerima bahwa barang aman.");
    const currentOrder = orders.find((order) => order.id === orderId);
    if (currentOrder) {
      void syncGoogleSheet(
        "Orders",
        "upsert",
        {
          ...currentOrder,
          progress: 100,
          accepted: false,
          status: "Menunggu persetujuan aman dari client",
        },
        setNotice,
      );
    }
  }

  function approveOrder(orderId: string) {
    if (!canManageClientOrder) {
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, approved: true, status: "Order diterima tim" }
          : order,
      ),
    );
    setNotice("Order disetujui oleh tim");
    const currentOrder = orders.find((order) => order.id === orderId);
    if (currentOrder) {
      void syncGoogleSheet(
        "Orders",
        "upsert",
        { ...currentOrder, approved: true, status: "Order diterima tim" },
        setNotice,
      );
    }
  }

  function acceptSafeOrder(orderId: string) {
    if (selectedRole !== "CLIENT") {
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              accepted: true,
              status: "Client menyetujui barang aman",
            }
          : order,
      ),
    );
    setNotice("Client menerima dan menyetujui barang aman");
    const currentOrder = orders.find((order) => order.id === orderId);
    if (currentOrder) {
      void syncGoogleSheet(
        "Orders",
        "upsert",
        {
          ...currentOrder,
          accepted: true,
          status: "Client menyetujui barang aman",
        },
        setNotice,
      );
    }
  }

  function deleteOrder(order: ClientOrderState) {
    if (!canManageClientOrder && order.progress > 0) {
      return;
    }

    setOrders((current) => current.filter((item) => item.id !== order.id));
    setViewingOrderId((current) => (current === order.id ? "" : current));
    setEditingOrderId((current) => (current === order.id ? null : current));
    setNotice("Order dihapus");
    void syncGoogleSheet("Orders", "delete", { id: order.id }, setNotice);
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.74fr_1.26fr]">
      <Panel>
        <PanelTitle
          icon={ClipboardList}
          eyebrow="Client Portal"
          title={editingOrderId ? "Edit order" : "Create order"}
        />
        <div className="mt-4 grid gap-3">
          <input
            name="clientOrderTitle"
            value={draftOrder.title}
            onChange={(event) =>
              setDraftOrder((current) => ({ ...current, title: event.target.value }))
            }
            className="field"
            placeholder="Judul order"
          />
          <input
            name="clientOrderName"
            value={draftOrder.client}
            onChange={(event) =>
              setDraftOrder((current) => ({ ...current, client: event.target.value }))
            }
            className="field"
            placeholder="Nama client"
          />
          <textarea
            name="clientOrderIssue"
            value={draftOrder.issue}
            onChange={(event) =>
              setDraftOrder((current) => ({ ...current, issue: event.target.value }))
            }
            className="field min-h-28 resize-none"
            placeholder="Kerusakan atau masalah"
          />
          <button
            type="button"
            onClick={createOrder}
            disabled={Boolean(editingOrderId) && !canManageClientOrder}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <Plus className="size-4" aria-hidden="true" />
            {editingOrderId ? "Simpan order" : "Simpan order"}
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-stone-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Progress view proyek berjalan
          </p>
          <div className="mt-3 space-y-3">
            {projectStageList.map((stage) => (
              <div key={stage.name}>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                  <span>{stage.name}</span>
                  <span>{stage.progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={Activity} eyebrow="Order" title="Progress, masalah, approval" />
          <label className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
              aria-label="Mencari order client"
              name="clientOrderSearch"
              className="field pl-9"
              placeholder="Cari order..."
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{order.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {order.client} | {order.status}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${
                    order.accepted
                      ? "bg-emerald-100 text-emerald-800"
                      : order.approved
                        ? "bg-cyan-100 text-cyan-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {order.accepted ? "Accepted safe" : order.approved ? "Approved" : "Pending"}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                  <span>Progress view</span>
                  <span>{order.progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
                {canManageClientOrder && (
                  <input
                    aria-label={`Edit progress ${order.title}`}
                    type="range"
                    min={0}
                    max={100}
                    value={order.progress}
                    onChange={(event) =>
                      updateOrderProgress(order.id, Number(event.target.value))
                    }
                    className="mt-3 w-full accent-stone-950"
                  />
                )}
              </div>

              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">
                <p className="text-xs font-bold uppercase tracking-[0.12em]">
                  Kerusakan / masalah
                </p>
                <p className="mt-1 leading-6">{order.issue}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingOrderId(order.id);
                    setNotice(`Detail order ${order.title} ditampilkan`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                >
                  <Eye className="size-3" aria-hidden="true" />
                  Lihat
                </button>
                <button
                  type="button"
                  onClick={() => editOrder(order)}
                  disabled={!canManageClientOrder}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Edit3 className="size-3" aria-hidden="true" />
                  Edit order
                </button>
                <button
                  type="button"
                  onClick={() => finishOrder(order.id)}
                  disabled={!canManageClientOrder}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Finish
                </button>
                <button
                  type="button"
                  onClick={() => approveOrder(order.id)}
                  disabled={!canManageClientOrder}
                  className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  Approve accept order
                </button>
                {selectedRole === "CLIENT" && (
                  <button
                    type="button"
                    onClick={() => acceptSafeOrder(order.id)}
                    disabled={order.progress < 100 || order.accepted}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    Terima barang aman
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteOrder(order)}
                  disabled={!canManageClientOrder && order.progress > 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Detail tampil
          </p>
          {viewingOrder ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold">{viewingOrder.title}</p>
              <p className="text-stone-600">{viewingOrder.client} | {viewingOrder.status}</p>
              <p className="text-stone-600">Progress {viewingOrder.progress}%</p>
              <p className="text-stone-600">Masalah: {viewingOrder.issue}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Pilih order untuk ditampilkan.</p>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            Approval tahapan proyek
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {projectStageList.map((stage) => (
              <button
                key={stage.name}
                type="button"
                onClick={() => approveStage(stage.name)}
                disabled={!canApprove}
                className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve {stage.name}
              </button>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function currentClientLabel(role: Role) {
  return role === "CLIENT" ? "Client baru" : `${roleLabels[role]} internal`;
}

function matchesSearch(query: string, ...values: Array<string | number | undefined>) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return values.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

function socialPostKey(post: SocialPostState) {
  return `${post.platform}-${post.time}-${post.caption}`;
}

function readSheetSyncConfig() {
  if (typeof window === "undefined") {
    return null;
  }

  const draft = JSON.parse(
    window.localStorage.getItem("welddesign.automationDraft") || "null",
  ) as Partial<AutomationState> | null;
  const automations = JSON.parse(
    window.localStorage.getItem("welddesign.automations") || "[]",
  ) as Array<Partial<AutomationState>>;
  const selected = draft?.webAppUrl ? draft : automations.find((item) => item.webAppUrl);

  if (!selected?.webAppUrl) {
    return null;
  }

  return {
    webAppUrl: selected.webAppUrl,
    spreadsheetName: selected.spreadsheetName || "WeldDesign Production Data",
  };
}

async function syncGoogleSheet(
  table: string,
  action: "upsert" | "delete" | "create-spreadsheet",
  record: Record<string, unknown>,
  setNotice?: (notice: string) => void,
) {
  const config = readSheetSyncConfig();

  if (!config) {
    setNotice?.("Data lokal tersimpan. Isi Web App URL di Automation agar masuk Google Spreadsheet.");
    return;
  }

  try {
    const response = await fetch("/api/google-sheet/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...config,
        table,
        action,
        record,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Sync Google Spreadsheet gagal");
    }

    setNotice?.(`Google Spreadsheet terupdate: ${table}`);
  } catch (error) {
    setNotice?.(error instanceof Error ? error.message : "Sync Google Spreadsheet gagal");
  }
}

function downloadCsvFile(fileName: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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
