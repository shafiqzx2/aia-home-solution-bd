import "server-only";
import type { Localized } from "./i18n";
import type { Media } from "./public-content";
export type VerifiedMetric = {
  id: string;
  label: Localized;
  value: string;
  sourceUrl: string;
  verifiedAt: string;
  approved: boolean;
  status: "draft" | "published";
};
export type ApprovedOrganization = {
  id: string;
  name: string;
  relationship: "client" | "partner";
  logo: Media;
  website: string | null;
  permissionGranted: boolean;
  approved: boolean;
  status: "draft" | "published";
};
export const verifiedMetrics: VerifiedMetric[] = [];
export const approvedOrganizations: ApprovedOrganization[] = [];
