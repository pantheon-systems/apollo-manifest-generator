// deno/cli.ts
// Deno CLI to generate Apollo persisted query manifest by calling the Apollo generator via npx.
//
// Usage examples (recommended):
//  deno run --allow-read --allow-write --allow-run --allow-env https://raw.githubusercontent.com/<org>/<repo>/v1.0.0/deno/cli.ts --dir=. --output=persisted-query-manifest.json
//
// For private repos, see README notes about auth (DENO_AUTH_TOKENS or .netrc).

import { parse } from "https://deno.land/std@0.205.0/flags/mod.ts";
import { join, resolve } from "https://deno.land/std@0.205.0/path/mod.ts";

const USAGE = `
deno run --allow-read --allow-write --allow-run --allow-env <url-or-file> --dir=. --output=manifest.json [--documents "pattern1" --documents "pattern2"]

Permissions required:
  --allow-read   (optional) to read existing files if needed
  --allow-write  to write temporary config and the output file
  --allow-run    to execute npx/node
  --allow-env    if you want to pass tokens via env
`;

// Parse args
const argv = parse(Deno.args, {
  string: ["dir", "output", "documents"],
  alias: { d: "dir", o: "output" },
  default: { dir: ".", output: "persisted-query-manifest.json" },
  collect: ["documents"], // allow multiple --documents flags
});

if (argv.help) {
  console.log(USAGE);
  Deno.exit(0);
}

const workingDir = resolve(String(argv.dir ?? "."));
const output = String(argv.output ?? "persisted-query-manifest.json");

// document patterns: either provided or default
const defaultDocumentPatterns = ["src/**/*.{graphql,gql,js,jsx,ts,tsx}"];
const documents: string[] =
  Array.isArray(argv.documents) && argv.documents.length > 0
    ? (argv.documents as string[])
    : defaultDocumentPatterns;

const defaultExclusions = [
  "!**/*.d.ts",
  "!**/*.spec.{js,jsx,ts,tsx}",
  "!**/*.story.{js,jsx,ts,tsx}",
  "!**/*.test.{js,jsx,ts,tsx}",
  "!**/node_modules/**",
];

const config = {
  documents: [...documents, ...defaultExclusions],
  output,
};

console.log("🔍 Generating persisted query manifest (Deno runner)");
console.log(`📁 Working directory: ${workingDir}`);
console.log(`📄 Document patterns: ${documents.join(", ")}`);
console.log(`💾 Output file: ${output}\n`);

// helper: check if command exists (simple)
async function commandExists(cmd: string): Promise<boolean> {
  try {
    const p = Deno.run({
      cmd: ["sh", "-c", `command -v ${cmd}`],
      stdout: "null",
      stderr: "null",
    });
    const status = await p.status();
    p.close();
    return status.success;
  } catch {
    return false;
  }
}

// Ensure node/npx availability
const hasNode = await commandExists("node");
const hasNpx = await commandExists("npx");

if (!hasNode || !hasNpx) {
  console.error(
    "❌ node and/or npx not found on PATH. This Deno runner shells out to `npx` which requires node."
  );
  console.error(
    "Install Node.js (which includes npm/npx) or run the original Node-based CLI."
  );
  Deno.exit(2);
}

// Write temporary config file
const configPath = join(workingDir, "persisted-query-manifest.config.json");
try {
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
  console.log(`Wrote temporary config to: ${configPath}`);
} catch (err) {
  console.error("❌ Failed to write config file:", err.message ?? err);
  Deno.exit(1);
}

// Run the generator via npx
// We intentionally use 'npx --yes' so it installs if needed without prompts.
const cmd = ["npx", "--yes", "@apollo/generate-persisted-query-manifest"];
console.log(`Running: ${cmd.join(" ")}`);

const runProc = Deno.run({
  cmd,
  cwd: workingDir,
  stdin: "null",
  stdout: "inherit",
  stderr: "inherit",
});

// Wait for completion
const status = await runProc.status();
runProc.close();

// Cleanup
try {
  await Deno.remove(configPath);
  // Note: generator itself will write the output file (per its config.output)
} catch {
  // ignore cleanup errors
}

if (status.success) {
  console.log(`\n✅ Successfully generated manifest at: ${output}`);
  Deno.exit(0);
} else {
  console.error("\n❌ Generator failed. See above logs for details.");
  Deno.exit(status.code ?? 1);
}
