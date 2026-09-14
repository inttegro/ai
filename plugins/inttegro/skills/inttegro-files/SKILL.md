---
metadata:
  internal: true
name: inttegro-files
description: Upload, inspect, share, revoke, and delete Inttegro files safely. Use when a merchant asks to attach or store a file, inspect file processing or scan status, create or revoke a customer-facing file link, or remove a file. Do not use to expose authenticated file bytes, disclose capability URLs from read results, or upload content the user did not select.
---

# Inttegro files

Keep private file storage separate from deliberate public sharing.

## Inspect

1. Use `list_files` for bounded discovery and `get_file` for authoritative status, scan state, media facts, size, and timestamps.
2. Use `list_file_links` or `get_file_link` to inspect link lifecycle and access counts. These read tools intentionally do not return bearer capability URLs.
3. Do not infer that processing or scanning succeeded until the returned state says so.

## Upload

1. The user must select or attach the file through the host. Never choose unrelated workspace or device files.
2. Read the selected bytes without pasting them into conversation, encode canonical base64, and call `upload_file` with the exact filename, MIME type, purpose, and a stable operation key.
3. The decoded-content limit is 5 MiB. If the file is larger, stop and direct the user to an Inttegro/API upload flow rather than splitting, truncating, or silently recompressing it.
4. Confirm the displayed filename, MIME type, byte size, and purpose. Report the returned file ID and processing state; do not echo base64 or custom data.

## Share intentionally

1. Verify the file is available with `get_file`.
2. Collect the expiry, optional maximum access count, download policy, and delivery mode. Do not invent them.
3. Call `create_file_link` with a stable operation key only after the public-capability warning is accepted.
4. Treat the returned URL as a bearer secret. Give it only to the intended recipient and do not put it in logs, analytics, notes, or unrelated messages.
5. Use the link ID, not a remembered URL, for later status checks or `revoke_file_link`.

## Delete or revoke

- Prefer `revoke_file_link` when the goal is only to stop sharing.
- Use `delete_file` only when the underlying file itself should be tombstoned and possibly removed. Explain that separate references or policy may affect cleanup.
- Both actions require exact confirmation and stable operation keys. Reconcile the returned lifecycle state before calling the action complete.
