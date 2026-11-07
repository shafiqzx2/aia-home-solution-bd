import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { approvedOrganizations, verifiedMetrics } from "@/lib/trust-content";
export function TrustPreview({ locale }: { locale: Locale }) {
  const organizations = approvedOrganizations.filter(
    (item) =>
      item.status === "published" &&
      item.approved &&
      item.permissionGranted &&
      item.logo.kind === "verified",
  );
  const metrics = verifiedMetrics.filter(
    (item) =>
      item.status === "published" &&
      item.approved &&
      item.sourceUrl &&
      item.verifiedAt,
  );
  if (!organizations.length && !metrics.length) return null;
  return (
    <section className="section-space trust-section">
      <div className="shell">
        {!!metrics.length && (
          <dl className="feature-grid">
            {metrics.map((item) => (
              <div key={item.id}>
                <dt>{item.label[locale]}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!!organizations.length && (
          <>
            <h2>
              {locale === "bn" ? "গ্রাহক ও অংশীদার" : "Clients & partners"}
            </h2>
            <ul className="organization-grid">
              {organizations.map((item) => (
                <li key={item.id}>
                  <Image
                    src={item.logo.src}
                    alt={item.name}
                    width={160}
                    height={80}
                  />
                  <p>{item.name}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
