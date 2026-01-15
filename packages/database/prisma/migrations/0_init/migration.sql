-- Baseline migration - represents the current database state
-- This migration was created after db push to establish a baseline
-- for future migrations to work correctly.

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA_OS', 'AJUSTE');
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'READY', 'DELIVERED', 'CANCELED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'OTHER');
CREATE TYPE "TenantStatus" AS ENUM ('PENDING_ACTIVATION', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'PAST_DUE', 'CANCELED');
CREATE TYPE "UserRole" AS ENUM ('ADMIN_SAAS', 'OWNER', 'MANAGER', 'MEMBER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- Note: All tables and indexes already exist in the database.
-- This is a baseline-only migration to sync the migration history.
-- No actual schema changes are made by this migration.

SELECT 1;
