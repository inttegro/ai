# Inttegro agent skills

These are the canonical, standalone merchant workflows bundled by the Inttegro
agent plugin. Each directory follows the open Agent Skills `SKILL.md` format and
can be installed independently in a skills-compatible host that already has an
authenticated Inttegro MCP connection.

| Skill | Use it for |
| --- | --- |
| `inttegro-collect-unpaid-orders` | Unpaid-order queues, approved collection actions, and payment reconciliation |
| `inttegro-customer-care` | Customer activity, record maintenance, and consented messaging |
| `inttegro-daily-brief` | Numbers-first operating and sales briefs |
| `inttegro-files` | Private files and intentional sharing |
| `inttegro-fulfill-and-close` | Paid-order closeout, completion, and receipt delivery |
| `inttegro-integration-builder` | API, SDK, Checkout, and integration readiness decisions |
| `inttegro-launch-offer` | Product, price, publication, and buy-link launches |
| `inttegro-message-templates` | Reusable SMS and email template lifecycles |
| `inttegro-order-desk` | Order investigation, creation, invoices, and receipts |
| `inttegro-payment-refund` | Secure payment selection and line-item refunds |
| `inttegro-reconciliation` | Balances, payouts, settings, and operational reconciliation |
| `inttegro-resolve-customer-case` | Evidence-led customer support and approved resolution |
| `inttegro-sell-by-link` | Products, prices, hosted buy links, and link delivery |

## Install with the skills CLI

Install the collection:

```bash
npx skills add inttegro/ai
```

Install one workflow:

```bash
npx skills add inttegro/ai --skill inttegro-order-desk
```

The public catalog is available at
[skills.sh/inttegro/ai](https://skills.sh/inttegro/ai).

## Install one skill from a clone

Copy the complete skill directory into a supported project or user skills
location. For example:

```bash
cp -R skills/inttegro-order-desk /path/to/project/.agents/skills/
```

Use `.claude/skills/` or `.github/skills/` instead when that is the host's
documented project location. Review skill instructions before installing them.
No skill contains credentials or bypasses Inttegro's server-side authorization
and confirmation controls.
