import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test/render';

import { Choice } from './choice';

describe('Choice', () => {
  it('is a radio button named by its label, picked by clicking the label', async () => {
    const { user } = renderWithProviders(
      <fieldset>
        <legend>Pick one</legend>
        <Choice name="pick" value="a">
          First
        </Choice>
        <Choice name="pick" value="b">
          Second
        </Choice>
      </fieldset>,
    );

    await user.click(screen.getByText('Second'));

    expect(screen.getByRole('radio', { name: 'Second' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'First' })).not.toBeChecked();
  });

  it('can be a checkbox', async () => {
    const { user } = renderWithProviders(<Choice type="checkbox">Merge sort</Choice>);

    await user.click(screen.getByRole('checkbox', { name: 'Merge sort' }));

    expect(screen.getByRole('checkbox', { name: 'Merge sort' })).toBeChecked();
  });
});
