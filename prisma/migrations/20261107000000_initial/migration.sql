-- Technical probe table only; business schema is deferred to a later phase.
CREATE TABLE "DatabaseHealthCheck" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseHealthCheck_pkey" PRIMARY KEY ("id")
);
