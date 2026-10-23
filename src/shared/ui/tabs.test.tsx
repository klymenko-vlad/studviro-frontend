import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test/render';

import { Tabs, TabsList, TabsTrigger } from './tabs';

const LIST_WIDTH = 300;
const TRIGGER_WIDTH = 100;
const KEYS = ['one', 'two', 'three', 'four', 'five', 'six'];

/**
 * jsdom has no layout. Lay the triggers out in a row, 100px each, inside a
 * 300px list, shifted left by the list's `scrollLeft`.
 */
function layOutRow() {
  let scrollLeft = 0;
  vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockImplementation(
    () => scrollLeft,
  );
  vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'set').mockImplementation(value => {
    scrollLeft = value;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const index = KEYS.indexOf(this.dataset['key'] ?? '');
    const left = index === -1 ? 0 : index * TRIGGER_WIDTH - scrollLeft;
    const width = index === -1 ? LIST_WIDTH : TRIGGER_WIDTH;
    return DOMRect.fromRect({ x: left, y: 0, width, height: 36 });
  });
  return { scrollLeft: () => scrollLeft };
}

function renderTabs(props: { defaultValue: string; scrollable?: boolean }) {
  return renderWithProviders(
    <Tabs defaultValue={props.defaultValue}>
      <TabsList scrollable={props.scrollable}>
        {KEYS.map(key => (
          <TabsTrigger key={key} value={key} data-key={key}>
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>,
  );
}

describe('TabsList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls a selected tab that starts off-screen into view', () => {
    const row = layOutRow();

    renderTabs({ defaultValue: 'six', scrollable: true });

    expect(row.scrollLeft()).toBeGreaterThanOrEqual(600 - LIST_WIDTH);
  });

  it('leaves the scroll alone when the selected tab is already visible', () => {
    const row = layOutRow();

    renderTabs({ defaultValue: 'two', scrollable: true });

    expect(row.scrollLeft()).toBe(0);
  });

  it('follows the selection to a tab partly hidden at the edge', async () => {
    const row = layOutRow();
    const { user } = renderTabs({ defaultValue: 'one', scrollable: true });

    await user.click(screen.getByRole('tab', { name: 'three' }));

    expect(screen.getByRole('tab', { name: 'three' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(row.scrollLeft()).toBeGreaterThan(0);
  });

  it('does not scroll a list that is not scrollable', () => {
    const row = layOutRow();

    renderTabs({ defaultValue: 'six' });

    expect(row.scrollLeft()).toBe(0);
  });
});
