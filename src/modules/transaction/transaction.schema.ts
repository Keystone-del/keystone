import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import {
  TransactionType,
  TransactionStatus,
  SubType,
  Initiator,
} from "./transaction.model";

//General Schema
import { responseCore } from "../general/general.schema";

const transactionCore = z.object({
  transactionType: z.nativeEnum(TransactionType, {
    required_error: "Transaction type is required",
  }),
  subType: z.nativeEnum(SubType),
  amount: z.number({
    required_error: "Amount is required",
  }),
  description: z.string().optional(),
  details: z
    .object({
      accountNumber: z.string({
        required_error: "Account Number is Required",
      }),
      recipient: z.string().optional(),
      fullName: z.string({
        required_error: "Full Name is Required",
      }),
      bankName: z.string({
        required_error: "Bank Name is Required",
      }),
      otherDetails: z.string().optional(),
      balanceAfterTransaction: z.number().optional(),
    })
    .optional(),
  isInternational: z.boolean().optional(),
  bankAddress: z.string().optional(),
  recipientAddress: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(),
  initiatedBy: z.nativeEnum(Initiator).optional(),
});

const transactionWithMeta = transactionCore.extend({
  user: z.string(),
  _id: z.string(),
  transactionId: z.string(),
  createdAt: z.string().datetime(),
});

const createTransactionSchema = transactionCore.extend({
  beneficiary: z.boolean().optional(),
  note: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});

const createUserTransactionSchema = createTransactionSchema.extend({
  user: z.string({
    required_error: "User is required",
  }),
  status: z.nativeEnum(TransactionStatus, {
    required_error: "Status is required",
  }),
  notification: z.boolean({
    required_error: "Notification is required",
  }),
});

const fetchTransactionsSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    required_error: "Transaction type is required",
  }),
});

const fetchTransactionSchema = z.object({
  transactionId: z.string({
    required_error: "TransactionID is required",
  }),
});

const fetchUserTransactionsSchema = z.object({
  userId: z.string({
    required_error: "UserID is required",
  }),
});

const createTransactionResponseSchema = z.object({
  ...responseCore,
  data: transactionWithMeta,
});

const getTransactionsResponseSchema = z.object({
  ...responseCore,
  data: z.array(transactionWithMeta),
});

const getTransactionResponseSchema = z.object({
  ...responseCore,
  data: transactionWithMeta,
});

// Administrative Endpoints
const updateTransactionSchema = z.object({
  status: z.nativeEnum(TransactionStatus).optional(),
  transactionId: z.string({
    required_error: "TransactionID is required",
  }),
  createdAt: z.coerce.date().optional(),
  isInternational: z.boolean().optional(),
  bankAddress: z.string().optional(),
  recipientAddress: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  country: z.string().optional(),
});

const getUserTransactionsSchema = z.object({
  userId: z.string({
    required_error: "UserId is required",
  }),
  transactionType: z.nativeEnum(TransactionType).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateUserTransactionInput = z.infer<typeof createUserTransactionSchema>;
export type FetchTransactionsInput = z.infer<typeof fetchTransactionsSchema>;
export type FetchTransactionInput = z.infer<typeof fetchTransactionSchema>;
export type FetchUserTransactionsInput = z.infer<typeof fetchUserTransactionsSchema>;

//Administrative
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetUserTransactionInput = z.infer<typeof getUserTransactionsSchema>;

export const { schemas: transactionSchemas, $ref: transactionRef } =
  buildJsonSchemas(
    {
      createTransactionSchema,
      createUserTransactionSchema,
      fetchTransactionsSchema,
      fetchTransactionSchema,
      fetchUserTransactionsSchema,
      createTransactionResponseSchema,
      getTransactionsResponseSchema,
      getTransactionResponseSchema,
      updateTransactionSchema,
      getUserTransactionsSchema,
    },
    { $id: "TransactionSchema" }
  );
