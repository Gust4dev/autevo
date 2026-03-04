-- Step 1: Add optional tenantId column
ALTER TABLE "ServiceProductTemplate" ADD COLUMN "tenantId" TEXT;

-- Step 2: Populate from the related Service's tenantId
UPDATE "ServiceProductTemplate" spt
SET "tenantId" = s."tenantId"
FROM "Service" s
WHERE spt."serviceId" = s.id;

-- Step 3: Make it NOT NULL
ALTER TABLE "ServiceProductTemplate" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 4: Add index
CREATE INDEX "ServiceProductTemplate_tenantId_idx" ON "ServiceProductTemplate"("tenantId");

-- Step 5: Add foreign key
ALTER TABLE "ServiceProductTemplate" ADD CONSTRAINT "ServiceProductTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
