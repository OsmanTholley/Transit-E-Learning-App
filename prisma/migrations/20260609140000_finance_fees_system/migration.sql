-- Finance & fees tracking
CREATE TYPE "FeePaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

CREATE TABLE "fee_structures" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'GHS',
    "program_id" UUID,
    "level" VARCHAR(50),
    "semester" VARCHAR(50),
    "intake_batch" VARCHAR(50),
    "due_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_fee_accounts" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "fee_structure_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "FeePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "due_date" TIMESTAMP(3),
    "access_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fee_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "student_fee_account_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" VARCHAR(50),
    "reference" VARCHAR(120),
    "receipt_number" VARCHAR(50) NOT NULL,
    "recorded_by_id" UUID,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fee_invoices" (
    "id" UUID NOT NULL,
    "student_fee_account_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_fee_accounts_student_id_fee_structure_id_key" ON "student_fee_accounts"("student_id", "fee_structure_id");
CREATE INDEX "idx_student_fee_accounts_status" ON "student_fee_accounts"("status");
CREATE INDEX "idx_student_fee_accounts_student" ON "student_fee_accounts"("student_id");
CREATE INDEX "idx_fee_structures_active_due" ON "fee_structures"("is_active", "due_date");
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");
CREATE INDEX "idx_payments_account_paid_at" ON "payments"("student_fee_account_id", "paid_at");
CREATE UNIQUE INDEX "fee_invoices_invoice_number_key" ON "fee_invoices"("invoice_number");

ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_fee_accounts" ADD CONSTRAINT "student_fee_accounts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_fee_accounts" ADD CONSTRAINT "student_fee_accounts_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_fee_account_id_fkey" FOREIGN KEY ("student_fee_account_id") REFERENCES "student_fee_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_student_fee_account_id_fkey" FOREIGN KEY ("student_fee_account_id") REFERENCES "student_fee_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
