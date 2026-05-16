"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  HardHat,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import styles from "@/components/auth/login-page.module.css";
import { demoUsers, type AppUser } from "@/lib/auth-demo";
import { roleLabels } from "@/lib/security";

type LoginPageProps = {
  authMessage: string;
  authState: "idle" | "loading" | "done" | "error";
  onContinueAsClient: () => void;
  onSubmit: (user: AppUser, password?: string) => void;
};

export function LoginPage({
  authMessage,
  authState,
  onContinueAsClient,
  onSubmit,
}: LoginPageProps) {
  const [email, setEmail] = useState(demoUsers[0]?.email ?? "");
  const [password, setPassword] = useState("password-demo-123");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const selectedUser = useMemo(
    () => demoUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()),
    [email],
  );
  const isSubmitting = authState === "loading";
  const statusClassName =
    authState === "error"
      ? `${styles.status} ${styles.statusError}`
      : authState === "done"
        ? `${styles.status} ${styles.statusSuccess}`
        : styles.status;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser || isSubmitting) {
      return;
    }

    onSubmit(selectedUser, password);
  }

  return (
    <main className={`${styles.shell} text-stone-950`}>
      <div className={styles.frame}>
        <section className={styles.card}>
          <div className="px-6 pb-6 pt-6">
            <div className="flex flex-col items-center text-center">
              <div className={styles.brandMark}>
                <HardHat className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Aerovin WeldDesign
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                Masuk ke workspace
              </h1>
              <p className="mt-2 max-w-[320px] text-sm leading-6 text-stone-500">
                Role otomatis mengikuti akun. Tanpa login, lanjut sebagai Client.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Email akun</span>
                <div className={styles.fieldShell}>
                  <Mail className={styles.fieldIcon} aria-hidden="true" />
                  <input
                    name="email"
                    type="email"
                    list="demo-account-list"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={styles.field}
                    disabled={isSubmitting}
                    required
                  />
                  <datalist id="demo-account-list">
                    {demoUsers.map((user) => (
                      <option key={user.email} value={user.email}>
                        {user.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Password</span>
                <div className={styles.fieldShell}>
                  <LockKeyhole className={styles.fieldIcon} aria-hidden="true" />
                  <input
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={styles.field}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    aria-label={isPasswordVisible ? "Sembunyikan password" : "Lihat password"}
                    className={styles.iconButton}
                    disabled={isSubmitting}
                    onClick={() => setIsPasswordVisible((current) => !current)}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>

              <div className={statusClassName}>
                {selectedUser ? (
                  <span>
                    Role terdeteksi:{" "}
                    <strong className="text-stone-950">{roleLabels[selectedUser.role]}</strong>
                  </span>
                ) : (
                  <span>Email belum terdaftar di akun demo.</span>
                )}
                <br />
                {authMessage}
              </div>

              <button
                type="submit"
                disabled={!selectedUser || isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onContinueAsClient}
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Lanjut sebagai Client
              </button>
            </form>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                Akun demo
              </p>
              <div className={`${styles.demoRow} mt-2`}>
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => setEmail(user.email)}
                    className="rounded-md border border-stone-200 bg-white px-2 py-2 text-left text-xs transition hover:border-stone-400 hover:bg-stone-50"
                  >
                    <span className="block font-semibold">{roleLabels[user.role]}</span>
                    <span className="mt-1 block truncate text-stone-500">{user.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
