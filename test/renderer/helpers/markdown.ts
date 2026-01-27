import dedent from 'dedent';
import type {
  Emphasis,
  Heading,
  List,
  ListItem,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  Text,
} from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { gfmTable } from 'micromark-extension-gfm-table';

export const parseMarkdown = (markdown: string) => {
  return fromMarkdown(dedent(markdown), {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown()],
  });
};

export const expectEmphasis = (node: unknown): Emphasis => {
  return expectType<Emphasis>(node, 'emphasis');
};

export const expectHeading = (node: unknown): Heading => {
  return expectType<Heading>(node, 'heading');
};

export const expectList = (node: unknown): List => {
  return expectType<List>(node, 'list');
};

export const expectListItem = (node: unknown): ListItem => {
  return expectType<ListItem>(node, 'listItem');
};

export const expectParagraph = (node: unknown): Paragraph => {
  return expectType<Paragraph>(node, 'paragraph');
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

export const tableRowText = (row: TableRow) => {
  return row.children
    .map(expectTableCell)
    .map((cell) =>
      cell.children.length > 0 ? expectText(cell.children[0]).value : '',
    );
};

const expectType = <T>(node: unknown, type: string): T => {
  if (
    typeof node === 'object' &&
    node !== null &&
    (node as any).type === type
  ) {
    return node as T;
  }

  throw new Error(`Expected a ${type} node, but found ${(node as any).type}`);
};
