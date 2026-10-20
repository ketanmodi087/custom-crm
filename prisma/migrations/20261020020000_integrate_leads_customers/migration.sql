-- Strengthen tenant-consistent customer/contact relations.
CREATE UNIQUE INDEX "Customer_id_tenantId_key" ON "Customer"("id", "tenantId");
CREATE UNIQUE INDEX "Contact_id_tenantId_key" ON "Contact"("id", "tenantId");
CREATE UNIQUE INDEX "Contact_id_customerId_tenantId_key" ON "Contact"("id", "customerId", "tenantId");

ALTER TABLE "Contact" DROP CONSTRAINT "Contact_customerId_fkey";
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_tenantId_fkey"
  FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add optional master-data links so existing Leads remain valid.
ALTER TABLE "Lead"
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "contactId" TEXT,
  ADD COLUMN "convertedAt" TIMESTAMP(3);

CREATE INDEX "Lead_tenantId_customerId_idx" ON "Lead"("tenantId", "customerId");
CREATE INDEX "Lead_tenantId_contactId_idx" ON "Lead"("tenantId", "contactId");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_tenantId_fkey"
  FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_customerId_tenantId_fkey"
  FOREIGN KEY ("contactId", "customerId", "tenantId") REFERENCES "Contact"("id", "customerId", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
