# vitest-md-reporter

[![npm version](https://img.shields.io/npm/v/vitest-md-reporter?color=blue&label=npm)](https://www.npmjs.com/package/vitest-md-reporter)
[![License](https://img.shields.io/npm/l/vitest-md-reporter)](LICENSE)

**A lightweight Vitest reporter that generates Markdown test reports.**
Group your tests by project and file, see passed/failed/skipped tests - all in a neat Markdown file.

## Features

- ✅ Generates Markdown reports from Vitest test runs
- 📁 Groups tests by project and file
- ⏱️ Shows metadata like start and end time or total duration of the test run
- ⚡ Simple setup, fully ESM and TypeScript ready

## Quick Start

### 1. Install

```bash
npm i -D vitest-md-reporter
```

> Peer dependency: Vitest should already be installed in your project. If it is not, you probably do not need this package.

### 2. Configure Vitest

#### Configuration options

| Option          | Required | Default              | Description                                                                                                                                                                                                                    |
| --------------- | -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `outputFile`    | `false`  | `vitest-report.md`   | Path and filename for the generated Markdown report. Can be relative to the project root or an absolute path, but the file must remain within the project root. Attempts to save outside the project root will throw an error. |
| `projectLabel`  | `false`  | `Project`            | Label used as the section name for grouping test results by project. Useful when working with multiple Vitest projects                                                                                                         |
| `projectsOrder` | `false`  | -                    | Explicit order in which projects should appear in the report. Projects not listed will be appended after the specified ones, preserving vitest order                                                                           |
| `title`         | `false`  | `Vitest Test Report` | Title displayed at the top of the report. Can be customized to match codebase or CI context                                                                                                                                    |

#### Example

```typescript
// {vite,vitest}.config.{js,ts}
import { defineConfig } from 'vitest/config';
import { MarkdownReporter } from 'vitest-md-reporter';

export default defineConfig({
  test: {
    reporters: [
      'default',
      new MarkdownReporter({
        outputFile: './test-results/report.md',
        projectLabel: 'Test Level',
        projectsOrder: ['Unit', 'Integration'],
        title: 'Test Summary - MyApp',
      }),
    ],
  },
});
```

### 3. Run Tests

```bash
npx vitest run
```

The markdown report will be generated at the configured path (`outputFile`).

## Example Output

```md
TBD
```

## License

[MIT © Robert Kłódka](LICENSE)
