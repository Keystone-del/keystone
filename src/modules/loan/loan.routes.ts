import { FastifyInstance } from "fastify";

//Handlers
import {
  deleteLoanRequestHandler,
  getLoanRequestsHandler,
  getUserLoanHandler,
  loanApplicationHandler,
  updateLoanHandler,
} from "./loan.controller";

//Schemas
import {
  CreateLoanInput,
  DeleteLoanInput,
  loanRef,
  UpdateLoanInput,
} from "./loan.schema";
import { generalRef, PaginationInput } from "../general/general.schema";

export default async function loanRoutes(app: FastifyInstance) {
  //Create new card request
  app.post<{ Body: CreateLoanInput }>(
    "/new",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Users", "Loans"],
        security: [{ bearerAuth: [] }],
        body: loanRef("createLoanSchema"),
        response: {
          201: loanRef("loanResponseSchema"),
          415: generalRef("unsupportedSchema"),
          413: generalRef("payloadSchema"),
          400: generalRef("badRequestSchema"),
        },
      },
    },
    loanApplicationHandler
  );

  //Get a user's loan
  app.get(
    "/getLoan",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Users", "Loans"],
        security: [{ bearerAuth: [] }],
      },
    },
    getUserLoanHandler
  );

  //Admin Routes

  //Get all loans
  app.get<{ Querystring: PaginationInput }>(
    "/getAllLoan",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Admins", "Loans"],
        security: [{ bearerAuth: [] }],
        querystring: generalRef("paginationSchema"),
        response: {
          401: generalRef("unauthorizedSchema"),
        },
      },
    },
    getLoanRequestsHandler
  );

  //Update Loan
  app.patch<{ Body: UpdateLoanInput }>(
    "/update",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Admins", "Loans"],
        security: [{ bearerAuth: [] }],
        body: loanRef("updateLoanSchema"),
        response: {
          200: loanRef("loanResponseSchema"),
          401: generalRef("unauthorizedSchema"),
          403: generalRef("forbiddenSchema"),
        },
      },
    },
    updateLoanHandler
  );

  //Delete Loan
  app.delete<{ Params: DeleteLoanInput }>(
    "/delete/:loanId",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Admins", "Loans"],
        security: [{ bearerAuth: [] }],
        params: loanRef("deleteLoanSchema"),
        response: {
          401: generalRef("unauthorizedSchema"),
          403: generalRef("forbiddenSchema"),
        },
      },
    },
    deleteLoanRequestHandler
  );
}
