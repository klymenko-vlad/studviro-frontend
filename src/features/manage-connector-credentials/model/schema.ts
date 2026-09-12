import { z } from 'zod';

export const connectorCredentialValueSchema = z.object({
  value: z.string().trim().min(1),
});

export type ConnectorCredentialValueFormValues = z.infer<
  typeof connectorCredentialValueSchema
>;
