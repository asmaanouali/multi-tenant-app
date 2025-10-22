-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "CatalogType" AS ENUM ('WORLD_SPECIAL_DAYS', 'NATIONAL_HOLIDAYS', 'REGIONAL_HOLIDAYS');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('CATALOG', 'ORGANIZATION');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CatalogType" NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_events" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_events_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "organization_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "source" "EventSource" NOT NULL DEFAULT 'ORGANIZATION',
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "catalogs_type_idx" ON "catalogs"("type");

-- CreateIndex
CREATE INDEX "catalogs_country_idx" ON "catalogs"("country");

-- CreateIndex
CREATE INDEX "catalog_events_catalogId_idx" ON "catalog_events"("catalogId");

-- CreateIndex
CREATE INDEX "catalog_events_startDate_idx" ON "catalog_events"("startDate");

-- CreateIndex
CREATE INDEX "catalog_events_endDate_idx" ON "catalog_events"("endDate");

-- CreateIndex
CREATE INDEX "catalog_subscriptions_tenantId_idx" ON "catalog_subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "catalog_subscriptions_catalogId_idx" ON "catalog_subscriptions"("catalogId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_subscriptions_tenantId_catalogId_key" ON "catalog_subscriptions"("tenantId", "catalogId");

-- CreateIndex
CREATE INDEX "organization_events_tenantId_idx" ON "organization_events"("tenantId");

-- CreateIndex
CREATE INDEX "organization_events_startDate_idx" ON "organization_events"("startDate");

-- CreateIndex
CREATE INDEX "organization_events_endDate_idx" ON "organization_events"("endDate");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_events" ADD CONSTRAINT "catalog_events_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_subscriptions" ADD CONSTRAINT "catalog_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_subscriptions" ADD CONSTRAINT "catalog_subscriptions_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_events" ADD CONSTRAINT "organization_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
