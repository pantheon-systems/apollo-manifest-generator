#!/usr/bin/env -S deno run -A

import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path";

interface Config {
  documents: string[];
  output: string;
}

async function generateManifest(config: Config, workingDir: string) {
  // Create temporary config file
  const configPath = join(workingDir, "persisted-query-manifest.config.json");
  const configContent = JSON.stringify(config, null, 2);

  await Deno.writeTextFile(configPath, configContent);

  try {
    // Run the Apollo package via npx
    const command = new Deno.Command("npx", {
      args: ["--yes", "@apollo/generate-persisted-query-manifest"],
      cwd: workingDir,
      stdout: "piped",
      stderr: "piped",
    });

    const process = command.spawn();
    const { code, stdout, stderr } = await process.output();

    const decoder = new TextDecoder();
    const stdoutText = decoder.decode(stdout);
    const stderrText = decoder.decode(stderr);

    if (code !== 0) {
      console.error("Error generating manifest:");
      console.error(stderrText);
      throw new Error(`Process exited with code ${code}`);
    }

    if (stdoutText) {
      console.log(stdoutText);
    }

    console.log(`✅ Successfully generated manifest at: ${config.output}`);
  } finally {
    // Clean up temporary config file
    try {
      await Deno.remove(configPath);
    } catch {
      // Ignore errors during cleanup
    }
  }
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["dir", "output", "documents"],
    default: {
      dir: ".",
      output: "persisted-query-manifest.json",
      documents: "src/**/*.{graphql,gql,js,jsx,ts,tsx}",
    },
    alias: {
      d: "dir",
      o: "output",
    },
  });

  // Parse documents argument (can be comma-separated or multiple --documents flags)
  let documentPatterns: string[];
  if (Array.isArray(args.documents)) {
    documentPatterns = args.documents;
  } else {
    documentPatterns = args.documents.split(",").map((s) => s.trim());
  }

  // Add default exclusions
  const defaultExclusions = [
    "!**/*.d.ts",
    "!**/*.spec.{js,jsx,ts,tsx}",
    "!**/*.story.{js,jsx,ts,tsx}",
    "!**/*.test.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
  ];

  const config: Config = {
    documents: [...documentPatterns, ...defaultExclusions],
    output: args.output,
  };

  const workingDir = Deno.realPathSync(args.dir);

  console.log("🔍 Generating persisted query manifest...");
  console.log(`📁 Working directory: ${workingDir}`);
  console.log(`📄 Document patterns: ${documentPatterns.join(", ")}`);
  console.log(`💾 Output file: ${args.output}\n`);

  await generateManifest(config, workingDir);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error("❌ Failed to generate manifest:", error.message);
    Deno.exit(1);
  }
}
