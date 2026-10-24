import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Markdown } from './markdown';

const show = (source: string) => render(<Markdown source={source} />).container;

describe('Markdown', () => {
  it('turns headings into headings one level below the page title', () => {
    show('# Week 1\n\n## Reading\n\n###### Deep');

    expect(screen.getByRole('heading', { level: 2, name: 'Week 1' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Reading' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 6, name: 'Deep' })).toBeInTheDocument();
  });

  it('joins the lines of a paragraph and separates paragraphs at a blank line', () => {
    const container = show('One line\nand the next.\n\nA second paragraph.');

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent('One line and the next.');
  });

  it('renders bulleted and numbered lists, keeping where a numbered one starts', () => {
    const container = show('- one\n* two\n+ three\n\n3. third\n4. fourth');

    const [bullets, numbers] = screen.getAllByRole('list');
    expect(bullets!.tagName).toBe('UL');
    expect(bullets!.querySelectorAll('li')).toHaveLength(3);
    expect(numbers!.tagName).toBe('OL');
    expect(numbers).toHaveAttribute('start', '3');
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
  });

  it('renders strong, emphasis and inline code', () => {
    const container = show('Read **chapter 4**, *slowly*, then run `sort(xs)`.');

    expect(container.querySelector('strong')).toHaveTextContent('chapter 4');
    expect(container.querySelector('em')).toHaveTextContent('slowly');
    expect(container.querySelector('code')).toHaveTextContent('sort(xs)');
  });

  it('keeps markup inside inline code as text', () => {
    const container = show('Write `**not bold**` literally.');

    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('code')).toHaveTextContent('**not bold**');
  });

  it('renders a fenced code block as preformatted text, untouched', () => {
    const container = show('```\nfor i in 1..n:\n  **swap**\n```');

    const block = container.querySelector('pre code');
    expect(block?.textContent).toBe('for i in 1..n:\n  **swap**');
    expect(container.querySelector('strong')).toBeNull();
  });

  it('renders a quote and a rule', () => {
    const container = show('> Ask in the discussion.\n\n---');

    expect(container.querySelector('blockquote')).toHaveTextContent(
      'Ask in the discussion.',
    );
    expect(container.querySelector('hr')).not.toBeNull();
  });

  it('links to web and mail addresses, opening the web in a new tab', () => {
    show('See [the handbook](https://example.edu/h) or [mail us](mailto:a@b.org).');

    const web = screen.getByRole('link', { name: 'the handbook' });
    expect(web).toHaveAttribute('href', 'https://example.edu/h');
    expect(web).toHaveAttribute('rel', 'noopener noreferrer');
    expect(web).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'mail us' })).toHaveAttribute(
      'href',
      'mailto:a@b.org',
    );
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:x',
    '/relative',
  ])('refuses to link to %s and keeps only the text', href => {
    show(`[click](${href})`);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('click')).toBeInTheDocument();
  });

  it('never turns raw HTML into elements', () => {
    const container = show('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('<script>alert(1)</script>');
  });

  it('lets a backslash keep a marker literal', () => {
    const container = show('2 \\* 3 \\* 4');

    expect(container.querySelector('em')).toBeNull();
    expect(container).toHaveTextContent('2 * 3 * 4');
  });

  it('leaves an unclosed marker as it was typed', () => {
    const container = show('a **b and [c](');

    expect(container).toHaveTextContent('a **b and [c](');
  });

  it('renders nothing for an empty page', () => {
    expect(show('   \n\n').textContent).toBe('');
  });
});
