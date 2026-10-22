import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { useZodResolver } from '@/shared/lib';
import { renderWithProviders, screen } from '@/shared/test/render';

import { Button } from './button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';

const schema = z.object({
  email: z.email(),
  name: z.string().min(2).max(4),
  title: z.string().min(1),
  note: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function TestForm() {
  const form = useForm<Values>({
    resolver: useZodResolver(schema),
    defaultValues: { email: '', name: '', title: '', note: '' },
  });

  return (
    <Form {...form} schema={schema}>
      <form onSubmit={form.handleSubmit(() => undefined)} noValidate>
        {(['email', 'name', 'title', 'note'] as const).map(name => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{name}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}

describe('Form', () => {
  it('marks the fields the schema will not let go blank', () => {
    renderWithProviders(<TestForm />);

    expect(screen.getByLabelText('email')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('name')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('title')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('note')).not.toHaveAttribute('aria-required');
    expect(screen.getByText('email')).toHaveAttribute('data-required', 'true');
    expect(screen.getByText('note')).toHaveAttribute('data-required', 'false');
    expect(screen.getByLabelText('email')).toBeInTheDocument();
  });

  it('says what to do instead of describing the schema', async () => {
    const { user } = renderWithProviders(<TestForm />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('This field is required.')).toBeInTheDocument();
    expect(
      screen.getByText('Enter an email address, like name@university.edu.'),
    ).toBeInTheDocument();
  });

  it('carries the schema own bounds into the message', async () => {
    const { user } = renderWithProviders(<TestForm />);

    await user.type(screen.getByLabelText('name'), 'a');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Use at least 2 characters.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('name'));
    await user.type(screen.getByLabelText('name'), 'abcde');

    expect(await screen.findByText('Use 4 characters or fewer.')).toBeInTheDocument();
  });
});
