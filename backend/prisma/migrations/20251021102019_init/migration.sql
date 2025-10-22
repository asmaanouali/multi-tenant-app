/*
  Warnings:

  - You are about to drop the column `country` on the `catalogs` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `catalogs` table. All the data in the column will be lost.
  - You are about to drop the `catalog_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type]` on the table `catalogs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."catalog_subscriptions" DROP CONSTRAINT "catalog_subscriptions_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "public"."catalog_subscriptions" DROP CONSTRAINT "catalog_subscriptions_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."catalogs_country_idx";

-- DropIndex
DROP INDEX "public"."catalogs_type_idx";

-- AlterTable
ALTER TABLE "catalog_events" ADD COLUMN     "country" TEXT,
ADD COLUMN     "industries" TEXT[],
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "catalogs" DROP COLUMN "country",
DROP COLUMN "region";

-- DropTable
DROP TABLE "public"."catalog_subscriptions";

-- CreateTable
CREATE TABLE "event_subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "catalogEventId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_subscriptions_tenantId_idx" ON "event_subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "event_subscriptions_catalogEventId_idx" ON "event_subscriptions"("catalogEventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_subscriptions_tenantId_catalogEventId_key" ON "event_subscriptions"("tenantId", "catalogEventId");

-- CreateIndex
CREATE INDEX "catalog_events_country_idx" ON "catalog_events"("country");

-- CreateIndex
CREATE INDEX "catalog_events_region_idx" ON "catalog_events"("region");

-- CreateIndex
CREATE UNIQUE INDEX "catalogs_type_key" ON "catalogs"("type");

-- AddForeignKey
ALTER TABLE "event_subscriptions" ADD CONSTRAINT "event_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subscriptions" ADD CONSTRAINT "event_subscriptions_catalogEventId_fkey" FOREIGN KEY ("catalogEventId") REFERENCES "catalog_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
