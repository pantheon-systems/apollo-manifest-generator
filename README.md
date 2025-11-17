# @pantheon-systems/apollo-manifest-generator

Wrapper for Apollo persisted query manifest generation.

## Installation

Install globally:

```bash
npm install -g @pantheon-systems/apollo-manifest-generator
```

Or use with npx (no install needed):

```bash
npx @pantheon-systems/apollo-manifest-generator
```

## Usage

Basic:

```bash
generate-apollo-manifest
```

With options:

```bash
generate-apollo-manifest --dir=./apps/web --output=trusted-documents.json
```

Custom document patterns:

```bash
generate-apollo-manifest \
  --documents="src/**/*.graphql" \
  --documents="lib/**/*.ts"
```

## Options

- `--dir, -d`: Working directory (default: `.`)
- `--output, -o`: Output file path (default: `persisted-query-manifest.json`)
- `--documents`: Glob patterns for GraphQL documents (can specify multiple times)

## Development

Clone and test locally:

```bash
git clone https://github.com/pantheon-systems/apollo-manifest-generator.git
cd apollo-manifest-generator
npm link
generate-apollo-manifest --help
```
