import "server-only";
import type { Localized } from "./i18n";

export type CustomerReview = {
  id: string;
  authorName: string;
  quote: Localized;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  sourceUrl: string | null;
  status: "draft" | "published";
  approved: boolean;
  publicationConsent: boolean;
  approvedPhoto?: import("./public-content").Media;
  reviewedAt?: string;
};

// No genuine, consented reviews have been supplied. Keep moderation records
// server-only and project only approved public fields when adding a CMS.
export const customerReviews: CustomerReview[] = [];
