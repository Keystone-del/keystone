import { FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";

//Services
import { createNewTransaction, deleteTransaction, fetchTransactions, getLastFiveTransactions, getTransactionById, getTransactions, getUserBalance, getUserTransactions, updateTransaction } from "./transaction.service";
import { findUserById } from "../user/user.service";
import { findAdminById } from "../admin/admin.service";
import { createBeneficiary, ownBeneficiary } from "../beneficiary/beneficiary.services";
import { newActivity } from "../activity/activity.services";

//Schemas
import { CreateTransactionInput, CreateUserTransactionInput, FetchTransactionInput, GetUserTransactionInput, UpdateTransactionInput } from "./transaction.schema";
import { PaginationInput } from "../general/general.schema";

//Utils, Enums and Configs
import { generateTransactionHash } from "../../utils/generate";
import { sendResponse } from "../../utils/response.utils";
import { coinIds } from "../../enums";
import { COINGECKO_API_KEY } from "../../config";
import { emitAndSaveNotification } from "../../utils/socket";
import { sendEmail } from "../../libs/mailer";
import { formatDate, capitalizeWords } from "../../utils/format";

//Email Templates
import transactionEmail from "../../emails/transactionEmail";

//Constants
const cache = new Map();
const CACHE_KEY = "prices";
const CACHE_TTL = 2 * 60 * 1000;
const coingeckoURL = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&include_24hr_change=true`;

//Create a new transaction
export const createNewTransactionHandler = async (request: FastifyRequest<{ Body: CreateTransactionInput }>, reply: FastifyReply) => {

  const decodedDetails = request.user;
  const userId = decodedDetails._id;

  const user = await findUserById(userId);
  if (!user) return sendResponse(reply, 400, false, "User not found.");
  if (user.isSuspended)
    return sendResponse(reply, 403, false, "Account suspended.");

  const transactionId = generateTransactionHash();

  // Create initial transaction for initiator
  const newTransaction = await createNewTransaction(userId, request.body, transactionId);

  //Create a beneficiary if it exists
  if (request.body.beneficiary === true && request.body.details) {
    //Check if the beneficiary already exists
    const exists = await ownBeneficiary(request.body.details.accountNumber, userId);
    if (!exists) {
      const data = {
        accountNumber: request.body.details.accountNumber,
        fullName: request.body.details.fullName,
        bankName: request.body.details.bankName,
        user: userId,
        note: request.body.note,
      };
      const newBeneficiary = await createBeneficiary(data, userId);
      if (!newBeneficiary) return sendResponse(reply, 400, false, `Failed to add ${request.body.details.fullName} as a beneficiary. Please try again.`);
    }
  }

  const balance = await getUserBalance(userId);

  await emitAndSaveNotification({
    user: userId,
    type: "transaction",
    subtype: newTransaction.transactionType,
    title: `Account ${newTransaction.transactionType === "debit" ? "Debited" : "Credited"}`,
    message: `$${newTransaction.amount.toLocaleString()} was ${capitalizeWords(newTransaction.transactionType)}ed from your account.`,
    data: {
      transactionId: newTransaction.transactionId,
      amount: newTransaction.amount,
      balance,
      date: newTransaction.createdAt,
    },
  });

  const emailContent = transactionEmail({
    name: capitalizeWords(user.fullName),
    amount: newTransaction.amount,
    date: formatDate(newTransaction.createdAt),
    transactionId: newTransaction.transactionId,
    description: newTransaction.description,
    balance: balance - newTransaction.amount,
    type: capitalizeWords(newTransaction.transactionType),
    subType: capitalizeWords(newTransaction.subType),
  });

  await sendEmail({
    to: user.email,
    subject: `Transaction Alert: Account ${capitalizeWords(newTransaction.transactionType)}ed`,
    html: emailContent.html,
  });

  return sendResponse(reply, 201, true, "Your transaction was created successfully.", newTransaction);
};

//Get a user balance
export const getUserBalanceHandler = async (request: FastifyRequest, reply: FastifyReply) => {

  const decodedDetails = request.user;
  const userId = decodedDetails._id;

  const isExisting = await findUserById(userId);
  if (!isExisting) return sendResponse(reply, 400, false, "User not found");

  const balance = await getUserBalance(userId);
  return sendResponse(reply, 200, true, "User balance was fetched successfully", balance);
};

//Fetch Prices
export const fetchPricesHandler = async (request: FastifyRequest, reply: FastifyReply) => {

  const now = Date.now();
  const cached = cache.get(CACHE_KEY);

  if (cached && now - cached.timestamp < CACHE_TTL) return sendResponse(reply, 200, true, "Coins prices were fetched successfully (from cache)", cached.data);

  try {
    const { data } = await axios.get(coingeckoURL, {
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY,
      },
    });

    cache.set(CACHE_KEY, {
      data,
      timestamp: now,
    });

    return sendResponse(reply, 200, true, "Coins prices were fetched successfully", data);
  } catch (error) {
    console.log("Failed to fetch prices:", error);
    return sendResponse(reply, 500, false, "Failed to fetch coin prices. Please try again later.");
  }
};

//Fetch a users last Five transactions
export const fetchLastTransactionsHandler = async (request: FastifyRequest, reply: FastifyReply) => {

  const decodedDetails = request.user;
  const userId = decodedDetails._id;

  //Make sure the user still exists
  const user = await findUserById(userId);
  if (!user) sendResponse(reply, 400, false, "Sorry, that user account could not be found. Please verify the information and try again.");

  //Throw an error if user is suspended
  if (user && user.isSuspended) return sendResponse(reply, 403, false, "Account suspended. Transaction cannot be completed.");

  //Fetch transactions and return them
  const transactions = await getLastFiveTransactions(userId);
  return sendResponse(reply, 200, true, "All Transactions was fetched successfully", transactions);
};

//Fetch a single Transaction
export const fetchTransactionHandler = async (request: FastifyRequest<{ Params: FetchTransactionInput }>, reply: FastifyReply) => {

  const decodedDetails = request.user;
  const userId = decodedDetails._id;

  const transaction = await getTransactionById(request.params.transactionId);

  //Throw an error if the transactionID does not exist
  if (!transaction) return sendResponse(reply, 400, false, "No record of a transaction matching the given identifier was found.");

  //Throw an error if the logged user isn't the same with the user
  if (transaction.user.toString() !== userId) return sendResponse(reply, 403, false, "You do not have permission to view the details of this transaction.");

  return sendResponse(reply, 200, true, "Transaction Details was fetched successfully.", transaction);
};

//Fetch all transaction
export const fetchAllUserTransactionsHandler = async (request: FastifyRequest<{ Querystring: PaginationInput }>, reply: FastifyReply) => {

  const { page = "1", limit = "20" } = request.query;

  const decodedDetails = request.user;
  const userId = decodedDetails._id;

  //Make sure the user still exists
  const user = await findUserById(userId);
  if (!user) sendResponse(reply, 400, false, "Sorry, that user account could not be found. Please verify the information and try again.");

  //Throw an error if user is suspended
  if (user && user.isSuspended) return sendResponse(reply, 403, false, "Account suspended. Transaction cannot be completed.");

  //Fetch transactions and return them
  const transactions = await getUserTransactions(userId, parseInt(page), parseInt(limit));
  return sendResponse(reply, 200, true, "All Transactions was fetched successfully", transactions);
};

// Administrative Handlers

//Create a new transaction
export const createUserTransactionHandler = async (request: FastifyRequest<{ Body: CreateUserTransactionInput }>, reply: FastifyReply) => {

  const { user, notification, createdAt, ...transactionDetails } = request.body;
  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin._id);

  if (!admin) return sendResponse(reply, 401, false, "Authentication failed: Admin not found.");
  if (admin.role !== "super_admin") return sendResponse(reply, 403, false, "Authorization failed: Insufficient privileges.");

  // 2. User Existence and Status Check
  const userDetails = await findUserById(user);
  if (!userDetails) return sendResponse(reply, 404, false, "The specified user account could not be found.");
  if (userDetails.isSuspended) return sendResponse(reply, 403, false, "The selected user account is currently suspended. Please lift the suspension to proceed.");

  const transactionId = generateTransactionHash();
  const createdAtDate = createdAt ? new Date(createdAt) : new Date();
  const newTransaction = await createNewTransaction(user, { ...transactionDetails, createdAt: createdAtDate }, transactionId);

  if (notification) {
    const balance = await getUserBalance(user);

    const commonData = { transactionId: newTransaction.transactionId, amount: newTransaction.amount, balance, date: newTransaction.createdAt, };

    await emitAndSaveNotification({
      user,
      type: "transaction",
      subtype: newTransaction.transactionType,
      title: `Account ${newTransaction.transactionType === "debit" ? "Debited" : "Credited"}`,
      message: `$${newTransaction.amount.toLocaleString()} was ${capitalizeWords(newTransaction.transactionType)}ed from your account.`,
      data: commonData,
    });

    const transactionEmailContent = transactionEmail({
      name: capitalizeWords(userDetails.fullName),
      amount: newTransaction.amount,
      date: formatDate(newTransaction.createdAt),
      transactionId: newTransaction.transactionId,
      description: newTransaction.description,
      balance: balance - newTransaction.amount,
      type: capitalizeWords(newTransaction.transactionType),
      subType: capitalizeWords(newTransaction.subType),
    });

    await sendEmail({
      to: userDetails.email,
      subject: `Transaction Alert: Account ${capitalizeWords(newTransaction.transactionType)}ed`,
      html: transactionEmailContent.html,
    });
  }

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "New Transaction",
    target: newTransaction.user.toString(),
    metadata: {
      "Transaction Type": newTransaction.transactionType,
      "Transaction Method": newTransaction.subType,
      Amount: newTransaction.amount,
      Status: newTransaction.status,
    },
  };
  await newActivity(data);

  return sendResponse(reply, 201, true, "Transaction created successfully.", newTransaction);
};

//Fetch all transaction
export const fetchAllTransactionsHandler = async (request: FastifyRequest<{ Querystring: PaginationInput }>, reply: FastifyReply) => {

  const { page = "1", limit = "20" } = request.query;

  //Fetch transactions and return them
  const transactions = await getTransactions(parseInt(page), parseInt(limit));
  return sendResponse(reply, 200, true, "All Transactions was fetched successfully", transactions);
};

//Update Transaction
export const updateTransactionHandler = async (request: FastifyRequest<{ Body: UpdateTransactionInput }>, reply: FastifyReply) => {

  const { transactionId, createdAt } = request.body;
  const decodedAdmin = request.admin!;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin) return sendResponse(reply, 400, false, "Sorry, but you are not authorized to perform this action");
  if (admin.role !== "super_admin") return sendResponse(reply, 403, false, "Sorry, you are not authorized enough to perform this action");

  //Fetch Transaction and Update
  const transaction = await getTransactionById(transactionId);
  if (!transaction) return sendResponse(reply, 404, false, "The specified transaction details do not correspond to any record.");

  //Filter body data and update transaction and return
  const updateFields: Record<string, string | boolean | Date> = {};
  Object.entries(request.body).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields[key] = value as string | boolean | Date;
    }
  });
  if (createdAt) updateFields.createdAt = new Date(createdAt);

  const updatedTransaction = await updateTransaction(transactionId, updateFields);
  if (!updatedTransaction) return sendResponse(reply, 404, false, "Transaction not Found");

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Transaction Update",
    target: updatedTransaction.user.toString(),
    metadata: {
      "Transaction Type": updatedTransaction.transactionType,
      "Transaction Method": updatedTransaction.subType,
      Amount: updatedTransaction.amount,
      Status: updatedTransaction.status,
    },
  };
  await newActivity(data);

  return sendResponse(reply, 200, true, "The transaction was updated successfully.", updatedTransaction);
};

//Get User Transaction
export const fetchUserTransactionHandler = async (request: FastifyRequest<{ Body: GetUserTransactionInput; Querystring: PaginationInput }>, reply: FastifyReply) => {

  const { userId, transactionType } = request.body;
  const { page = "1", limit = "20" } = request.query;

  // Check if user exists
  const user = await findUserById(userId);
  if (!user) return sendResponse(reply, 400, false, "The specified user details do not exist in our records.");

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  // Fetch Transactions
  const result = await getUserTransactions(
    userId,
    pageNumber,
    limitNumber,
    transactionType
  );

  return sendResponse(reply, 200, true, "User transactions fetched successfully.", result);
};

//Delete a Transaction
export const deleteUserTransactionHandler = async (request: FastifyRequest<{ Params: FetchTransactionInput }>, reply: FastifyReply) => {

  const decodedAdmin = request.admin!;
  const transactionId = request.params.transactionId;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin) return sendResponse(reply, 400, false, "Sorry, but you are not authorized to perform this action");
  if (admin.role !== "super_admin") return sendResponse(reply, 403, false, "Sorry, you are not authorized enough to perform this action");

  const deleted = await deleteTransaction(transactionId);
  if (!deleted)
    return sendResponse(reply, 404, false, "Transaction Details not Found");

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Transaction Deletion",
    target: deleted.user.toString(),
    metadata: {
      "Transaction Type": deleted.transactionType,
      "Transaction Method": deleted.subType,
      Amount: deleted.amount,
      Status: deleted.status,
    },
  };
  await newActivity(data);

  return sendResponse(reply, 200, true, "Transaction was deleted successfully", deleted);
};
