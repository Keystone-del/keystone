import { FastifyInstance } from "fastify";

//Handlers
import {
  createBeneficiaryHandler,
  deleteBeneficiaryHandler,
  getBeneficiariesHandler,
} from "./beneficiary.controllers";

//Schemas
import {
  beneficiaryRef,
  CreateBeneficiaryInput,
  DeleteBeneficiaryInput,
} from "./beneficiary.schema";
import { generalRef } from "../general/general.schema";

export default async function beneficiaryRoutes(app: FastifyInstance) {
  // Create Beneficiaries
  app.post<{ Body: CreateBeneficiaryInput }>(
    "/create",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Beneficiaries", "Users"],
        security: [{ bearerAuth: [] }],
      },
    },
    createBeneficiaryHandler
  );

  //Fetch beneficiaries
  app.get(
    "/getBeneficiaries",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Beneficiaries", "Users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: beneficiaryRef("generalBeneficiaryResponseSchema"),
        },
      },
    },
    getBeneficiariesHandler
  );

  //Delete beneficiary
  app.delete<{ Params: DeleteBeneficiaryInput }>(
    "/delete/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Beneficiaries", "Users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: generalRef("responseSchema"),
          404: generalRef("unavailableSchema"),
        },
      },
    },
    deleteBeneficiaryHandler
  );
}
