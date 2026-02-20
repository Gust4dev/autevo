-- AlterTable
ALTER TABLE "InspectionItem" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate data
UPDATE "InspectionItem" 
SET "photos" = ARRAY["photoUrl"] 
WHERE "photoUrl" IS NOT NULL AND ("photos" IS NULL OR array_length("photos", 1) IS NULL);
