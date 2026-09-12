'use client';

import { useId, type ReactNode } from 'react';

import { Label, Select, SelectItem, Switch } from '@/shared/ui';

import { ALL_COURSES, type CourseFilterOption } from '../model/course-options';

export function ScheduleFilters({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-end gap-4"
      data-testid="schedule-filters"
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-normal">
        {label}
      </Label>
      {children(id)}
    </div>
  );
}

export function CourseFilter({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: CourseFilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      {id => (
        <Select
          id={id}
          uiSize="sm"
          className="w-56"
          value={value}
          onValueChange={onChange}
        >
          <SelectItem value={ALL_COURSES}>{allLabel}</SelectItem>
          {options.map(option => (
            <SelectItem key={option.offeringId} value={option.offeringId}>
              {option.code} — {option.title}
            </SelectItem>
          ))}
        </Select>
      )}
    </Field>
  );
}

export function ChoiceFilter({
  label,
  allLabel,
  allValue,
  options,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  allValue: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      {id => (
        <Select
          id={id}
          uiSize="sm"
          className="w-44"
          value={value}
          onValueChange={onChange}
        >
          <SelectItem value={allValue}>{allLabel}</SelectItem>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      )}
    </Field>
  );
}

export function ToggleFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex h-8 items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}
