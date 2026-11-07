import type { Metadata } from "next";
import {
  Anek_Bangla,
  Cormorant_Garamond,
  Geist,
  Hind_Siliguri,
} from "next/font/google";
import { dictionaries, isLocale, type Locale } from "@/lib/i18n";
import { company } from "@/lib/public-content";
import { brandingDefaults } from "@/lib/branding";
import { ThemeInitialization } from "@/components/site/theme-initialization";
import { FloatingTools } from "@/components/site/floating-tools";
import { NavigationScroll } from "@/components/site/navigation-scroll";
import { Suspense } from "react";
import "../globals.css";
import "../refinements.css";
import "../business.css";
import "../branding.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const editorial = Cormorant_Garamond({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const bengali = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

const bengaliHeadings = Anek_Bangla({
  variable: "--font-bengali-heading",
  subsets: ["bengali"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "bn" }];
}

export const metadata: Metadata = {
  title: {
    default: company.name,
    template: `%s | ${company.name}`,
  },
  description:
    "Home and commercial solutions in Bangladesh: lighting, automation, security, audio, and digital setup.",
  applicationName: company.name,
  icons: {
    icon: [
      { url: brandingDefaults.favicon.light.src, type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: light)" },
      { url: brandingDefaults.favicon.dark.src, type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: brandingDefaults.favicon.fallback,
    apple: [{ url: brandingDefaults.favicon.apple.src, sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "en";
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${editorial.variable} ${bengali.variable} ${bengaliHeadings.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <ThemeInitialization />
      </head>
      <body className="min-h-full">
        <a className="skip-link" href="#main-content">
          {dictionaries[locale].skip}
        </a>
        {children}
        <Suspense fallback={null}>
          <NavigationScroll />
        </Suspense>
        <FloatingTools />
      </body>
    </html>
  );
}
