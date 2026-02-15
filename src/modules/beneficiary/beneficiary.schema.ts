import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

//General Schema
import { responseCore } from "../general/general.schema";

const beneficiaryCore = {
  fullName: z.string().min(1, "Full name is required"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits"),
  bankName: z.string().min(1, "Bank name is required"),
  note: z.string().optional(),
};

const createBeneficiarySchema = z.object({ ...beneficiaryCore });

const deleteBeneficiarySchema = z.object({
  id: z.string({
    required_error: "Beneficiary Id is required",
  }),
});

const generalBeneficiaryResponseSchema = z.object({
  ...responseCore,
  data: z.array(
    z.object({
      ...beneficiaryCore,
      _id: z.string(),
      user: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
});

const fetchBeneficiaryResponseSchema = z.object({
  ...responseCore,
  data: z.array(
    z.object({
      ...beneficiaryCore,
      _id: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
});

export type CreateBeneficiaryInput = z.infer<typeof createBeneficiarySchema>;
export type DeleteBeneficiaryInput = z.infer<typeof deleteBeneficiarySchema>;

export const { schemas: beneficiarySchemas, $ref: beneficiaryRef } =
  buildJsonSchemas(
    {
      createBeneficiarySchema,
      deleteBeneficiarySchema,
      generalBeneficiaryResponseSchema,
      fetchBeneficiaryResponseSchema,
    },
    { $id: "BeneficiarySchema" }
  );
