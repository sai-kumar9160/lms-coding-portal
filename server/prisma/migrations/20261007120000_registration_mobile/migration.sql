-- Existing accounts retain a null mobile number until a real number is provided.
ALTER TABLE "User" ADD COLUMN "mobile_no" TEXT;
CREATE UNIQUE INDEX "User_collegeId_mobile_no_key" ON "User"("collegeId", "mobile_no");
