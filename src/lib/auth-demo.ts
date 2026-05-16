import { type Role } from "@/lib/security";

export type AppUser = {
  name: string;
  email: string;
  role: Role;
  token?: string;
};

export const demoUsers: AppUser[] = [
  {
    name: "Pak Guru QC",
    email: "guru@krisavaaerovin.my.id",
    role: "GURU",
  },
  {
    name: "Admin Aerovin",
    email: "admin@krisavaaerovin.my.id",
    role: "ADMIN",
  },
  {
    name: "Raka Siswa",
    email: "siswa@krisavaaerovin.my.id",
    role: "SISWA",
  },
];
