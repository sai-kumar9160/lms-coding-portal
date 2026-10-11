-- Existing accounts stay ACTIVE. New self-registered teachers start PENDING.
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE');
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- (collegeId, email) does not stop duplicates when collegeId is NULL.
-- Platform accounts get their own unique email index. Prisma cannot model this partial index.
CREATE UNIQUE INDEX "User_platform_email_key" ON "User"("email") WHERE "collegeId" IS NULL;
