-- Tenant status and profile fields
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "UserOperationalStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Tenant" ADD COLUMN "code" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "phone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "email" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "address" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "city" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "state" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Tenant" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "licenseNo" TEXT;
ALTER TABLE "User" ADD COLUMN "experienceYears" INTEGER;
ALTER TABLE "User" ADD COLUMN "operationalStatus" "UserOperationalStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Bus" ADD COLUMN "busNumber" TEXT;
ALTER TABLE "Bus" ADD COLUMN "vehicleNumber" TEXT;

ALTER TABLE "Student" ADD COLUMN "studentClass" TEXT;
ALTER TABLE "Student" ADD COLUMN "address" TEXT;
ALTER TABLE "Student" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Student" ADD COLUMN "longitude" DOUBLE PRECISION;

CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX "User_operationalStatus_idx" ON "User"("operationalStatus");
CREATE INDEX "Student_studentClass_idx" ON "Student"("studentClass");

CREATE TABLE "BusStaffAssignment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "busId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusStaffAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusStaffAssignment_busId_staffId_key"
  ON "BusStaffAssignment"("busId", "staffId");
CREATE INDEX "BusStaffAssignment_tenantId_busId_idx"
  ON "BusStaffAssignment"("tenantId", "busId");
CREATE INDEX "BusStaffAssignment_tenantId_staffId_idx"
  ON "BusStaffAssignment"("tenantId", "staffId");

ALTER TABLE "BusStaffAssignment"
  ADD CONSTRAINT "BusStaffAssignment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusStaffAssignment"
  ADD CONSTRAINT "BusStaffAssignment_busId_fkey"
  FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusStaffAssignment"
  ADD CONSTRAINT "BusStaffAssignment_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
