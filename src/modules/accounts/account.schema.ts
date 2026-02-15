import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

//General Schema
import { responseCore } from "../general/general.schema";

const accountCore = {
  fullName: z.string().min(1, "Full name is required"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits"),
  bankName: z.string().min(1, "Bank name is required"),
};

const createAccountSchema = z.object({ ...accountCore });

const getAccountSchema = z.object({
  accountNumber: z.string({
    required_error: "Account Number is Required",
  }),
});

const editAccountSchema = z.object({
  accountId: z.string({
    required_error: "Account ID is required",
  }),
  accountNumber: z.string().optional(),
  fullName: z.string().optional(),
  bankName: z.string().optional(),
});

const deleteAccountSchema = z.object({
  id: z.string({
    required_error: "Account Id is required",
  }),
});

const accountResponseSchema = z.object({
  ...responseCore,
  data: z.object({
    ...accountCore,
    _id: z.string(),
    createdAt: z.string().datetime(),
  }),
});

const generalAccountResponseSchema = z.object({
  ...responseCore,
  data: z.array(
    z.object({
      ...accountCore,
      _id: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type GetAccountInput = z.infer<typeof getAccountSchema>;
export type EditAccountInput = z.infer<typeof editAccountSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const { schemas: accountSchemas, $ref: accountRef } = buildJsonSchemas(
  {
    createAccountSchema,
    getAccountSchema,
    editAccountSchema,
    deleteAccountSchema,
    accountResponseSchema,
    generalAccountResponseSchema,
  },
  { $id: "AccountSchema" }
);
