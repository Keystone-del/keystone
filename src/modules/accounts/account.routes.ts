import { FastifyInstance } from "fastify/types/instance";

//Handlers
import {
  CreateAccountHandler,
  deleteAccountHandler,
  editAccountHandler,
  fetchAccountHandler,
  fetchAccountsHandler,
} from "./account.controller";

//Schemas
import { generalRef, PaginationInput } from "../general/general.schema";
import {
  accountRef,
  CreateAccountInput,
  DeleteAccountInput,
  EditAccountInput,
  GetAccountInput,
} from "./account.schema";

export default async function accountRoutes(app: FastifyInstance) {
  //Fetch an account
  app.get<{ Params: GetAccountInput }>(
    "/get/:accountNumber",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Users", "Accounts"],
        security: [{ bearerAuth: [] }],
        params: accountRef("getAccountSchema"),
        response: {
          200: accountRef("accountResponseSchema"),
          404: generalRef("unavailableSchema"),
        },
      },
    },
    fetchAccountHandler
  );

  // Admins
  //Create a new account
  app.post<{ Body: CreateAccountInput }>(
    "/create",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Accounts"],
        security: [{ bearerAuth: [] }],
        body: accountRef("createAccountSchema"),
        response: {
          201: accountRef("accountResponseSchema"),
          401: generalRef("unauthorizedSchema"),
          409: generalRef("conflictRequestSchema"),
        },
      },
    },
    CreateAccountHandler
  );

  //Edit Account
  app.patch<{ Body: EditAccountInput }>(
    "/edit",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Accounts"],
        security: [{ bearerAuth: [] }],
        body: accountRef("editAccountSchema"),
        response: {
          200: accountRef("accountResponseSchema"),
          401: generalRef("unauthorizedSchema"),
          400: generalRef("badRequestSchema"),
        },
      },
    },
    editAccountHandler
  );

  //Delete Account
  app.delete<{ Params: DeleteAccountInput }>(
    "/delete/:id",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Accounts"],
        security: [{ bearerAuth: [] }],
        params: accountRef("deleteAccountSchema"),
        response: {
          204: generalRef("responseSchema"),
          401: generalRef("unauthorizedSchema"),
        },
      },
    },
    deleteAccountHandler
  );

  //Fetch all accounts
  app.get<{ Querystring: PaginationInput }>(
    "/allAccounts",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Admins", "Accounts"],
        security: [{ bearerAuth: [] }],
        querystring: generalRef("paginationSchema"),
      },
    },
    fetchAccountsHandler
  );
}
