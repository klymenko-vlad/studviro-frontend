'use client';

import * as React from 'react';
import { Slot, type Label as LabelPrimitive } from 'radix-ui';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type FormProviderProps,
} from 'react-hook-form';

import { cn, requiredFieldNames } from '@/shared/lib';
import { Label } from '@/shared/ui/label';

const RequiredFieldsContext = React.createContext<ReadonlySet<string> | null>(null);

interface SchemaProp {
  /**
   * The same schema the resolver validates against. Passing it is what marks
   * the required fields — see `requiredFieldNames`. Omit it and nothing is
   * marked, which is the honest outcome for a form with no schema.
   */
  schema?: Parameters<typeof requiredFieldNames>[0];
}

/**
 * Local deviation from upstream shadcn, where `Form` is `FormProvider` itself:
 * the optional `schema` is read here so every `FormLabel` below can mark itself
 * required without each field restating a rule the schema already carries.
 * Keep this on re-generation.
 */
function Form<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>({
  schema,
  ...props
}: FormProviderProps<TFieldValues, TContext, TTransformedValues> & SchemaProp) {
  const required = React.useMemo(
    () => (schema ? requiredFieldNames(schema) : null),
    [schema],
  );

  return (
    <RequiredFieldsContext.Provider value={required}>
      <FormProvider {...props} />
    </RequiredFieldsContext.Provider>
  );
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  // Upstream throws here when the context is missing; the default context is a
  // cast empty object, so the check is statically dead and the lint gate rejects
  // it. `useFormState` already throws outside a `<Form>`, which is the real case.
  const { id } = itemContext;
  const required =
    React.useContext(RequiredFieldsContext)?.has(fieldContext.name) ?? false;

  return {
    id,
    required,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  required,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
  const { error, formItemId, required: derived } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      data-required={required ?? derived}
      className={cn(
        'data-[error=true]:text-destructive gap-1',
        // A pseudo-element with empty alt text (`content: "*" / ""`): as a real
        // text node the mark would join the field's accessible name ("Work
        // email star"). `aria-required` on the control announces it instead.
        "data-[required=true]:after:text-muted-foreground data-[required=true]:after:[content:'*'_/_'']",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId, required } =
    useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
      aria-required={required || undefined}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField();
  const body = error ? (error.message ?? '') : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      // Local deviation from upstream shadcn: without a live region the message
      // appears silently for a screen-reader user. Keep this on re-generation.
      role="alert"
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
