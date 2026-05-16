import { NextResponse } from "next/server";

type SheetSyncPayload = {
  webAppUrl?: string;
  spreadsheetName?: string;
  table?: string;
  action?: "upsert" | "delete" | "create-spreadsheet";
  record?: Record<string, unknown>;
  records?: Array<Record<string, unknown>>;
};

function isGoogleAppsScriptUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "script.google.com" && url.pathname.includes("/macros/");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SheetSyncPayload | null;

  if (!payload?.webAppUrl || !isGoogleAppsScriptUrl(payload.webAppUrl)) {
    return NextResponse.json(
      { error: "Web App URL Google Apps Script belum valid" },
      { status: 400 },
    );
  }

  const formData = new URLSearchParams();
  formData.set(
    "payload",
    JSON.stringify({
      spreadsheetName: payload.spreadsheetName,
      table: payload.table,
      action: payload.action ?? "upsert",
      record: payload.record,
      records: payload.records,
    }),
  );

  const response = await fetch(payload.webAppUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: formData,
    redirect: "follow",
  });

  const text = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Google Apps Script gagal menerima data",
        status: response.status,
        body: text.slice(0, 500),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: response.status,
    body: text.slice(0, 500),
  });
}
