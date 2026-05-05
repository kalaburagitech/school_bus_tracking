-- Add soft-delete and update audit columns
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Bus" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Bus" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Bus" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Student" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Student" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Student" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "User_tenantId_isDeleted_idx" ON "User"("tenantId", "isDeleted");
CREATE INDEX "Bus_tenantId_isDeleted_idx" ON "Bus"("tenantId", "isDeleted");
CREATE INDEX "Student_tenantId_isDeleted_idx" ON "Student"("tenantId", "isDeleted");
