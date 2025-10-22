/*
  Warnings:

  - Added the required column `createdById` to the `organization_events` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."catalogs_type_key";

-- AlterTable
ALTER TABLE "organization_events" ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "catalog_subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_subscriptions_tenantId_idx" ON "catalog_subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "catalog_subscriptions_catalogId_idx" ON "catalog_subscriptions"("catalogId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_subscriptions_tenantId_catalogId_key" ON "catalog_subscriptions"("tenantId", "catalogId");

-- CreateIndex
CREATE INDEX "organization_events_createdById_idx" ON "organization_events"("createdById");

-- AddForeignKey
ALTER TABLE "catalog_subscriptions" ADD CONSTRAINT "catalog_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_subscriptions" ADD CONSTRAINT "catalog_subscriptions_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_events" ADD CONSTRAINT "organization_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
