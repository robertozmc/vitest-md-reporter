import { FormattedText, MarkdownDocument, md } from 'build-md';
import {
  MetaData,
  Project,
  ReporterData,
  Suite,
  Summary,
  Test,
  TestModuleData,
} from './types';
import { TestModuleState, TestRunEndReason } from 'vitest/node';
import { formatDateTime, formatDuration } from './helpers';

const STATE_ICON: Partial<Record<TestModuleState | TestRunEndReason, string>> =
  {
    passed: '✅',
    failed: '❌',
    skipped: '⏭️',
  };

export class MarkdownRenderer {
  render(data: ReporterData) {
    return new MarkdownDocument()
      .$concat(
        this.renderTitle(data.title),
        this.renderTestRunSummary(data),
        this.renderTestResults(data)
      )
      .toString();
  }

  private renderTitle(title: string): MarkdownDocument {
    return new MarkdownDocument().heading(1, title);
  }

  private renderTestRunSummary(data: ReporterData): MarkdownDocument {
    return new MarkdownDocument()
      .heading(2, 'Test Run Summary')
      .$concat(
        this.renderTestRunMetaTable(data.meta),
        this.renderTestRunSummaryTable(data.summary)
      );
  }

  private renderTestRunMetaTable(meta: MetaData): MarkdownDocument {
    return new MarkdownDocument().table(
      [
        'ℹ️ Status',
        '🕒 Start Time',
        '🕓 End Time',
        { heading: '⌛ Duration', alignment: 'right' },
      ],
      [
        [
          `${STATE_ICON[meta.state]} ${meta.state}`,
          `${formatDateTime(meta.startTime)}`,
          `${formatDateTime(meta.endTime)}`,
          `${formatDuration(meta.duration)}`,
        ],
      ]
    );
  }

  private renderTestRunSummaryTable(summary: Summary): MarkdownDocument {
    return new MarkdownDocument().table(
      [
        '',
        { heading: '✅ Passed', alignment: 'right' },
        { heading: '❌ Failed', alignment: 'right' },
        { heading: '⏭️ Skipped', alignment: 'right' },
        { heading: '#️⃣ Total', alignment: 'right' },
      ],
      [
        [
          'Test Files',
          `${summary.testFiles.passed}`,
          `${summary.testFiles.failed}`,
          `${summary.testFiles.skipped}`,
          `${summary.testFiles.total}`,
        ],
        [
          'Tests',
          `${summary.tests.passed}`,
          `${summary.tests.failed}`,
          `${summary.tests.skipped}`,
          `${summary.tests.total}`,
        ],
      ]
    );
  }

  private renderProjectSummaryTable(project: Project): MarkdownDocument {
    return new MarkdownDocument().table(
      [
        { heading: '✅ Passed', alignment: 'right' },
        { heading: '❌ Failed', alignment: 'right' },
        { heading: '⏭️ Skipped', alignment: 'right' },
        { heading: '#️⃣ Total', alignment: 'right' },
        { heading: '⌛ Duration', alignment: 'right' },
      ],
      [
        [
          `${project.summary.passed}`,
          `${project.summary.failed}`,
          `${project.summary.skipped}`,
          `${project.summary.total}`,
          `${formatDuration(project.meta.duration)}`,
        ],
      ]
    );
  }

  private renderTestResults(data: ReporterData): MarkdownDocument {
    return new MarkdownDocument()
      .heading(2, 'Test Results')
      .$foreach(data.projects, (markdownDocument, project) =>
        markdownDocument.$concat(this.renderProject(project, data.projectLabel))
      );
  }

  private renderProject(
    project: Project,
    projectLabel: string
  ): MarkdownDocument {
    return new MarkdownDocument()
      .heading(3, `${projectLabel}: ${project.name}`)
      .$concat(
        this.renderProjectSummaryTable(project),
        new MarkdownDocument().$foreach(
          project.testModules,
          (markdownDocument, testModule) =>
            markdownDocument.$concat(this.renderTestModule(testModule))
        )
      );
  }

  private renderTestModule(testModule: TestModuleData): MarkdownDocument {
    return new MarkdownDocument()
      .heading(4, `${STATE_ICON[testModule.meta.state]} ${testModule.name}`)
      .paragraph(
        `${testModule.summary.passed} passed, ${
          testModule.summary.failed
        } failed, ${testModule.summary.skipped} skipped, ${
          testModule.summary.total
        } total done in ${formatDuration(testModule.meta.duration)}`
      )
      .list([
        ...testModule.tests.map((test) => this.renderTest(test)),
        ...testModule.suites.map((suite) => this.renderSuite(suite)),
      ]);
  }

  private renderSuite(suite: Suite): FormattedText {
    return md`🗂️ ${suite.name} ${md.list([
      ...suite.tests.map((test) => this.renderTest(test)),
      ...suite.suites.map((suite) => this.renderSuite(suite)),
    ])}`;
  }

  private renderTest(test: Test): FormattedText {
    return md`${STATE_ICON[test.state]} ${test.name}  ${md.italic(
      formatDuration(test.duration)
    )}`;
  }
}
