---
metadata:
  internal: true
name: inttegro-daily-brief
description: Produce a concise, numbers-first operating brief for an Inttegro merchant using live orders, balances, and order, product, customer, payout, or message analytics. Use when the user asks how the business is doing, what changed, what needs attention, top products or customers, payout performance, message delivery, today's status, or a sales overview. Do not use for bookkeeping conclusions, moving funds, or creating or messaging records.
---

# Inttegro daily brief

Build the brief from live Inttegro MCP results. Never substitute invented examples for missing data.

## Workflow

1. Establish the requested currency and reporting period. For an unspecified overview, use `30d` and the merchant's clearly established operating currency; otherwise ask for the currency rather than guessing. Analytics accepts `7d`, `30d`, or `90d`—not a `today` period. For a today-specific question, use the dated daily series from `7d` and label its UTC-day and incomplete-day coverage; if no bucket exists for today, report missing coverage rather than zero. Do not present a seven-day total as today's total.
2. Call only the smallest useful set of tools:
   - `get_order_analytics` for starts, paid orders, cancellations, expirations, gross volume, comparisons, and daily series.
   - `get_product_analytics` for product rankings.
   - `get_customer_analytics` for new customers and customer rankings.
   - `get_payout_analytics` for payout lifecycle, lateness, and exact requested, disbursed, or failed major-unit amounts.
   - `get_message_analytics` for initialized, delivered, failed, and delivered-to-initialized activity trends without message content; do not call the period ratio a cohort delivery rate.
   - `get_balances` for current balance snapshots.
   - `list_orders` for recent operational exceptions that aggregate analytics cannot explain.
   - When the request requires every matching order rather than a recent sample, continue `list_orders` sequentially while `may_have_more` is true through page 10, deduplicate IDs, and disclose the 500-order ceiling if more may remain.
3. State the period, currency, data status, and whether a comparison lacks a prior baseline.
4. Present every amount using the returned exact major-unit decimal string and currency. Minor-unit integers are supplemental machine data and should not be the merchant-facing value.
5. Lead with the exact findings that answer the request, then identify only decisions or follow-ups justified by the data.
6. When the host advertises MCP Apps UI and a visual summary helps, call `render_analytics_dashboard` once with the exact analytics result and matching `analytics_type`. Otherwise summarize the returned metrics and Flint chart data directly. Do not recalculate or rewrite the input metrics.

If analytics is unavailable, say so and fall back only to the read tools that answer the question. Do not portray a bounded page as a full-period total.
