/**
 * Configuration options for the `MarkdownReporter`.
 *
 * Allows customizing the report output file, project labeling, project
 * ordering, and the report title.
 */
export interface MarkdownReporterOptions {
  /**
   * The file path where the markdown report will be written.
   * @default "vitest-report.md"
   */
  outputFile?: string;
  /**
   * Label to use when displaying project names in the report.
   * @default "Project"
   */
  projectLabel?: string;
  /**
   * Optional array defining the order of projects in the report.
   * Projects not listed will appear after the specified ones in their
   * natural order.
   */
  projectsOrder?: string[];
  /**
   * The title of the markdown report.
   * @default "Vitest Test Report"
   */
  title?: string;
}

/**
 * Represents a mapping from project name to a numeric order.
 *
 * Used internally to sort projects according to the user's
 * specified `projectsOrder`.
 */
export type ProjectsOrder = Map<string, number>;
