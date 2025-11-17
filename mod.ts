import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path";
import { exists } from "jsr:@std/fs";

interface Config {
  documents: string[];
  output: string;
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

  const workingDir = args.dir;
  const outputFile = args.output;

  // Parse documents glob patterns (can be comma-separated)
  const documentPatterns = args.documents
    .split(",")
    .map((p: string) => p.trim());

  console.log("🚀 Apollo Persisted Query Manifest Generator (Deno Wrapper)");
  console.log(`📁 Working directory: ${workingDir}`);
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`🔍 Document patterns: ${documentPatterns.join(", ")}`);

  // Create config file
  const config: Config = {
    documents: [
      ...documentPatterns,
      "!**/*.d.ts",
      "!**/*.spec.{js,jsx,ts,tsx}",
      "!**/*.story.{js,jsx,ts,tsx}",
      "!**/*.test.{js,jsx,ts,tsx}",
    ],
    output: outputFile,
  };

  const configPath = join(workingDir, "persisted-query-manifest.config.json");

  try {
    // Write config file
    await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Created config file: ${configPath}`);

    // Check if node_modules exists, if not, we need to run npm install
    const nodeModulesPath = join(workingDir, "node_modules");
    const hasNodeModules = await exists(nodeModulesPath);

    if (!hasNodeModules) {
      console.log("📦 Installing @apollo/generate-persisted-query-manifest...");
      const installCmd = new Deno.Command("npm", {
        args: [
          "install",
          "@apollo/generate-persisted-query-manifest",
          "--no-save",
        ],
        cwd: workingDir,
        stdout: "inherit",
        stderr: "inherit",
      });

      const installStatus = await installCmd.output();
      if (!installStatus.success) {
        throw new Error("Failed to install npm package");
      }
    }

    // Run the Apollo generator
    console.log("⚡ Generating persisted query manifest...");
    const cmd = new Deno.Command("npx", {
      args: ["@apollo/generate-persisted-query-manifest"],
      cwd: workingDir,
      stdout: "inherit",
      stderr: "inherit",
    });

    const status = await cmd.output();

    if (status.success) {
      console.log(`✨ Successfully generated manifest: ${outputFile}`);

      // Clean up config file
      await Deno.remove(configPath);
      console.log("🧹 Cleaned up temporary config file");
    } else {
      throw new Error("Failed to generate manifest");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    // Try to clean up config file even on error
    try {
      if (await exists(configPath)) {
        await Deno.remove(configPath);
      }
    } catch {
      // Ignore cleanup errors
    }

    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
