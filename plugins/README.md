# Plugins

Installable agent plugins live here. Each plugin must keep host-specific packaging thin and delegate business rules, authorization, and tenant isolation to shared Inttegro services.

Every plugin should include its own README, license metadata, validation instructions, and only the credentials or identifiers that are safe to distribute publicly.

Do not package a client-ID-isolated MCP profile as a generic plugin. Keep the
product activation-gated until the host's reviewed OAuth client is allowlisted
and its exact catalog can be verified. Consumer shopping currently lives under
`products/shop-with-inttegro` for this reason.
