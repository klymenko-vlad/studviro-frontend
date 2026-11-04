import { z } from 'zod';

import { fromLocalInput, toLocalInput } from '@/shared/lib';

const moment = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u, 'Use a date and a time'),
  z.literal(''),
]);

export const availabilityFormShape = {
  availableFrom: moment,
  availableUntil: moment,
  hiddenUntilAvailable: z.boolean(),
};

export interface AvailabilityFormValues {
  availableFrom: string;
  availableUntil: string;
  hiddenUntilAvailable: boolean;
}

export interface AvailabilityWindow {
  availableFrom: string | null;
  availableUntil: string | null;
  hiddenUntilAvailable: boolean;
}

export const EMPTY_AVAILABILITY: AvailabilityFormValues = {
  availableFrom: '',
  availableUntil: '',
  hiddenUntilAvailable: false,
};

export function availabilityInOrder(values: AvailabilityFormValues): boolean {
  return (
    values.availableFrom === '' ||
    values.availableUntil === '' ||
    values.availableUntil > values.availableFrom
  );
}

export const AVAILABILITY_ORDER_ISSUE = {
  path: ['availableUntil'],
  message: 'Something stops being available after it becomes available',
};

export function toAvailabilityValues(
  item: AvailabilityWindow,
  timeZone: string,
): AvailabilityFormValues {
  return {
    availableFrom: toLocalInput(item.availableFrom, timeZone),
    availableUntil: toLocalInput(item.availableUntil, timeZone),
    hiddenUntilAvailable: item.hiddenUntilAvailable,
  };
}

export function toAvailabilityPayload(
  values: AvailabilityFormValues,
  timeZone: string,
): AvailabilityWindow {
  return {
    availableFrom: fromLocalInput(values.availableFrom, timeZone),
    availableUntil: fromLocalInput(values.availableUntil, timeZone),
    hiddenUntilAvailable: values.hiddenUntilAvailable,
  };
}
