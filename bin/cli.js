#!/usr/bin/env node

import { parseArgs } from "node:util";
import { writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const { values } = parseArgs({
  options: {
    dir: { type: "string", short: "d", default: "." },
    output: {
      type: "string",
      short: "o",
      default: "persisted-query-manifest.json",
    },
    documents: { type: "string", multiple: true },
  },
});

// If no documents specified, use defaults
const documentPatterns =
  values.documents && values.documents.length > 0
    ? values.documents
    : ["src/**/*.{graphql,gql,js,jsx,ts,tsx}"];

const workingDir = resolve(values.dir);
const configPath = resolve(workingDir, "persisted-query-manifest.config.json");

// Default exclusions
const defaultExclusions = [
  "!**/*.d.ts",
  "!**/*.spec.{js,jsx,ts,tsx}",
  "!**/*.story.{js,jsx,ts,tsx}",
  "!**/*.test.{js,jsx,ts,tsx}",
  "!**/node_modules/**",
];

const config = {
  documents: [...values.documents, ...defaultExclusions],
  output: values.output,
};

console.log("🔍 Generating persisted query manifest...");
console.log(`📁 Working directory: ${workingDir}`);
console.log(`📄 Document patterns: ${values.documents.join(", ")}`);
console.log(`💾 Output file: ${values.output}\n`);

try {
  // Write temporary config
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Run the generator
  execSync("npx @apollo/generate-persisted-query-manifest", {
    cwd: workingDir,
    stdio: "inherit",
  });

  console.log(`\n✅ Successfully generated manifest at: ${values.output}`);
} catch (error) {
  console.error("❌ Failed to generate manifest:", error.message);
  process.exit(1);
} finally {
  // Clean up
  try {
    rmSync(configPath);
  } catch {}
}
