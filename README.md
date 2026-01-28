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

#### Environment variables

| Variable             | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `REPORT_OUTPUT_ROOT` | `false`  | -       | Defines the root directory where the reporter is allowed to write output files. All generated report files **must resolve inside this directory**. If not set, the current working directory (`process.cwd()`) is used. The reporter prevents writing files outside of this directory to avoid accidental or unsafe filesystem access (e.g. path traversal). This is mainly intended for CI environments where test artifacts are written outside of the project checkout directory. |

### 3. Run Tests

```bash
npx vitest run
```

The markdown report will be generated at the configured path (`outputFile`).

## Example Output

```md
# Vitest Test Report

## Test Run Summary

| ℹ️ Status | 🕒 Start Time          | 🕓 End Time            | ⌛ Duration |
| --------- | ---------------------- | ---------------------- | ----------: |
| ❌ failed | 26/01/2026 at 20:03:53 | 26/01/2026 at 20:03:53 |       300ms |

|            | ✅ Passed | ❌ Failed | ⏭️ Skipped | #️⃣ Total |
| ---------- | --------: | --------: | ---------: | -------: |
| Test Files |         0 |         1 |          0 |        1 |
| Tests      |         1 |         1 |          0 |        2 |

## Test Results

### Project: Renderer

| ✅ Passed | ❌ Failed | ⏭️ Skipped | #️⃣ Total | ⌛ Duration |
| --------: | --------: | ---------: | -------: | ----------: |
|         1 |         1 |          0 |        2 |       300ms |

#### ✅ test/renderer/MarkdownRenderer.test.ts

1 passed, 1 failed, 0 skipped, 2 total, done in 300ms

- ✅ renders title heading _100ms_
- 🗂️ rendering test run summary
  - ❌ renders test run summary heading _200ms_
```

## License

[MIT © Robert Kłódka](LICENSE)
