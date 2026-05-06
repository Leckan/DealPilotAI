import { DealAnalysis, DealInput } from "./deal-calculations";

export type DealRecord = DealAnalysis & {
  userId?: string;
};

export type NewDealRecord = DealInput & {
  userId?: string;
};

// PostgreSQL-ready reference schema for the first database-backed iteration.
// The MVP currently saves analyzed deals in localStorage, but this shape keeps
// the app ready for Neon, Supabase, RDS, or another PostgreSQL provider.
export const dealTableSql = `
CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  address TEXT NOT NULL,
  purchase_price NUMERIC(12, 2) NOT NULL,
  arv NUMERIC(12, 2) NOT NULL,
  rehab_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  annual_taxes NUMERIC(12, 2) NOT NULL DEFAULT 0,
  annual_insurance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  loan_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(6, 3) NOT NULL DEFAULT 0,
  holding_period INTEGER NOT NULL,
  exit_strategy TEXT NOT NULL CHECK (exit_strategy IN ('Flip', 'Rental', 'BRRRR', 'Multifamily')),
  max_allowable_offer NUMERIC(12, 2) NOT NULL,
  estimated_profit NUMERIC(12, 2) NOT NULL,
  roi NUMERIC(8, 2) NOT NULL,
  monthly_cash_flow NUMERIC(12, 2) NOT NULL,
  noi NUMERIC(12, 2) NOT NULL,
  cap_rate NUMERIC(8, 2) NOT NULL,
  cash_on_cash_return NUMERIC(8, 2) NOT NULL,
  dscr NUMERIC(8, 2) NOT NULL,
  deal_score INTEGER NOT NULL CHECK (deal_score BETWEEN 0 AND 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  recommendation TEXT NOT NULL CHECK (recommendation IN ('Strong Buy', 'Maybe', 'Avoid')),
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
