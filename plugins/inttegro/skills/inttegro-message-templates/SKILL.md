---
metadata:
  internal: true
name: inttegro-message-templates
description: Create, inspect, preview, publish, archive, and send reusable Inttegro SMS or email message templates. Use when a merchant asks to manage Chime templates, reuse notification copy, validate variables, review a rendered customer message, or send a published template to a saved customer. Do not use for arbitrary recipients, bulk outreach, scheduled messaging, or sending unreviewed draft content.
---

# Inttegro message templates

Treat the draft, published version, rendered copy, and customer send as separate states.

## Find and inspect

1. Use `list_message_templates` for bounded discovery by status, channel, purpose, or locale.
2. Use `get_message_template` before editing a known template. List results omit bodies; detail results include editable SMS or email content while withholding variable defaults and email header values.
3. Never infer that the current draft is the published version. Check `status`, `published_version`, `draft_version`, and `has_unpublished_changes`.

## Create or edit

1. Choose exactly one channel. SMS templates require `sms.message_template`; email templates require `email.subject` and `email.html`. Never mix both content shapes.
2. Declare every variable with a stable lower-case name, type, required flag, and array item schema where applicable. Do not place secrets or credentials in defaults.
3. Use `create_message_template` to create a draft. Use `update_message_template` to create a new draft version; it does not silently replace the published version.
4. Use a stable operation key for exact retries and review the confirmation before each mutation.

## Preview and publish

1. Call `preview_message_template` with representative, non-secret values for every required variable.
2. Review the rendered SMS text or email subject, text, HTML, sender, links, and safety status. Fix missing variables, unsafe output, or channel mismatch before continuing.
3. Call `publish_message_template` only after the merchant approves the preview. Publishing makes that draft available to new Chime sends.

## Send safely

1. Use `send_customer_template` only for one saved customer, an explicit SMS or email transport, a published template, and a consented purpose.
2. The tool renders the template again before confirmation and refuses a template with unpublished changes, a channel mismatch, or unsupported attachments.
3. Confirm the actual rendered copy shown by the tool. Report the returned Chime lifecycle state without repeating hidden recipient contact details.
4. Do not emulate broadcast or scheduling by looping over customers.

## Archive

Use `archive_message_template` only when the template should no longer be updated, published, previewed, or used for new sends. Explain the consequence and reconcile the returned status before calling the action complete.
