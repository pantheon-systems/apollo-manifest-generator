# Apollo Persisted Query Manifest Generator (Deno Wrapper)

A Deno wrapper for `@apollo/generate-persisted-query-manifest` that allows you to generate trusted documents for GraphQL.

## Features

- 🦕 Pure Deno implementation - no local npm install required in your projects
- 🚀 Simple CLI interface
- 🔧 Customizable document patterns and output paths
- 🧹 Automatic cleanup of temporary config files
- ✨ Works across all repositories

## Usage

### Basic Usage

```bash
deno run -A https://raw.githubusercontent.com/pantheon-systems/apollo-manifest-generator/main/mod.ts
```

This will:

- Look for GraphQL operations in `src/**/*.{graphql,gql,js,jsx,ts,tsx}`
- Generate `persisted-query-manifest.json` in the current directory

### Custom Directory and Output

```bash
deno run -A https://raw.githubusercontent.com/pantheon-systems/apollo-manifest-generator/main/mod.ts \
  --dir=./my-app \
  --output=trusted-documents.json
```

### Custom Document Patterns

```bash
deno run -A https://raw.githubusercontent.com/pantheon-systems/apollo-manifest-generator/main/mod.ts \
  --documents="app/**/*.graphql,queries/**/*.ts"
```

### All Options

```bash
deno run -A https://raw.githubusercontent.com/pantheon-systems/apollo-manifest-generator/main/mod.ts \
  --dir=./packages/frontend \
  --output=custom-manifest.json \
  --documents="src/**/*.{graphql,ts},lib/**/*.gql"
```

## Options

- `--dir, -d`: Working directory (default: `.`)
- `--output, -o`: Output file name (default: `persisted-query-manifest.json`)
- `--documents`: Comma-separated glob patterns for document discovery (default: `src/**/*.{graphql,gql,js,jsx,ts,tsx}`)

## Requirements

- Deno 1.37 or higher
- Node.js and npm (must be available in PATH for npx)

## How It Works

1. Creates a temporary `persisted-query-manifest.config.json` in your target directory
2. Installs `@apollo/generate-persisted-query-manifest` if needed (via npm)
3. Runs the Apollo generator using npx
4. Cleans up the temporary config file
5. Leaves you with your generated manifest file

## Project Structure

```
.
├── mod.ts           # Main entry point
├── deno.json        # Deno configuration
└── README.md        # Documentation
```
