import { z, nativeEnum } from "zod";
import { buildJsonSchemas } from "fastify-zod";

//Schemas and Enums
import { responseCore } from "../general/general.schema";
import { SavingsStatus } from "./savings.model";

const savingsCore = {
  _id: z.string(),
  user: z.string(),
  title: z.string().min(1),
  targetAmount: z.number().int("Target Amount must be an integer").optional(),
  savedAmount: z.number().int("Save Amount must be an integer").default(0),
  interestRate: z.number().default(4.4),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  totalInterestAccrued: z.number(),
  lastInterestDate: z.string().datetime(),
  status: nativeEnum(SavingsStatus),
  createdAt: z.string().datetime(),
};

const createSavingsSchema = z.object({
  user: z.string().optional(),
  title: z.string().min(1),
  targetAmount: z
    .number()
    .int("Target amount must be an integer")
    .min(1, "Minimum of 100")
    .optional(),
  savedAmount: z
    .number()
    .int("Save Amount must be an integer")
    .min(1, "Minimum of 10")
    .default(0),
  interestRate: z.number().default(4.4),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

const withdrawSavingsSchema = z.object({
  savingsId: z.string({
    required_error: "Savings ID is Required",
  }),
  amount: z.number({
    required_error: "Amount is Required",
  }),
});

const fetchUserSavingsSchema = z.object({
  userId: z.string({
    required_error: "User ID is Required",
  }),
});

const deleteSavingsSchema = z.object({
  savingsId: z.string({
    required_error: "Savings ID is required",
  }),
});

export const generalSavingsResponseSchema = z.object({
  ...responseCore,
  data: z.object({ ...savingsCore }),
});

export type CreateSavingsInput = z.infer<typeof createSavingsSchema>;
export type FetchUserSavingsInput = z.infer<typeof fetchUserSavingsSchema>;
export type WithdrawSavingsInput = z.infer<typeof withdrawSavingsSchema>;
export type DeleteSavingsInput = z.infer<typeof deleteSavingsSchema>;

export const { schemas: savingsSchemas, $ref: savingsRef } = buildJsonSchemas(
  {
    createSavingsSchema,
    fetchUserSavingsSchema,
    withdrawSavingsSchema,
    deleteSavingsSchema,
    generalSavingsResponseSchema,
  },
  { $id: "SavingsSchema" }
);
