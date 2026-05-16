export const roles = ["ADMIN", "GURU", "SISWA", "CLIENT"] as const;

export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  GURU: "Guru",
  SISWA: "Siswa",
  CLIENT: "Client",
};

export const permissions = [
  "dashboard:read",
  "users:manage",
  "estimate:create",
  "inventory:manage",
  "project:approve",
  "project:update",
  "portfolio:publish",
  "automation:manage",
  "social:schedule",
  "learning:access",
  "analytics:read",
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [...permissions],
  GURU: [
    "dashboard:read",
    "estimate:create",
    "inventory:manage",
    "project:approve",
    "project:update",
    "portfolio:publish",
    "automation:manage",
    "social:schedule",
    "learning:access",
    "analytics:read",
  ],
  SISWA: [
    "dashboard:read",
    "estimate:create",
    "project:update",
    "portfolio:publish",
    "learning:access",
  ],
  CLIENT: ["dashboard:read", "project:approve", "analytics:read"],
};

export const securityControls = [
  {
    label: "JWT session",
    state: "30 menit idle timeout",
    owner: "API",
  },
  {
    label: "bcrypt password hash",
    state: "Cost factor 10 untuk v1",
    owner: "Auth",
  },
  {
    label: "Login email/Google/HP",
    state: "OTP tidak wajib di demo; 2FA optional",
    owner: "Identity",
  },
  {
    label: "Audit log",
    state: "Semua aksi sensitif dicatat",
    owner: "Security",
  },
  {
    label: "Brute force block",
    state: "Rate limit per akun dan IP",
    owner: "Edge",
  },
  {
    label: "Encryption",
    state: "HTTPS plus DB at-rest encryption",
    owner: "Infra",
  },
] as const;

export function canAccess(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
