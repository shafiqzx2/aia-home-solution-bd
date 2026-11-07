import { dictionaries, type Locale } from "@/lib/i18n";
import { customerReviews } from "@/lib/reviews";
import Image from "next/image";

export function ReviewPreview({ locale }: { locale: Locale }) {
  const reviews = customerReviews.filter(
    (review) =>
      review.status === "published" &&
      review.approved &&
      review.publicationConsent &&
      review.authorName.trim() &&
      review.quote[locale].trim(),
  );
  if (!reviews.length) return null;
  const d = dictionaries[locale];
  return (
    <section
      className="section-space reviews-section"
      aria-labelledby="reviews-title"
    >
      <div className="shell">
        <h2 id="reviews-title">{d.reviewsTitle}</h2>
        <div className="review-grid">
          {reviews.map((review) => (
            <figure key={review.id}>
              <blockquote>
                <p>{review.quote[locale]}</p>
              </blockquote>
              <figcaption>
                {review.approvedPhoto?.kind === "verified" && (
                  <Image
                    src={review.approvedPhoto.src}
                    alt={review.authorName}
                    width={48}
                    height={48}
                  />
                )}
                <span>{review.authorName}</span>
                {review.rating !== null && (
                  <span aria-label={`${d.rating}: ${review.rating}/5`}>
                    <span aria-hidden="true">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </span>
                )}
                {review.reviewedAt && (
                  <time dateTime={review.reviewedAt}>
                    {new Intl.DateTimeFormat(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "Asia/Dhaka",
                    }).format(new Date(review.reviewedAt))}
                  </time>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
