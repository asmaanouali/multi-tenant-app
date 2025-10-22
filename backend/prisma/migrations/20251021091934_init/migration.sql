/*
  Warnings:

  - You are about to drop the column `source` on the `organization_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "catalog_events" ADD COLUMN     "country" TEXT,
ADD COLUMN     "industries" TEXT[],
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "organization_events" DROP COLUMN "source";

-- DropEnum
DROP TYPE "public"."EventSource";

-- CreateTable
CREATE TABLE "hidden_catalog_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "catalogEventId" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hidden_catalog_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hidden_catalog_events_tenantId_idx" ON "hidden_catalog_events"("tenantId");

-- CreateIndex
CREATE INDEX "hidden_catalog_events_catalogEventId_idx" ON "hidden_catalog_events"("catalogEventId");

-- CreateIndex
CREATE UNIQUE INDEX "hidden_catalog_events_tenantId_catalogEventId_key" ON "hidden_catalog_events"("tenantId", "catalogEventId");

-- CreateIndex
CREATE INDEX "catalog_events_country_idx" ON "catalog_events"("country");

-- AddForeignKey
ALTER TABLE "hidden_catalog_events" ADD CONSTRAINT "hidden_catalog_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
