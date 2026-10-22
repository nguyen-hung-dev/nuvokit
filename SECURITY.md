# Security

NuvoKit 0.1.1 is an experimental Windows preview. The current preview receives
best-effort fixes; there is no stable supported release or public SDK yet.

## Reporting

Do not put credentials, private user records, or sensitive exploit details in a
public issue. Use [private vulnerability reporting](https://github.com/nguyen-hung-dev/nuvokit/security/advisories/new).
GitHub private vulnerability reporting is enabled for this repository. Include the
affected version and a synthetic reproduction; omit personal records and secrets.

## Planned boundaries

The [architecture](docs/architecture.md) and [plugin model](docs/plugins.md) propose
scoped data access, guest isolation, explicit network/file permissions, reviewable
agent writes, and local backup/export. These are design requirements, not implemented
or audited security guarantees.
