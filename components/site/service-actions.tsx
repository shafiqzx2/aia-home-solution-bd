import { type Locale } from "@/lib/i18n";
import { publicServices } from "@/lib/public-content";
import { ContactActions } from "./direct-contact";
export function ServiceActions({ locale, id, compact = false }: { locale: Locale; id: string; compact?: boolean }) {
  const service = publicServices.find(s => s.slug === id);
  return <div className="service-actions"><ContactActions locale={locale} compact={compact} message={
    service ? `Hello AIA Home Solutions BD, I would like assistance with ${service.name[locale]}.` : "Hello AIA Home Solutions BD, I would like to discuss a service requirement."
  } /></div>;
}
