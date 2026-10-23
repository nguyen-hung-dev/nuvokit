# Update channels

`preview.json` and `stable.json` are generated channel pointers. The release
publisher writes them only after all signed assets are published successfully.
Do not add placeholder URLs, unsigned signatures or binary installers here.

A channel without a published release has no JSON file yet. The app displays
that condition and continues working. See [updates v1](../docs/specs/updates-v1.md).
