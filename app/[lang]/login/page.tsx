import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/login-panel";
import { dictionaries, href, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import {businessEnabled} from "@/lib/server/config";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: dictionaries[lang].login,
    description: dictionaries[lang].authDescription,
    robots: { index: false, follow: false },
    alternates: {
      languages: { en: href("en", "login"), bn: href("bn", "login") },
    },
  };
}
export default async function LoginPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <LoginPanel locale={lang} configured={businessEnabled()&&!!process.env.BETTER_AUTH_SECRET&&!!process.env.BETTER_AUTH_URL} />;
}
