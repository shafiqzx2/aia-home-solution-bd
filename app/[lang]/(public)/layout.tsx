import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

// A shared frame keeps navigation, logo images and cart subscription mounted
// while public route content streams. The unified login keeps its own design.
export default async function PublicLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <><Header locale={lang} />{children}<Footer locale={lang} /></>;
}
