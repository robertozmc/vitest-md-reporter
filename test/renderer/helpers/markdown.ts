import dedent from 'dedent';
import type { Heading, Table, TableCell, TableRow, Text } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { gfmTable } from 'micromark-extension-gfm-table';

export const parseMarkdown = (markdown: string) => {
  return fromMarkdown(dedent(markdown), {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown()],
  });
};

export const expectHeading = (node: unknown): Heading => {
  return expectType<Heading>(node, 'heading');
};

export const expectTable = (node: unknown): Table => {
  return expectType<Table>(node, 'table');
};

export const expectTableRow = (node: unknown): TableRow => {
  return expectType<TableRow>(node, 'tableRow');
};

export const expectTableCell = (node: unknown): TableCell => {
  return expectType<TableCell>(node, 'tableCell');
};

export const expectText = (node: unknown): Text => {
  return expectType<Text>(node, 'text');
};

const expectType = <T>(node: unknown, type: string): T => {
  if (
    typeof node === 'object' &&
    node !== null &&
    (node as any).type === type
  ) {
    return node as T;
  }

  throw new Error(`Expected a ${type} node`);
};
