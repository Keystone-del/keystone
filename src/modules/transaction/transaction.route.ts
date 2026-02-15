import { FastifyInstance } from "fastify";

//Handlers
import { createNewTransactionHandler, createUserTransactionHandler, deleteUserTransactionHandler, fetchAllTransactionsHandler, fetchAllUserTransactionsHandler, fetchLastTransactionsHandler, fetchPricesHandler, fetchTransactionHandler, fetchUserTransactionHandler, getUserBalanceHandler, updateTransactionHandler, } from "./transaction.controller";

//Schemas
import { CreateTransactionInput, CreateUserTransactionInput, FetchTransactionInput, GetUserTransactionInput, transactionRef, UpdateTransactionInput } from "./transaction.schema";
import { generalRef, PaginationInput } from "../general/general.schema";

//Transaction Routes
export default async function transactionRoutes(app: FastifyInstance) {
  //Create new transaction
  app.post<{ Body: CreateTransactionInput }>("/create", {
    preHandler: app.authenticate,
    schema: {
      tags: ["Transactions", "Users"],
      security: [{ bearerAuth: [] }],
      body: transactionRef("createTransactionSchema"),
      response: {
        201: transactionRef("createTransactionResponseSchema"),
        400: generalRef("badRequestSchema"),
        403: generalRef("forbiddenSchema"),
      },
    },
  },
    createNewTransactionHandler
  );

  //Fetches the price list
  app.get("/fetchPrices", {
    schema: {
      tags: ["Transactions"],
      security: [{ bearerAuth: [] }],
    },
  },
    fetchPricesHandler
  );

  //Get a user last five transactions
  app.get("/getLastTransactions", {
    preHandler: app.authenticate,
    schema: {
      tags: ["Transactions", "Users"],
      security: [{ bearerAuth: [] }],
    },
  },
    fetchLastTransactionsHandler
  );

  //Fetch a single transaction
  app.get<{ Params: FetchTransactionInput }>("/getTransaction/:transactionId", {
    preHandler: app.authenticate,
    schema: {
      tags: ["Transactions", "Users"],
      security: [{ bearerAuth: [] }],
      params: transactionRef("fetchTransactionSchema"),
      response: {
        400: generalRef("badRequestSchema"),
        403: generalRef("forbiddenSchema"),
      },
    },
  },
    fetchTransactionHandler
  );

  //Fetch all transactions of a user
  app.get<{ Querystring: PaginationInput }>("/userTransactions", {
    preHandler: app.authenticate,
    schema: {
      tags: ["Transactions", "Users"],
      security: [{ bearerAuth: [] }],
      querystring: generalRef("paginationSchema"),
    },
  },
    fetchAllUserTransactionsHandler
  );

  //Fetch a user balance
  app.get("/getBalance", {
    preHandler: app.authenticate,
    schema: {
      tags: ["Transactions", "Users"],
      security: [{ bearerAuth: [] }],
    },
  },
    getUserBalanceHandler
  );

  //Admin Routes

  //Create a new transaction for a user
  app.post<{ Body: CreateUserTransactionInput }>("/createUserTransaction", {
    preHandler: app.authenticateAdmin,
    schema: {
      tags: ["Transactions", "Admins"],
      security: [{ bearerAuth: [] }],
      body: transactionRef("createUserTransactionSchema"),
      response: {
        201: transactionRef("createTransactionResponseSchema"),
        400: generalRef("badRequestSchema"),
        403: generalRef("forbiddenSchema"),
      },
    },
  },
    createUserTransactionHandler
  );

  //Fetch all transactions
  app.get<{ Querystring: PaginationInput }>("/getAllTransactions", {
    preHandler: app.authenticateAdmin,
    schema: {
      tags: ["Transactions", "Admins"],
      security: [{ bearerAuth: [] }],
      querystring: generalRef("paginationSchema"),
    },
  },
    fetchAllTransactionsHandler
  );

  //Update Transactions
  app.patch<{ Body: UpdateTransactionInput }>("/updateTransaction", {
    preHandler: app.authenticateAdmin,
    schema: {
      tags: ["Transactions", "Admins"],
      security: [{ bearerAuth: [] }],
      body: transactionRef("updateTransactionSchema"),
      response: {
        200: transactionRef("getTransactionResponseSchema"),
        400: generalRef("badRequestSchema"),
        403: generalRef("forbiddenSchema"),
        404: generalRef("unavailableSchema"),
      },
    },
  },
    updateTransactionHandler
  );

  //Fetch User Transactions
  app.post<{ Body: GetUserTransactionInput; Querystring: PaginationInput }>("/getUserTransactions", {
    preHandler: app.authenticateAdmin,
    schema: {
      tags: ["Transactions", "Admins"],
      security: [{ bearerAuth: [] }],
      body: transactionRef("getUserTransactionsSchema"),
      querystring: generalRef("paginationSchema"),
      response: {
        400: generalRef("badRequestSchema"),
      },
    },
  },
    fetchUserTransactionHandler
  );

  //Delete a transaction
  app.delete<{ Params: FetchTransactionInput }>("/delete/:transactionId", {
    preHandler: app.authenticateAdmin,
    schema: {
      tags: ["Transactions", "Admins"],
      security: [{ bearerAuth: [] }],
      params: transactionRef("fetchTransactionSchema"),
    },
  },
    deleteUserTransactionHandler
  );
}
