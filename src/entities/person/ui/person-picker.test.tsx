import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { people, renderWithProviders, screen, within } from '@/shared/test';

import type { Person } from '../model/person';
import { PersonPicker } from './person-picker';

const directory: Person[] = [
  ...people,
  {
    userId: '33333333-3333-4333-8333-333333333333',
    email: 'jana.novakova.2@example.com',
    displayName: 'Jana Nováková',
    status: 'active',
    roles: [],
  },
];

function Harness({ onChange = vi.fn() }: { onChange?: (userId: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <PersonPicker
      people={directory}
      value={value}
      onChange={userId => {
        setValue(userId);
        onChange(userId);
      }}
      placeholder="Search by name or email"
      emptyLabel="Nobody matches that"
    />
  );
}

const open = async () => {
  const { user } = renderWithProviders(<Harness />);
  const box = screen.getByRole('combobox');

  await user.click(box);

  return { user, box };
};

describe('PersonPicker', () => {
  it('offers the directory as soon as it is focused', async () => {
    await open();

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(3);
  });

  it('narrows the list to what was typed', async () => {
    const { user, box } = await open();

    await user.type(box, 'peter');

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Peter Kováč');
  });

  it('matches on the email address, which is what tells two Janas apart', async () => {
    const { user, box } = await open();

    await user.type(box, 'novakova.2');

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('jana.novakova.2@example.com');
  });

  it('matches terms in any order', async () => {
    const { user, box } = await open();

    await user.type(box, 'kovac peter');

    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
  });

  it('says so when nothing matches, rather than showing an empty box', async () => {
    const { user, box } = await open();

    await user.type(box, 'zzzz');

    expect(screen.getByText('Nobody matches that')).toBeInTheDocument();
    expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0);
  });

  it('reports the person the user clicked', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Peter Kováč/u }));

    expect(onChange).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });

  it('shows the chosen name once the list has closed', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Peter Kováč/u }));

    expect(screen.getByRole('combobox')).toHaveValue('Peter Kováč');
  });

  it('can be driven from the keyboard alone', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness onChange={onChange} />);

    await user.tab();
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });

  it('wraps around the ends of the list rather than stopping', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness onChange={onChange} />);

    await user.tab();
    await user.keyboard('{ArrowUp}{Enter}');

    expect(onChange).toHaveBeenCalledWith('33333333-3333-4333-8333-333333333333');
  });

  it('closes on Escape without choosing anybody', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('tells assistive technology which option is current', async () => {
    const { user, box } = await open();

    await user.keyboard('{ArrowDown}');

    expect(box).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('22222222-2222-4222-8222-222222222222'),
    );
  });
});
