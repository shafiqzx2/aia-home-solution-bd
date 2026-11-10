import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Workspace } from "@/components/admin/workspace";
import { isLocale } from "@/lib/i18n";
import { workspaceModules } from "@/lib/business/modules";
import "@/app/admin.css";

export const metadata: Metadata = { title: "Business workspace · Local review", robots: { index: false, follow: false, noarchive: true } };

async function LocalPreview({ params }: { params: Promise<{ lang: string; section?: string[] }> }) {
  await connection();
  // No cookie, URL parameter, hostname header, or client flag can enable this in
  // a production build. This preview has no database access and no auth bypass.
  if (process.env.NODE_ENV !== "development") notFound();
  const { lang, section = [] } = await params;
  if (!isLocale(lang) || section.length > 1) notFound();
  const allowed = workspaceModules.map(m => m.id);
  const initialSection = section[0] || "dashboard";
  if (!allowed.includes(initialSection)) notFound();
  return <Workspace locale={lang} initialSection={initialSection} />;
}
export default function Page(props: { params: Promise<{ lang: string; section?: string[] }> }) {
  return <Suspense fallback={<main id="main-content">Preparing local workspace…</main>}><LocalPreview {...props} /></Suspense>;
}
