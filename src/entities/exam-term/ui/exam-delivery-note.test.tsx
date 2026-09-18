import { describe, expect, it } from 'vitest';

import { examTerms, renderWithProviders, screen } from '@/shared/test';

import type { ExamTerm } from '../model/exam-term';
import { ExamDeliveryNote } from './exam-delivery-note';

const registered = examTerms.find(term => term.myRegistration !== null)!;
const unregistered = examTerms.find(term => term.myRegistration === null)!;

const withDelivery = (delivery: NonNullable<ExamTerm['myRegistration']>['delivery']) => ({
  ...registered,
  myRegistration: { ...registered.myRegistration!, delivery },
});

describe('ExamDeliveryNote', () => {
  it('says nothing about a term the reader has not registered for', () => {
    renderWithProviders(<ExamDeliveryNote term={unregistered} />);

    expect(screen.queryByTestId('exam-delivery-note')).not.toBeInTheDocument();
  });

  it('admits the registrar is not notified when the connector cannot write', () => {
    renderWithProviders(<ExamDeliveryNote term={withDelivery('not_relayed')} />);

    expect(screen.getByText('Registered in StudViro')).toBeInTheDocument();
    expect(screen.getByText(/not notified automatically/i)).toBeInTheDocument();
  });

  it('says the write is still on its way while it is queued', () => {
    renderWithProviders(<ExamDeliveryNote term={withDelivery('sending')} />);

    expect(screen.getByText('Sending to the university')).toBeInTheDocument();
  });

  it('names a refusal as a refusal and says the registration was withdrawn', () => {
    renderWithProviders(<ExamDeliveryNote term={withDelivery('refused')} />);

    expect(screen.getByText('Refused by the university')).toBeInTheDocument();
    expect(screen.getByText(/withdrawn here too/i)).toBeInTheDocument();
  });

  it('distinguishes an unreachable system from a refusal', () => {
    renderWithProviders(<ExamDeliveryNote term={withDelivery('stuck')} />);

    expect(screen.getByText('Not confirmed')).toBeInTheDocument();
    expect(screen.getByText(/registration stands here/i)).toBeInTheDocument();
  });
});
