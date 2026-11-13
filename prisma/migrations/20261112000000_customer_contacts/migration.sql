-- Additive only: existing customer identities, relationships and history remain intact.
-- Contact values are unverified business details, never portal ownership proof.
ALTER TABLE "Customer" ADD COLUMN "email" TEXT, ADD COLUMN "phone" TEXT;
