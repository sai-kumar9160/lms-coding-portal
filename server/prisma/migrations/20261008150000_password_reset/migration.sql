-- One-time password reset links (only the token's SHA-256 is stored).
CREATE TABLE "pwd_rst_tkn_dtl_t" (
    "rst_tkn_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tkn_hash_tx" TEXT NOT NULL,
    "expires_ts" TIMESTAMP(3) NOT NULL,
    "used_ts" TIMESTAMP(3),
    "rqst_ip_tx" TEXT,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1 CHECK ("a_in" IN (0, 1)),
    "d_ts" TIMESTAMP(3),
    CONSTRAINT "pwd_rst_tkn_dtl_t_pkey" PRIMARY KEY ("rst_tkn_id")
);

CREATE UNIQUE INDEX "pwd_rst_tkn_dtl_t_tkn_hash_tx_key" ON "pwd_rst_tkn_dtl_t"("tkn_hash_tx");
CREATE INDEX "pwd_rst_tkn_dtl_t_user_id_idx" ON "pwd_rst_tkn_dtl_t"("user_id");
ALTER TABLE "pwd_rst_tkn_dtl_t" ADD CONSTRAINT "pwd_rst_tkn_dtl_t_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER "pwd_rst_tkn_dtl_t_audit_timestamps" BEFORE UPDATE ON "pwd_rst_tkn_dtl_t"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
