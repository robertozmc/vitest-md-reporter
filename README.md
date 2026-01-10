# vitest-md-reporter

[![npm version](https://img.shields.io/npm/v/vitest-md-reporter?color=blue&label=npm)](https://www.npmjs.com/package/vitest-md-reporter)
[![License](https://img.shields.io/npm/l/vitest-md-reporter)](LICENSE)

**A lightweight Vitest reporter that generates Markdown test reports.**
Group your tests by project and file, see passed/failed/skipped tests, and include error stacks — all in a neat Markdown file.

## Features

- ✅ Generates Markdown reports from Vitest test runs
- 📁 Groups tests by project and file
- ⚠️ Includes error stacks in fenced code blocks
- ⏱️ Shows total duration of the test run
- ⚡ Simple setup, fully ESM and TypeScript ready
- 🖊 Respects `vitest.config.outputFile.md` automatically

## Quick Start

### 1. Install

```bash
npm i -D vitest-md-reporter
```

> Peer dependency: Vitest should already be installed in your project.

### 2. Configure Vitest

`{vite,vitest}.config.{js,ts}`

```typescript
import { defineConfig } from 'vitest/config';
import { MarkdownReporter } from 'vitest-md-reporter';

export default defineConfig({
  test: {
    reporters: ['default', new MarkdownReporter()],
    outputFile: {
      md: './test-results/report.md', // optional, defaults to vitest-report.md
    },
  },
});
```

### 3. Run Tests

```bash
npx vitest run
```

The Markdown report will be generated at the configured path (default: `vitest-report.md`).

## Example Output

````md
# Vitest Test Report

**Total duration:** 1023 ms

---

## Project: unit

### test/foo.test.ts

- ✅ **should pass this test**
- ❌ **should fail gracefully**

```text
Error: expected true to be false
    at Object.<anonymous> (test/foo.test.ts:10:15)
```

### test/bar.test.ts

- ✅ passes correctly
- ⏭️ skipped test
````

## License

MIT © Robert Kłódka
