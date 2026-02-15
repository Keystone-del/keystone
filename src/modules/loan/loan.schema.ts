import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

//General Schema
import { responseCore } from "../general/general.schema";

const createLoanSchema = z.object({
  principal: z.number().min(0.01, "Principal must be greater than 0"),

  interestRate: z
    .number()
    .min(1, "Interest rate must be at least 1%")
    .max(100, "Interest rate cannot exceed 100%"),

  termInMonths: z
    .number()
    .int("Term must be an integer")
    .min(1, "Term must be at least 1 month"),

  collateral: z.string().optional(),

  documents: z.array(z.string().url()).optional(),
});

const updateLoanSchema = z.object({
  loanId: z.string().length(24),
  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "active",
    "completed",
    "defaulted",
  ]),
});

const loanWithMeta = createLoanSchema.extend({
  user: z.string({
    required_error: "User is required",
  }),
  totalRepayable: z.number({
    required_error: "Total Repayable is required",
  }),
  monthlyPayment: z.number({
    required_error: "Monthly Repayment is required",
  }),
  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "active",
    "completed",
    "defaulted",
  ]),
  approvedAt: z.string().datetime().optional(),
  dueDates: z.array(
    z.object({
      dueDate: z.string().datetime(),
      paid: z.boolean(),
      amount: z.number(),
    })
  ),
  createdAt: z.string().datetime(),
});

const deleteLoanSchema = z.object({
  loanId: z.string({
    required_error: "The loan ID is required",
  }),
});

const loanResponseSchema = z.object({
  ...responseCore,
  data: loanWithMeta,
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type DeleteLoanInput = z.infer<typeof deleteLoanSchema>;

export const { schemas: loanSchemas, $ref: loanRef } = buildJsonSchemas(
  {
    createLoanSchema,
    updateLoanSchema,
    deleteLoanSchema,
    loanResponseSchema,
  },
  { $id: "LoanSchema" }
);
