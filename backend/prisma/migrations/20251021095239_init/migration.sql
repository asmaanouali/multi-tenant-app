/*
  Warnings:

  - You are about to drop the column `country` on the `catalog_events` table. All the data in the column will be lost.
  - You are about to drop the column `industries` on the `catalog_events` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `catalog_events` table. All the data in the column will be lost.
  - You are about to drop the `hidden_catalog_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('CATALOG', 'ORGANIZATION');

-- DropForeignKey
ALTER TABLE "public"."hidden_catalog_events" DROP CONSTRAINT "hidden_catalog_events_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."catalog_events_country_idx";

-- AlterTable
ALTER TABLE "catalog_events" DROP COLUMN "country",
DROP COLUMN "industries",
DROP COLUMN "region";

-- AlterTable
ALTER TABLE "organization_events" ADD COLUMN     "source" "EventSource" NOT NULL DEFAULT 'ORGANIZATION';

-- DropTable
DROP TABLE "public"."hidden_catalog_events";
