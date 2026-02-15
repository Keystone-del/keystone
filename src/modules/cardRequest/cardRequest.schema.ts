import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import { responseCore } from '../general/general.schema';

//Enums
import { CardRequestStatus } from './cardRequest.model';

export const generalCardRequestResponseSchema = z.object({
  ...responseCore,
  data: z.object({
    user: z.string(),
    status: z.nativeEnum(CardRequestStatus),
    cardNumber: z.string(),
    cardExpiryDate: z.string(),
    cardCVV: z.string(),
    createdAt: z.string().datetime(),
  }),
});

export const updateCardRequestSchema = z.object({
  requestId: z.string({
    required_error: 'Card Request Id is needed',
  }),
  status: z.nativeEnum(CardRequestStatus),
});

export const deleteCardRequestSchema = z.object({
  requestId: z.string({
    required_error: 'Card Request Id is needed',
  }),
});

export type UpdateCardRequestInput = z.infer<typeof updateCardRequestSchema>;
export type DeleteCardRequestInput = z.infer<typeof deleteCardRequestSchema>;

export const { schemas: cardRequestSchemas, $ref: cardRequestRef } =
  buildJsonSchemas(
    {
      updateCardRequestSchema,
      deleteCardRequestSchema,
      generalCardRequestResponseSchema,
    },
    { $id: 'CardRequestSchema' }
  );
