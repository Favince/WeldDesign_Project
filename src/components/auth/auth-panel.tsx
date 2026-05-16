"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { demoUsers, type AppUser } from "@/lib/auth-demo";
import { roleLabels, type Role } from "@/lib/security";

type AuthPanelState = {
  state: "idle" | "loading" | "done" | "error";
  message: string;
};

type AuthPanelProps = {
  currentUser: AppUser | null;
  selectedRole: Role;
  authState: AuthPanelState;
  loginAs: (user: AppUser, password?: string) => void;
  logout: () => void;
};

export function AuthPanel({
  currentUser,
  selectedRole,
  authState,
  loginAs,
  logout,
}: AuthPanelProps) {
  const [loginEmail, setLoginEmail] = useState(demoUsers[0]?.email ?? "");
  const [loginPassword, setLoginPassword] = useState("password-demo-123");
  const selectedDemoUser = demoUsers.find((user) => user.email === loginEmail);

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedDemoUser) {
      loginAs(selectedDemoUser, loginPassword);
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            Login & akses
          </p>
          <p className="mt-1 text-sm font-semibold">
            {currentUser?.name ?? "Guest Client"}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Role otomatis: {roleLabels[selectedRole]}
          </p>
        </div>
        {currentUser ? (
          <button
            type="button"
            title="Logout"
            onClick={logout}
            className="flex size-9 items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-100"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <div className="flex size-9 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
            <UserRound className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {!currentUser && (
        <form className="mt-3 grid gap-2" onSubmit={handleLoginSubmit}>
          <label className="grid gap-1 text-xs font-semibold text-stone-600">
            Email akun
            <select
              name="loginEmail"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-950 outline-none focus:border-stone-500"
            >
              {demoUsers.map((user) => (
                <option key={user.email} value={user.email}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-stone-600">
            Password
            <input
              name="loginPassword"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-950 outline-none focus:border-stone-500"
            />
          </label>
          <button
            type="submit"
            disabled={!selectedDemoUser || authState.state === "loading"}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Masuk
          </button>
          <p className="text-xs leading-5 text-stone-500">
            Role mengikuti email yang login. Tanpa login, sistem memakai Client.
          </p>
        </form>
      )}

      <p
        className={`mt-3 text-xs leading-5 ${
          authState.state === "error" ? "text-red-700" : "text-stone-500"
        }`}
      >
        {authState.message}
      </p>
    </div>
  );
}
