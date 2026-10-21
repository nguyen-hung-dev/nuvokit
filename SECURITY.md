# Security

NuvoKit currently contains planning documents; no application, SDK, or service is
released. There are no supported application versions yet.

## Reporting

Do not put credentials, private user records, or sensitive exploit details in a
public issue. Before public release, the maintainer must configure and document a
private reporting channel and a supported-version policy. No private reporting
channel is configured in this local repository yet.

## Planned boundaries

The [architecture](docs/architecture.md) and [plugin model](docs/plugins.md) propose
scoped data access, guest isolation, explicit network/file permissions, reviewable
agent writes, and local backup/export. These are design requirements, not implemented
or audited security guarantees.
