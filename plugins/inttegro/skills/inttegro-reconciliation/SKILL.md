---
metadata:
  internal: true
name: inttegro-reconciliation
description: Inspect Inttegro balances, balance transactions, payouts, payout settings, country capabilities, and payment-method policy for operational reconciliation. Use when a merchant asks where money is, why balances and payouts differ, whether a payout failed, or what settlement configuration applies. Do not use for accounting certification, moving funds, changing payout settings, or exposing payment credentials.
---

# Inttegro reconciliation

Explain the evidence returned by Inttegro without overstating completeness.

## Workflow

1. Start with `get_balances` for the current snapshot. Note its cutoff time and present the exact major-unit decimal amounts by currency.
2. Use `list_balance_transactions` to trace related order, payment, and payout IDs. A bounded page is not a full ledger.
3. Use `list_payouts` and `get_payout` for payout amount, status, timing, destination ID, and minimized failure detail.
4. Use `get_payout_analytics` for full-period payout starts, outcomes, lateness, and exact currency-specific amounts. Do not infer these totals from a payout page.
5. Use `get_payout_settings` for automatic schedule, FX status, currency mappings, and balance aging policy.
6. Use `get_payment_method_settings` to explain enabled methods and confirmation policy without exposing credentials.
7. Use `get_country_specifications` when the answer depends on country currencies, methods, payout schedules, onboarding capabilities, or bank directory conventions.

Reconcile only records that share explicit IDs, currencies, and time boundaries. Never add amounts across currencies or silently convert units. Separate confirmed facts, likely explanations, and missing evidence. Escalate unresolved payout failures with the returned reference or request ID.
