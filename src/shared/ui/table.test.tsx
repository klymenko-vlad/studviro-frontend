import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen, within } from '@/shared/test/render';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

function renderScores() {
  return renderWithProviders(
    <Table label="Scores">
      <TableHeader>
        <TableRow>
          <TableHead>Assessment</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Essay</TableCell>
          <TableCell label="Score">94</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

describe('Table', () => {
  it('names its region and caption after the label', () => {
    renderScores();

    expect(screen.getByRole('region', { name: 'Scores' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Scores' })).toBeInTheDocument();
  });

  it('keeps table semantics when a narrow container stacks its rows', () => {
    renderScores();

    const table = screen.getByRole('table', { name: 'Scores' });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(table).getAllByRole('cell')).toHaveLength(2);
  });

  it('carries a cell’s column name for the stacked layout to show', () => {
    renderScores();

    expect(screen.getByRole('cell', { name: '94' })).toHaveAttribute(
      'data-label',
      'Score',
    );
  });

  it('marks a wide cell so the stacked layout gives it a full line', () => {
    renderWithProviders(
      <Table label="Marks">
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
            <TableCell label="Mark" wide>
              form
            </TableCell>
            <TableCell label="Files">none</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('cell', { name: 'form' })).toHaveAttribute('data-wide');
    expect(screen.getByRole('cell', { name: 'none' })).not.toHaveAttribute('data-wide');
  });

  it('leaves a cell without a column name as the row’s title', () => {
    renderScores();

    expect(screen.getByRole('cell', { name: 'Essay' })).not.toHaveAttribute('data-label');
  });
});
