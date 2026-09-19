'use client';

import { useId, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib';
import { Input } from '@/shared/ui';

import { matchPeople, type Person } from '../model/person';

const MAX_SUGGESTIONS = 8;

/**
 * A typeahead over the institution directory, which after a seed is 170-odd
 * names and in a real institution is thousands. The whole list is already in
 * memory — this narrows it rather than fetching, so the picker stays usable
 * without a new endpoint.
 *
 * Built from `Input` and a plain listbox rather than a combobox primitive: the
 * shared UI barrel is the client bundle, and adopting one would put it on every
 * route whether or not a page picks a person.
 */
export function PersonPicker({
  people,
  value,
  onChange,
  placeholder,
  emptyLabel,
  disabled,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
}: {
  people: Person[];
  value: string;
  onChange: (userId: string) => void;
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const listboxId = `${inputId}-listbox`;

  const selected = people.find(person => person.userId === value);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const matches = useMemo(
    () => matchPeople(people, query).slice(0, MAX_SUGGESTIONS),
    [people, query],
  );

  const text = open ? query : (selected?.displayName ?? '');

  const choose = (person: Person) => {
    onChange(person.userId);
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }

      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(current => {
        if (matches.length === 0) return 0;

        return (current + step + matches.length) % matches.length;
      });

      return;
    }

    if (event.key === 'Enter' && open) {
      const person = matches[active];
      if (person === undefined) return;

      event.preventDefault();
      choose(person);

      return;
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setQuery('');
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        id={inputId}
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && matches[active] ? `${listboxId}-${matches[active].userId}` : undefined
        }
        aria-describedby={describedBy}
        aria-invalid={invalid}
        disabled={disabled}
        placeholder={placeholder}
        value={text}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => {
            setQuery('');
            setOpen(false);
          }, 0);
        }}
        onKeyDown={onKeyDown}
      />

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border shadow-md"
        >
          {matches.length === 0 ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">{emptyLabel}</p>
          ) : (
            matches.map((person, index) => (
              <button
                key={person.userId}
                id={`${listboxId}-${person.userId}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={person.userId === value}
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left text-sm',
                  index === active && 'bg-accent text-accent-foreground',
                )}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onMouseDown={event => {
                  event.preventDefault();
                  clearTimeout(blurTimer.current);
                }}
                onClick={() => {
                  choose(person);
                }}
              >
                <span className="block">{person.displayName}</span>
                <span className="text-muted-foreground block text-xs">
                  {person.email}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
