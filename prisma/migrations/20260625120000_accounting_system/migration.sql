-- Accounting system schema (tables created by Prisma migrate)
-- This migration adds constraints, triggers, and helper functions.

-- Non-negative debit/credit on journal lines
DO $$ BEGIN
  ALTER TABLE "JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_amounts_non_negative"
    CHECK ("debitAmount" >= 0 AND "creditAmount" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
-- Auto-update Account.updatedAt
CREATE OR REPLACE FUNCTION accounting_set_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS account_updated_at ON "Account";
CREATE TRIGGER account_updated_at
  BEFORE UPDATE ON "Account"
  FOR EACH ROW
  EXECUTE FUNCTION accounting_set_account_updated_at();

-- Enforce balanced journal entries when status is posted
CREATE OR REPLACE FUNCTION accounting_check_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  entry_status TEXT;
  total_debit DOUBLE PRECISION;
  total_credit DOUBLE PRECISION;
  entry_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    entry_id := OLD."journalEntryId";
  ELSE
    entry_id := NEW."journalEntryId";
  END IF;

  SELECT "status" INTO entry_status FROM "JournalEntry" WHERE id = entry_id;

  IF entry_status IS NULL OR entry_status <> 'posted' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT COALESCE(SUM("debitAmount"), 0), COALESCE(SUM("creditAmount"), 0)
  INTO total_debit, total_credit
  FROM "JournalEntryLine"
  WHERE "journalEntryId" = entry_id;

  IF ABS(total_debit - total_credit) > 0.009 THEN
    RAISE EXCEPTION 'Journal entry % is not balanced: debit=% credit=%', entry_id, total_debit, total_credit;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journal_line_balance_check ON "JournalEntryLine";
CREATE TRIGGER journal_line_balance_check
  AFTER INSERT OR UPDATE OR DELETE ON "JournalEntryLine"
  FOR EACH ROW
  EXECUTE FUNCTION accounting_check_journal_balance();

CREATE OR REPLACE FUNCTION accounting_check_entry_on_post()
RETURNS TRIGGER AS $$
DECLARE
  total_debit DOUBLE PRECISION;
  total_credit DOUBLE PRECISION;
BEGIN
  IF NEW."status" = 'posted' AND (OLD."status" IS DISTINCT FROM 'posted') THEN
    SELECT COALESCE(SUM("debitAmount"), 0), COALESCE(SUM("creditAmount"), 0)
    INTO total_debit, total_credit
    FROM "JournalEntryLine"
    WHERE "journalEntryId" = NEW.id;

    IF ABS(total_debit - total_credit) > 0.009 THEN
      RAISE EXCEPTION 'Cannot post unbalanced journal entry %: debit=% credit=%', NEW.id, total_debit, total_credit;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journal_entry_post_balance ON "JournalEntry";
CREATE TRIGGER journal_entry_post_balance
  BEFORE UPDATE ON "JournalEntry"
  FOR EACH ROW
  EXECUTE FUNCTION accounting_check_entry_on_post();

-- Account balance helper
CREATE OR REPLACE FUNCTION get_account_balance(
  p_account_id TEXT,
  p_shop_id TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  nb TEXT;
  total_debit DOUBLE PRECISION;
  total_credit DOUBLE PRECISION;
BEGIN
  SELECT "normalBalance" INTO nb
  FROM "Account"
  WHERE id = p_account_id AND "shopId" = p_shop_id;

  IF nb IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(jel."debitAmount"), 0), COALESCE(SUM(jel."creditAmount"), 0)
  INTO total_debit, total_credit
  FROM "JournalEntryLine" jel
  JOIN "JournalEntry" je ON je.id = jel."journalEntryId"
  WHERE jel."accountId" = p_account_id
    AND jel."shopId" = p_shop_id
    AND je."status" = 'posted'
    AND (p_start_date IS NULL OR je."entryDate" >= p_start_date)
    AND (p_end_date IS NULL OR je."entryDate" <= p_end_date);

  IF nb = 'debit' THEN
    RETURN total_debit - total_credit;
  ELSE
    RETURN total_credit - total_debit;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
