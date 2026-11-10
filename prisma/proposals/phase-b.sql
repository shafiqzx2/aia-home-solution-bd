-- REVIEW ONLY. Requires target approval and verified restore before execution.
BEGIN;
-- CreateEnum
CREATE TYPE "RoleKind" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "Publication" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('CONSULTATION', 'PRODUCT_QUOTATION', 'MULTI_PRODUCT_QUOTATION', 'SERVICE_BOOKING', 'SITE_VISIT', 'OFFICE_VISIT', 'INSTALLATION', 'ENQUIRY');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'AWAITING_CUSTOMER', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'VERIFIED', 'CONFLICT', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('QUARANTINED', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailState" AS ENUM ('DRAFT', 'REVIEWED', 'QUEUED', 'ACCEPTED', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobState" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('PAGE', 'PROJECT', 'REVIEW', 'CAREER');

-- CreateEnum
CREATE TYPE "SaleState" AS ENUM ('DRAFT', 'COMMITTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "CommercialKind" AS ENUM ('MEMO', 'INVOICE', 'RECEIPT', 'CHALLAN');

-- CreateEnum
CREATE TYPE "LedgerState" AS ENUM ('POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "displayName" TEXT NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "RoleKind" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "scope" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("scope")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","scope")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "VerifiedContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ContactKind" NOT NULL,
    "normalized" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "VerifiedContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ContactKind" NOT NULL,
    "normalized" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,

    CONSTRAINT "BusinessContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "consentAt" TIMESTAMP(3),

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestIdentity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "status" "Publication" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "categoryId" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "seo" JSONB,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("categoryId","locale")
);

-- CreateTable
CREATE TABLE "Product" (
    "draft" JSONB,
    "publicData" JSONB,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legacyId" TEXT,
    "categoryId" TEXT NOT NULL,
    "status" "Publication" NOT NULL DEFAULT 'DRAFT',
    "contentKind" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "productId" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" JSONB NOT NULL,
    "seo" JSONB,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("productId","locale")
);

-- CreateTable
CREATE TABLE "PrivateProductPrice" (
    "productId" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateProductPrice_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "reorderPoint" DECIMAL(16,4) NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCollection" (
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("productId","collectionId")
);

-- CreateTable
CREATE TABLE "Service" (
    "draft" JSONB,
    "publicData" JSONB,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "Publication" NOT NULL DEFAULT 'DRAFT',
    "bookingConfiguration" JSONB NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTranslation" (
    "serviceId" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "seo" JSONB,

    CONSTRAINT "ServiceTranslation_pkey" PRIMARY KEY ("serviceId","locale")
);

-- CreateTable
CREATE TABLE "ProductService" (
    "productId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ProductService_pkey" PRIMARY KEY ("productId","serviceId")
);

-- CreateTable
CREATE TABLE "CustomerRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "customerId" TEXT,
    "guestId" TEXT,
    "contactSnapshot" JSONB NOT NULL,
    "requirements" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "quantity" DECIMAL(16,4) NOT NULL,
    "descriptionSnapshot" JSONB NOT NULL,

    CONSTRAINT "RequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestClaim" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedContactId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "proofHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "auditId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestNote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PROPOSED',
    "scheduledAt" TIMESTAMP(3),
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "locationConsentAt" TIMESTAMP(3),

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "visitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("visitId","userId")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "number" TEXT,
    "requestId" TEXT,
    "customerId" TEXT,
    "organizationId" TEXT,
    "currentIssuedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationVersion" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "lockVersion" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL,
    "taxPercent" DECIMAL(5,2) NOT NULL,
    "tax" DECIMAL(18,2) NOT NULL,
    "charges" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "financialPolicy" TEXT NOT NULL DEFAULT 'BDT_FIXED_DISCOUNT_V1',
    "clientSnapshot" JSONB NOT NULL,
    "companySnapshot" JSONB NOT NULL,
    "termsSnapshot" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "documentDate" DATE NOT NULL,
    "validUntil" DATE,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRecipient" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,

    CONSTRAINT "QuotationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationStatusEvent" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL,
    "auditId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quotationVersionId" TEXT,
    "documentVersionId" TEXT,
    "auditId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PortalGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "scope" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "nextValue" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("scope","period")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "body" TEXT NOT NULL,
    "allowedVariables" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDocument" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "kind" TEXT NOT NULL,
    "customerId" TEXT,
    "organizationId" TEXT,
    "currentIssuedVersionId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "templateVersionId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "recipientSnapshot" JSONB NOT NULL,
    "companySnapshot" JSONB NOT NULL,
    "senderSnapshot" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" TEXT NOT NULL,
    "quotationVersionId" TEXT,
    "documentVersionId" TEXT,
    "approverId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "quotationVersionId" TEXT,
    "documentVersionId" TEXT,
    "assetId" TEXT NOT NULL,
    "rendererVersion" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "senderSnapshot" JSONB NOT NULL,
    "state" "EmailState" NOT NULL DEFAULT 'DRAFT',
    "approvedRevision" INTEGER,
    "approvedByAuditId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailRecipient" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "EmailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "emailId" TEXT NOT NULL,
    "generatedDocumentId" TEXT NOT NULL,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("emailId","generatedDocumentId")
);

-- CreateTable
CREATE TABLE "DeliveryAttempt" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "state" "EmailState" NOT NULL,
    "providerId" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,

    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxJob" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" "JobState" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "draft" JSONB,
    "id" TEXT NOT NULL DEFAULT 'company',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "branches" JSONB NOT NULL,
    "logoVariants" JSONB NOT NULL,
    "socialLinks" JSONB NOT NULL,
    "businessHours" JSONB NOT NULL,
    "officialIdentifiers" JSONB,
    "approvedPaymentDetails" JSONB,
    "senderEmail" TEXT,
    "replyToEmail" TEXT,
    "quotationEmail" TEXT,
    "defaultCurrency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "quotationTerms" JSONB NOT NULL,
    "documentFooter" JSONB NOT NULL,
    "emailFooter" JSONB NOT NULL,
    "numberingPreferences" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "imageUrl" TEXT,
    "visibility" "AssetVisibility" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'QUARANTINED',
    "mimeType" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "alt" JSONB NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("productId","assetId")
);

-- CreateTable
CREATE TABLE "ContentEntry" (
    "draft" JSONB,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "Publication" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTranslation" (
    "entryId" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "seo" JSONB NOT NULL,

    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("entryId","locale")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "customerId" TEXT,
    "sourceQuotationVersionId" TEXT,
    "state" "SaleState" NOT NULL DEFAULT 'DRAFT',
    "saleDate" DATE NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "customerSnapshot" JSONB NOT NULL,
    "companySnapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL,
    "taxPercent" DECIMAL(7,4) NOT NULL,
    "tax" DECIMAL(18,2) NOT NULL,
    "charges" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "committedAt" TIMESTAMP(3),
    "demoScope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT,
    "snapshot" JSONB NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialDocument" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "kind" "CommercialKind" NOT NULL,
    "paymentId" TEXT,
    "deliveryId" TEXT,
    "financialSnapshot" JSONB NOT NULL,

    CONSTRAINT "CommercialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "externalRef" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "state" "LedgerState" NOT NULL DEFAULT 'POSTED',
    "evidence" JSONB NOT NULL,
    "demoScope" TEXT,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "DeliveryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "deliveryItemId" TEXT,
    "quantityDelta" DECIMAL(16,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demoScope" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId","scope")
);

-- CreateTable
CREATE TABLE "StaffInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "rootBootstrap" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationRole" (
    "invitationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "InvitationRole_pkey" PRIMARY KEY ("invitationId","roleId")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "VerifiedContact_kind_normalized_revokedAt_idx" ON "VerifiedContact"("kind", "normalized", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedContact_userId_kind_normalized_key" ON "VerifiedContact"("userId", "kind", "normalized");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChallenge_tokenHash_key" ON "ContactChallenge"("tokenHash");

-- CreateIndex
CREATE INDEX "ContactChallenge_expiresAt_idx" ON "ContactChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "BusinessContact_organizationId_idx" ON "BusinessContact"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- CreateIndex
CREATE INDEX "GuestIdentity_email_idx" ON "GuestIdentity"("email");

-- CreateIndex
CREATE INDEX "GuestIdentity_phone_idx" ON "GuestIdentity"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_status_idx" ON "Category"("parentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_legacyId_key" ON "Product"("legacyId");

-- CreateIndex
CREATE INDEX "Product_status_categoryId_id_idx" ON "Product"("status", "categoryId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_status_categoryId_id_idx" ON "Service"("status", "categoryId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRequest_reference_key" ON "CustomerRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRequest_idempotencyKey_key" ON "CustomerRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CustomerRequest_status_createdAt_id_idx" ON "CustomerRequest"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CustomerRequest_customerId_createdAt_idx" ON "CustomerRequest"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerRequest_guestId_idx" ON "CustomerRequest"("guestId");

-- CreateIndex
CREATE INDEX "RequestItem_requestId_idx" ON "RequestItem"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestClaim_proofHash_key" ON "RequestClaim"("proofHash");

-- CreateIndex
CREATE INDEX "RequestClaim_requestId_status_idx" ON "RequestClaim"("requestId", "status");

-- CreateIndex
CREATE INDEX "RequestClaim_userId_createdAt_idx" ON "RequestClaim"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequestStatusEvent_auditId_key" ON "RequestStatusEvent"("auditId");

-- CreateIndex
CREATE INDEX "RequestStatusEvent_requestId_createdAt_idx" ON "RequestStatusEvent"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestNote_requestId_createdAt_idx" ON "RequestNote"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_status_scheduledAt_idx" ON "Visit"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_number_key" ON "Quotation"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_currentIssuedVersionId_key" ON "Quotation"("currentIssuedVersionId");

-- CreateIndex
CREATE INDEX "Quotation_customerId_createdAt_idx" ON "Quotation"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Quotation_requestId_idx" ON "Quotation"("requestId");

-- CreateIndex
CREATE INDEX "QuotationVersion_status_createdAt_idx" ON "QuotationVersion"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationVersion_quotationId_revision_key" ON "QuotationVersion"("quotationId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationVersion_quotationId_id_key" ON "QuotationVersion"("quotationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationItem_versionId_position_key" ON "QuotationItem"("versionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRecipient_versionId_email_key" ON "QuotationRecipient"("versionId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationStatusEvent_auditId_key" ON "QuotationStatusEvent"("auditId");

-- CreateIndex
CREATE INDEX "QuotationStatusEvent_versionId_createdAt_idx" ON "QuotationStatusEvent"("versionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PortalGrant_auditId_key" ON "PortalGrant"("auditId");

-- CreateIndex
CREATE INDEX "PortalGrant_userId_revokedAt_idx" ON "PortalGrant"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_revision_key" ON "TemplateVersion"("templateId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDocument_reference_key" ON "BusinessDocument"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDocument_currentIssuedVersionId_key" ON "BusinessDocument"("currentIssuedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_revision_key" ON "DocumentVersion"("documentId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_id_key" ON "DocumentVersion"("documentId", "id");

-- CreateIndex
CREATE INDEX "ApprovalRecord_quotationVersionId_idx" ON "ApprovalRecord"("quotationVersionId");

-- CreateIndex
CREATE INDEX "ApprovalRecord_documentVersionId_idx" ON "ApprovalRecord"("documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_assetId_key" ON "GeneratedDocument"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_revision_locale_key" ON "EmailTemplate"("key", "revision", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_idempotencyKey_key" ON "EmailMessage"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_providerMessageId_key" ON "EmailMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "EmailMessage_state_createdAt_idx" ON "EmailMessage"("state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRecipient_emailId_kind_address_key" ON "EmailRecipient"("emailId", "kind", "address");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryAttempt_emailId_attempt_key" ON "DeliveryAttempt"("emailId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderWebhookEvent_provider_eventId_key" ON "ProviderWebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxJob_idempotencyKey_key" ON "OutboxJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OutboxJob_state_nextAttemptAt_idx" ON "OutboxJob"("state", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentEntry_kind_status_createdAt_idx" ON "ContentEntry"("kind", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentEntry_kind_slug_key" ON "ContentEntry"("kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_reference_key" ON "Sale"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Sale_demoScope_state_saleDate_id_idx" ON "Sale"("demoScope", "state", "saleDate", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_saleId_position_key" ON "SaleItem"("saleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialDocument_documentVersionId_key" ON "CommercialDocument"("documentVersionId");

-- CreateIndex
CREATE INDEX "CommercialDocument_saleId_kind_idx" ON "CommercialDocument"("saleId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_code_key" ON "PaymentMethod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_reference_key" ON "PaymentRecord"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_idempotencyKey_key" ON "PaymentRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentRecord_demoScope_receivedAt_id_idx" ON "PaymentRecord"("demoScope", "receivedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_methodId_externalRef_key" ON "PaymentRecord"("methodId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_saleId_key" ON "PaymentAllocation"("paymentId", "saleId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_reference_key" ON "RefundRecord"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_idempotencyKey_key" ON "RefundRecord"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRecord_reference_key" ON "DeliveryRecord"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRecord_idempotencyKey_key" ON "DeliveryRecord"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_saleItemId_key" ON "DeliveryItem"("deliveryId", "saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_idempotencyKey_key" ON "StockMovement"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_deliveryItemId_key" ON "StockMovement"("deliveryItemId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_recordedAt_id_idx" ON "StockMovement"("productId", "recordedAt", "id");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffInvitation_email_expiresAt_idx" ON "StaffInvitation"("email", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_entryId_revision_key" ON "ContentRevision"("entryId", "revision");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_scope_fkey" FOREIGN KEY ("scope") REFERENCES "Permission"("scope") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedContact" ADD CONSTRAINT "VerifiedContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChallenge" ADD CONSTRAINT "ContactChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContact" ADD CONSTRAINT "BusinessContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateProductPrice" ADD CONSTRAINT "PrivateProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTranslation" ADD CONSTRAINT "ServiceTranslation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductService" ADD CONSTRAINT "ProductService_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductService" ADD CONSTRAINT "ProductService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "CustomerRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "CustomerRequest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestClaim" ADD CONSTRAINT "RequestClaim_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestClaim" ADD CONSTRAINT "RequestClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestClaim" ADD CONSTRAINT "RequestClaim_verifiedContactId_fkey" FOREIGN KEY ("verifiedContactId") REFERENCES "VerifiedContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusEvent" ADD CONSTRAINT "RequestStatusEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestNote" ADD CONSTRAINT "RequestNote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestNote" ADD CONSTRAINT "RequestNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_currentIssuedVersionId_fkey" FOREIGN KEY ("currentIssuedVersionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationVersion" ADD CONSTRAINT "QuotationVersion_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationVersion" ADD CONSTRAINT "QuotationVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRecipient" ADD CONSTRAINT "QuotationRecipient_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationStatusEvent" ADD CONSTRAINT "QuotationStatusEvent_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalGrant" ADD CONSTRAINT "PortalGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalGrant" ADD CONSTRAINT "PortalGrant_quotationVersionId_fkey" FOREIGN KEY ("quotationVersionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalGrant" ADD CONSTRAINT "PortalGrant_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_currentIssuedVersionId_fkey" FOREIGN KEY ("currentIssuedVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BusinessDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_quotationVersionId_fkey" FOREIGN KEY ("quotationVersionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_quotationVersionId_fkey" FOREIGN KEY ("quotationVersionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailRecipient" ADD CONSTRAINT "EmailRecipient_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_generatedDocumentId_fkey" FOREIGN KEY ("generatedDocumentId") REFERENCES "GeneratedDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAttempt" ADD CONSTRAINT "DeliveryAttempt_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTranslation" ADD CONSTRAINT "ContentTranslation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ContentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sourceQuotationVersionId_fkey" FOREIGN KEY ("sourceQuotationVersionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "DeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "DeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_deliveryItemId_fkey" FOREIGN KEY ("deliveryItemId") REFERENCES "DeliveryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationRole" ADD CONSTRAINT "InvitationRole_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "StaffInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationRole" ADD CONSTRAINT "InvitationRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ContentEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Additional PostgreSQL invariants for the Phase A REVIEW proposal.
-- Requires staging integration tests before approval; NEVER auto-executed.
ALTER TABLE "QuotationVersion" ADD CONSTRAINT "quotation_financials_valid" CHECK (
  "subtotal" >= 0 AND "discount" BETWEEN 0 AND "subtotal" AND
  "taxPercent" BETWEEN 0 AND 100 AND "tax" >= 0 AND "charges" >= 0 AND
  "total" = "subtotal" - "discount" + "tax" + "charges" AND "revision" > 0 AND
  ("validUntil" IS NULL OR "validUntil" >= "documentDate") AND
  (("issuedAt" IS NULL AND "status" IN ('DRAFT','PENDING_APPROVAL','APPROVED')) OR
   ("issuedAt" IS NOT NULL AND "status" IN ('ISSUED','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED')))
);
ALTER TABLE "QuotationItem" ADD CONSTRAINT "quote_line_valid" CHECK (
  "quantity" > 0 AND "unitPrice" >= 0 AND "lineTotal" = round("quantity" * "unitPrice", 2) AND "position" >= 0
);
ALTER TABLE "RequestItem" ADD CONSTRAINT "request_line_valid" CHECK ("quantity" > 0 AND num_nonnulls("productId", "serviceId") <= 1);
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "request_identity_present" CHECK (num_nonnulls("customerId", "guestId") >= 1);
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "approval_single_target" CHECK (num_nonnulls("quotationVersionId", "documentVersionId") = 1);
ALTER TABLE "PortalGrant" ADD CONSTRAINT "grant_single_target" CHECK (num_nonnulls("quotationVersionId", "documentVersionId") = 1);
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "file_single_source" CHECK (num_nonnulls("quotationVersionId", "documentVersionId") = 1);
ALTER TABLE "EmailRecipient" ADD CONSTRAINT "email_recipient_kind" CHECK ("kind" IN ('TO','CC','BCC'));
ALTER TABLE "EmailMessage" ADD CONSTRAINT "email_review_required" CHECK (
  "state" IN ('DRAFT','FAILED') OR ("approvedRevision" IS NOT NULL AND "approvedRevision" = "revision" AND "approvedByAuditId" IS NOT NULL)
);
ALTER TABLE "PrivateProductPrice" ADD CONSTRAINT "private_price_nonnegative" CHECK ("unitPrice" >= 0);
ALTER TABLE "MediaAsset" ADD CONSTRAINT "private_asset_no_public_url" CHECK ("visibility" <> 'PRIVATE' OR "imageUrl" IS NULL);
ALTER TABLE "MediaAsset" ADD CONSTRAINT "asset_size_positive" CHECK ("bytes" > 0);
ALTER TABLE "NumberSequence" ADD CONSTRAINT "sequence_positive" CHECK ("nextValue" > 0);
ALTER TABLE "Category" ADD CONSTRAINT "category_not_self" CHECK ("parentId" IS NULL OR "parentId" <> "id");
ALTER TABLE "Visit" ADD CONSTRAINT "visit_real_location" CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL) OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180 AND "locationConsentAt" IS NOT NULL)
);
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "address_real_location" CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL) OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180 AND "consentAt" IS NOT NULL)
);
CREATE UNIQUE INDEX "one_verified_claim_per_request" ON "RequestClaim" ("requestId") WHERE "status" = 'VERIFIED';

CREATE FUNCTION aia_freeze_issued_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."issuedAt" IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Issued versions cannot be deleted'; END IF;
    IF (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
      RAISE EXCEPTION 'Issued document content is immutable; create a new revision';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotation_version_frozen BEFORE UPDATE OR DELETE ON "QuotationVersion" FOR EACH ROW EXECUTE FUNCTION aia_freeze_issued_version();
CREATE TRIGGER document_version_frozen BEFORE UPDATE OR DELETE ON "DocumentVersion" FOR EACH ROW EXECUTE FUNCTION aia_freeze_issued_version();

CREATE FUNCTION aia_guard_quote_children() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_id text; frozen_at timestamp;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."versionId" <> OLD."versionId" THEN RAISE EXCEPTION 'Cannot move version children'; END IF;
  IF TG_OP = 'DELETE' THEN target_id := OLD."versionId"; ELSE target_id := NEW."versionId"; END IF;
  SELECT "issuedAt" INTO frozen_at FROM "QuotationVersion" WHERE "id" = target_id FOR UPDATE;
  IF frozen_at IS NOT NULL THEN RAISE EXCEPTION 'Issued quotation lines and recipients are immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotation_items_frozen BEFORE INSERT OR UPDATE OR DELETE ON "QuotationItem" FOR EACH ROW EXECUTE FUNCTION aia_guard_quote_children();
CREATE TRIGGER quotation_recipients_frozen BEFORE INSERT OR UPDATE OR DELETE ON "QuotationRecipient" FOR EACH ROW EXECUTE FUNCTION aia_guard_quote_children();

CREATE FUNCTION aia_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit, approval, template, and generated-file records are append-only'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER approval_append_only BEFORE UPDATE OR DELETE ON "ApprovalRecord" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER template_append_only BEFORE UPDATE OR DELETE ON "TemplateVersion" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER generated_file_append_only BEFORE UPDATE OR DELETE ON "GeneratedDocument" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER quote_history_append_only BEFORE UPDATE OR DELETE ON "QuotationStatusEvent" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER request_history_append_only BEFORE UPDATE OR DELETE ON "RequestStatusEvent" FOR EACH ROW EXECUTE FUNCTION aia_append_only();

CREATE FUNCTION aia_guard_generated_asset() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "GeneratedDocument" WHERE "assetId" = OLD."id") THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Historical generated assets must be retained'; END IF;
    IF (to_jsonb(NEW) - 'archivedAt') IS DISTINCT FROM (to_jsonb(OLD) - 'archivedAt') THEN
      RAISE EXCEPTION 'Historical generated asset metadata is immutable';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER historical_asset_frozen BEFORE UPDATE OR DELETE ON "MediaAsset" FOR EACH ROW EXECUTE FUNCTION aia_guard_generated_asset();

CREATE FUNCTION aia_check_quote_issue() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE line_subtotal numeric; line_count integer;
BEGIN
  IF NEW."issuedAt" IS NOT NULL AND (TG_OP = 'INSERT' OR OLD."issuedAt" IS NULL) THEN
    SELECT coalesce(sum("lineTotal"), 0), count(*) INTO line_subtotal, line_count FROM "QuotationItem" WHERE "versionId" = NEW."id";
    IF line_count = 0 OR line_subtotal <> NEW."subtotal" OR NEW."tax" <> round((NEW."subtotal" - NEW."discount") * NEW."taxPercent" / 100, 2) THEN
      RAISE EXCEPTION 'Issued totals must match stored line items and the approved financial policy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "ApprovalRecord" WHERE "quotationVersionId" = NEW."id" AND "decision" = 'APPROVED' AND "contentHash" = NEW."contentHash") THEN
      RAISE EXCEPTION 'Issuance requires approval of the current content hash';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quote_issue_valid BEFORE INSERT OR UPDATE ON "QuotationVersion" FOR EACH ROW EXECUTE FUNCTION aia_check_quote_issue();

-- A pointer can never cross into a different quotation/document.
ALTER TABLE "Quotation" ADD CONSTRAINT "current_quote_belongs_to_quote" FOREIGN KEY ("id", "currentIssuedVersionId") REFERENCES "QuotationVersion" ("quotationId", "id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "current_document_belongs_to_document" FOREIGN KEY ("id", "currentIssuedVersionId") REFERENCES "DocumentVersion" ("documentId", "id") DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION aia_require_latest_issued() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE aggregate_id text; current_id text; latest_id text;
BEGIN
  IF TG_TABLE_NAME = 'Quotation' THEN aggregate_id := NEW."id";
  ELSIF TG_TABLE_NAME = 'QuotationVersion' THEN aggregate_id := NEW."quotationId";
  ELSIF TG_TABLE_NAME = 'BusinessDocument' THEN aggregate_id := NEW."id";
  ELSE aggregate_id := NEW."documentId";
  END IF;
  IF TG_TABLE_NAME IN ('Quotation', 'QuotationVersion') THEN
    SELECT "currentIssuedVersionId" INTO current_id FROM "Quotation" WHERE "id" = aggregate_id;
    SELECT "id" INTO latest_id FROM "QuotationVersion" WHERE "quotationId" = aggregate_id AND "issuedAt" IS NOT NULL ORDER BY "revision" DESC LIMIT 1;
  ELSE
    SELECT "currentIssuedVersionId" INTO current_id FROM "BusinessDocument" WHERE "id" = aggregate_id;
    SELECT "id" INTO latest_id FROM "DocumentVersion" WHERE "documentId" = aggregate_id AND "issuedAt" IS NOT NULL ORDER BY "revision" DESC LIMIT 1;
  END IF;
  IF current_id IS DISTINCT FROM latest_id THEN RAISE EXCEPTION 'Current version must be the latest officially issued revision'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_current_is_latest AFTER INSERT OR UPDATE ON "Quotation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();
CREATE CONSTRAINT TRIGGER quote_issued_pointer_consistent AFTER INSERT OR UPDATE ON "QuotationVersion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();
CREATE CONSTRAINT TRIGGER document_current_is_latest AFTER INSERT OR UPDATE ON "BusinessDocument" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();
CREATE CONSTRAINT TRIGGER document_issued_pointer_consistent AFTER INSERT OR UPDATE ON "DocumentVersion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();

-- Serialize numbering inside the same transaction as issuing and auditing. Never
-- allocate a number for a preview or a draft. Gaps after voids are retained.
CREATE FUNCTION aia_next_number(sequence_scope text, sequence_period text) RETURNS bigint LANGUAGE sql AS $$
  INSERT INTO "NumberSequence" ("scope", "period", "nextValue") VALUES (sequence_scope, sequence_period, 2)
  ON CONFLICT ("scope", "period") DO UPDATE SET "nextValue" = "NumberSequence"."nextValue" + 1
  RETURNING "nextValue" - 1;
$$;
REVOKE ALL ON FUNCTION aia_next_number(text, text) FROM PUBLIC;

-- Supabase Data API roles must not acquire access through default grants.
-- Runtime/migration role provisioning and FORCE RLS policies need review against
-- the actual target before execution. Prisma service authorization is mandatory.
DO $$ DECLARE t text; r text;
BEGIN
  FOREACH t IN ARRAY ARRAY['User','Session','Role','Permission','RolePermission','RoleAssignment','VerifiedContact','ContactChallenge','AuditLog','Customer','Organization','BusinessContact','CustomerAddress','GuestIdentity','Category','CategoryTranslation','Product','ProductTranslation','PrivateProductPrice','Inventory','Collection','ProductCollection','Service','ServiceTranslation','ProductService','CustomerRequest','RequestItem','RequestClaim','RequestStatusEvent','RequestNote','Visit','StaffAssignment','Quotation','QuotationVersion','QuotationItem','QuotationRecipient','QuotationStatusEvent','PortalGrant','NumberSequence','DocumentTemplate','TemplateVersion','BusinessDocument','DocumentVersion','ApprovalRecord','GeneratedDocument','EmailTemplate','EmailMessage','EmailRecipient','EmailAttachment','DeliveryAttempt','ProviderWebhookEvent','Notification','OutboxJob','CompanySettings','MediaAsset','ProductMedia','ContentEntry','ContentTranslation','Sale','SaleItem','CommercialDocument','PaymentMethod','PaymentRecord','PaymentAllocation','RefundRecord','DeliveryRecord','DeliveryItem','StockMovement','Account','Verification','RateLimit','UserPermission','StaffInvitation','InvitationRole','ContentRevision'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', t, r); END IF;
    END LOOP;
  END LOOP;
END $$;

-- Review only. Currency and exact arithmetic constraints are defense in depth;
-- authorization, approval and actor audit inserts belong in one server transaction.
ALTER TABLE "Sale" ADD CONSTRAINT sale_money CHECK (
  "currency"='BDT' AND "subtotal">=0 AND "discount">=0 AND "discount"<="subtotal"
  AND "taxPercent" BETWEEN 0 AND 100 AND "charges">=0
  AND "tax"=round(("subtotal"-"discount")*"taxPercent"/100,2)
  AND "total"="subtotal"-"discount"+"tax"+"charges"
  AND "total" BETWEEN 0 AND 999999999999.99
  AND (("state"='DRAFT' AND "committedAt" IS NULL) OR ("state"<>'DRAFT' AND "committedAt" IS NOT NULL)));
ALTER TABLE "SaleItem" ADD CONSTRAINT sale_item_money CHECK ("position">0 AND "quantity">0 AND "unitPrice">=0 AND "lineTotal"=round("quantity"*"unitPrice",2));
ALTER TABLE "PaymentRecord" ADD CONSTRAINT payment_positive CHECK ("amount">0 AND "currency"='BDT');
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT allocation_positive CHECK ("amount">0);
ALTER TABLE "RefundRecord" ADD CONSTRAINT refund_positive CHECK ("amount">0 AND length(trim("reason"))>0);
ALTER TABLE "DeliveryItem" ADD CONSTRAINT delivery_positive CHECK ("quantity">0);
ALTER TABLE "StockMovement" ADD CONSTRAINT movement_nonzero CHECK ("quantityDelta"<>0 AND length(trim("reason"))>0);
ALTER TABLE "Inventory" ADD CONSTRAINT inventory_nonnegative CHECK ("quantity">=0 AND "reorderPoint">=0);
ALTER TABLE "CommercialDocument" ADD CONSTRAINT commercial_event_kind CHECK (
  ("kind"='RECEIPT' AND "paymentId" IS NOT NULL AND "deliveryId" IS NULL) OR
  ("kind"='CHALLAN' AND "deliveryId" IS NOT NULL AND "paymentId" IS NULL) OR
  ("kind" IN ('MEMO','INVOICE') AND "paymentId" IS NULL AND "deliveryId" IS NULL));

-- Posted financial events are append-only. Corrections need compensating events,
-- with an approved refund/void policy before exposing a write API.
CREATE FUNCTION aia1_append_only() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'Financial events are append-only; use an authorized compensating event';
END $$;
CREATE TRIGGER payment_append_only BEFORE UPDATE OR DELETE ON "PaymentRecord" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER allocation_append_only BEFORE UPDATE OR DELETE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER refund_append_only BEFORE UPDATE OR DELETE ON "RefundRecord" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER delivery_append_only BEFORE UPDATE OR DELETE ON "DeliveryRecord" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER delivery_item_append_only BEFORE UPDATE OR DELETE ON "DeliveryItem" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER stock_append_only BEFORE UPDATE OR DELETE ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();

CREATE FUNCTION aia1_sale_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE locked boolean; aggregate_id text;
BEGIN
  IF TG_TABLE_NAME='Sale' THEN locked:=OLD."state"<>'DRAFT';
  ELSE
    IF TG_OP='INSERT' THEN aggregate_id:=NEW."saleId"; ELSE aggregate_id:=OLD."saleId"; END IF;
    SELECT "state"<>'DRAFT' INTO locked FROM "Sale" WHERE "id"=aggregate_id;
    IF TG_OP='UPDATE' AND NEW."saleId" IS DISTINCT FROM OLD."saleId" THEN RAISE EXCEPTION 'Sale items cannot move between aggregates'; END IF;
  END IF;
  IF locked THEN RAISE EXCEPTION 'Committed sale snapshots are immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER sale_immutable BEFORE UPDATE OR DELETE ON "Sale" FOR EACH ROW EXECUTE FUNCTION aia1_sale_immutable();
CREATE TRIGGER sale_item_immutable BEFORE INSERT OR UPDATE OR DELETE ON "SaleItem" FOR EACH ROW EXECUTE FUNCTION aia1_sale_immutable();

CREATE FUNCTION aia1_commercial_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF EXISTS(SELECT 1 FROM "DocumentVersion" d WHERE d."id"=OLD."documentVersionId" AND d."issuedAt" IS NOT NULL)
  THEN RAISE EXCEPTION 'Issued commercial snapshots are immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER commercial_immutable BEFORE UPDATE OR DELETE ON "CommercialDocument" FOR EACH ROW EXECUTE FUNCTION aia1_commercial_immutable();

CREATE FUNCTION aia1_check_sale_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW."sourceQuotationVersionId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "QuotationVersion" q WHERE q."id"=NEW."sourceQuotationVersionId" AND q."status" IN ('APPROVED','ISSUED','SENT','VIEWED','ACCEPTED'))
  THEN RAISE EXCEPTION 'Sale source must be an approved quotation revision'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sale_source_eligible BEFORE INSERT OR UPDATE ON "Sale" FOR EACH ROW EXECUTE FUNCTION aia1_check_sale_source();

-- Lock affected records in a stable order before calling this validation at the
-- service layer. These deferred triggers also guard malformed direct writes.
CREATE FUNCTION aia1_financial_consistency() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF EXISTS(SELECT 1 FROM "Sale" s WHERE s."state"='COMMITTED' AND
    (NOT EXISTS(SELECT 1 FROM "SaleItem" i WHERE i."saleId"=s."id") OR
     s."subtotal"<>(SELECT coalesce(sum(i."lineTotal"),0) FROM "SaleItem" i WHERE i."saleId"=s."id")))
  THEN RAISE EXCEPTION 'Committed sale requires exact item snapshots'; END IF;
  IF EXISTS(SELECT 1 FROM "PaymentRecord" p WHERE
     (SELECT coalesce(sum(a."amount"),0) FROM "PaymentAllocation" a WHERE a."paymentId"=p."id")>p."amount" OR
     (SELECT coalesce(sum(r."amount"),0) FROM "RefundRecord" r WHERE r."paymentId"=p."id")>p."amount")
  THEN RAISE EXCEPTION 'Payment allocation or refund exceeds recorded amount'; END IF;
  IF EXISTS(SELECT 1 FROM "PaymentAllocation" a JOIN "Sale" s ON s."id"=a."saleId" JOIN "PaymentRecord" p ON p."id"=a."paymentId"
     WHERE s."state"<>'COMMITTED' OR p."state"<>'POSTED' OR p."currency"<>s."currency" OR p."demoScope" IS DISTINCT FROM s."demoScope")
  THEN RAISE EXCEPTION 'Allocation requires matching committed sale and posted payment scope'; END IF;
  IF EXISTS(SELECT 1 FROM "Sale" s WHERE (SELECT coalesce(sum(a."amount"),0) FROM "PaymentAllocation" a WHERE a."saleId"=s."id")>s."total")
  THEN RAISE EXCEPTION 'Sale is overallocated'; END IF;
  IF EXISTS(SELECT 1 FROM "DeliveryItem" d JOIN "DeliveryRecord" r ON r."id"=d."deliveryId" JOIN "SaleItem" i ON i."id"=d."saleItemId"
     JOIN "Sale" s ON s."id"=i."saleId" WHERE i."saleId"<>r."saleId" OR s."state"<>'COMMITTED')
  THEN RAISE EXCEPTION 'Delivery item must belong to its committed sale'; END IF;
  IF EXISTS(SELECT 1 FROM "SaleItem" i WHERE (SELECT coalesce(sum(d."quantity"),0) FROM "DeliveryItem" d WHERE d."saleItemId"=i."id")>i."quantity")
  THEN RAISE EXCEPTION 'Delivery exceeds sale quantity'; END IF;
  IF EXISTS(SELECT 1 FROM "StockMovement" m JOIN "DeliveryItem" d ON d."id"=m."deliveryItemId" JOIN "SaleItem" i ON i."id"=d."saleItemId"
    JOIN "Sale" s ON s."id"=i."saleId" WHERE m."productId" IS DISTINCT FROM i."productId" OR m."quantityDelta"<>-d."quantity" OR m."demoScope" IS DISTINCT FROM s."demoScope")
  THEN RAISE EXCEPTION 'Stock delivery event must match product, scope and exact quantity'; END IF;
  IF EXISTS(SELECT 1 FROM "CommercialDocument" c WHERE
     (c."kind"='RECEIPT' AND NOT EXISTS(SELECT 1 FROM "PaymentAllocation" a JOIN "PaymentRecord" p ON p."id"=a."paymentId" WHERE a."paymentId"=c."paymentId" AND a."saleId"=c."saleId" AND p."state"='POSTED')) OR
     (c."kind"='CHALLAN' AND NOT EXISTS(SELECT 1 FROM "DeliveryRecord" d WHERE d."id"=c."deliveryId" AND d."saleId"=c."saleId")))
  THEN RAISE EXCEPTION 'Receipt/challan requires its actual allocated payment/delivery'; END IF;
  RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['Sale','SaleItem','PaymentRecord','PaymentAllocation','RefundRecord','DeliveryRecord','DeliveryItem','CommercialDocument','StockMovement'] LOOP
    EXECUTE format('CREATE CONSTRAINT TRIGGER financial_consistency AFTER INSERT OR UPDATE OR DELETE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia1_financial_consistency()',t);
  END LOOP;
END $$;

COMMIT;
