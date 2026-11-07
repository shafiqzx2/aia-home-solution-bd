import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { requestCopy } from "@/lib/request-copy";
export function ServiceActions({
  locale,
  id,
  compact = false,
}: {
  locale: Locale;
  id: string;
  compact?: boolean;
}) {
  const c = requestCopy(locale);
  return (
    <div className="service-actions action-row">
      <Link
        className="small-action"
        href={`${href(locale, "request")}?entry=service&service=${encodeURIComponent(id)}&type=service`}
      >
        {c.book}
      </Link>
      {!compact && (
        <Link
          className="text-link"
          href={`${href(locale, "request")}?entry=service&service=${encodeURIComponent(id)}&type=consultation`}
        >
          {c.consultation}
        </Link>
      )}
    </div>
  );
}
