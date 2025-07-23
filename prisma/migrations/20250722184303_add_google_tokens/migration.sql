-- AlterTable
ALTER TABLE "GoogleToken" ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'active';
