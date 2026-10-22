# Contributing to NuvoKit

NuvoKit has an internal Windows core prototype. Start with the [product brief](docs/product.md),
[roadmap](docs/roadmap.md), and [decision log](docs/decisions/README.md).

## Useful contributions now

- A reproducible workflow and the problem it solves.
- Source-backed research about a related product or plugin model.
- A small documentation improvement or correction.
- A design proposal that covers normal, empty, loading, and error states.

Describe the problem, expected result, scope, and evidence. Distinguish a proposal
from an approved decision. Discuss changes to the product scope, stack, SDK contract,
or license before treating them as settled.

## Workflow

1. Read [AGENTS.md](AGENTS.md) and the relevant planning documents.
2. Make a focused change and update affected links/documents.
3. Validate what changed. For docs: check links, formatting, and factual accuracy.
4. Review the diff and ensure no private data or generated artifacts are included.
5. Explain the change and actual validation in the pull request or handoff.

Use the commands in [development](docs/development.md) and check the
[Core v1 specification](docs/specs/core-v1.md) when changing behavior.
Full app QA is unnecessary for low-risk documentation edits.

## Publication and licensing

The public source repository is [nguyen-hung-dev/nuvokit](https://github.com/nguyen-hung-dev/nuvokit).
Contribution terms and the project license remain undecided; resolve them before
accepting public code contributions. Keep commits limited to project source,
documentation, configuration, lockfiles, and intentional design assets. Do not
upload private notes, credentials, local application data, hardware inventories,
build output, dependencies, or QA captures. See [publication decision](docs/decisions/0004-public-source-repository.md).
