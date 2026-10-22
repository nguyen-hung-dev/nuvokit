# Security

NuvoKit contains an experimental Windows core and planning documents. No
application, SDK, or service has been released; there are no supported application
versions yet.

## Reporting

Do not put credentials, private user records, or sensitive exploit details in a
public issue. Before public release, the maintainer must configure and document a
private reporting channel and a supported-version policy. No private reporting
channel is configured for this repository yet.

## Planned boundaries

The [architecture](docs/architecture.md) and [plugin model](docs/plugins.md) propose
scoped data access, guest isolation, explicit network/file permissions, reviewable
agent writes, and local backup/export. These are design requirements, not implemented
or audited security guarantees.
