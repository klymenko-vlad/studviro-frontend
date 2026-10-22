import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { revealTargetClassName, useRevealHashTarget } from './use-reveal-hash-target';

function List({ ready }: { ready: boolean }) {
  useRevealHashTarget(ready);
  if (!ready) return <p>Loading</p>;
  return (
    <ul>
      <li id="activity-1" tabIndex={-1} className={revealTargetClassName}>
        First
      </li>
      <li id="activity-2" tabIndex={-1} className={revealTargetClassName}>
        Second
      </li>
    </ul>
  );
}

describe('useRevealHashTarget', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    scrollIntoView.mockReset();
  });

  it('waits for the list, then scrolls to and focuses the item the address names', () => {
    window.history.replaceState(null, '', '/courses/1?section=materials#activity-2');

    const { rerender, getByText } = render(<List ready={false} />);
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(<List ready />);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(getByText('Second')).toHaveFocus();
  });

  it('does nothing when the address names no item', () => {
    window.history.replaceState(null, '', '/courses/1?section=materials');
    render(<List ready />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.body).toHaveFocus();
  });

  it('does nothing when the named item is not on the page', () => {
    window.history.replaceState(null, '', '/courses/1#activity-gone');
    render(<List ready />);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  describe('while the page above the item is still loading', () => {
    let grow: () => void = () => undefined;
    const original = globalThis.ResizeObserver;

    beforeEach(() => {
      globalThis.ResizeObserver = class {
        constructor(callback: () => void) {
          grow = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {
          grow = () => undefined;
        }
      } as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      globalThis.ResizeObserver = original;
      vi.useRealTimers();
    });

    it('keeps the item in view as the page grows', () => {
      window.history.replaceState(null, '', '/courses/1#activity-2');
      render(<List ready />);

      grow();

      expect(scrollIntoView).toHaveBeenCalledTimes(2);
    });

    it('lets go once the reader scrolls', () => {
      window.history.replaceState(null, '', '/courses/1#activity-2');
      render(<List ready />);

      window.dispatchEvent(new Event('wheel'));
      grow();

      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('lets go once the page has settled', () => {
      vi.useFakeTimers();
      window.history.replaceState(null, '', '/courses/1#activity-2');
      render(<List ready />);

      vi.advanceTimersByTime(2000);
      grow();

      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
  });

  it('does not reveal again when the list re-renders', () => {
    window.history.replaceState(null, '', '/courses/1#activity-1');
    const { rerender } = render(<List ready />);
    rerender(<List ready />);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
