import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compile, hash, output, run } from "./setup-build-lib.mjs";

mkdirSync(path.join(output, "tests"), { recursive: true });
const fixture = path.join(output, "tests", "payload-fixture.bin");
writeFileSync(fixture, "NuvoKit test fixture: never executed.\n");
const executable = compile({ testing: true, payload: fixture, applicationHash: hash(fixture) });
run(executable, []);
