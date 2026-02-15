import { FastifyRequest, FastifyReply } from "fastify";
import { SubType, TransactionType } from "../transaction/transaction.model";

//Services
import {
  createSavings,
  deleteSavings,
  editSavings,
  fetchUserSavings,
  getAllSavings,
  ownsSavings,
} from "./savings.service";
import { findAdminById } from "../admin/admin.service";
import {
  createNewTransaction,
  getUserBalance,
} from "../transaction/transaction.service";
import { newActivity } from "../activity/activity.services";

//Schemas
import {
  CreateSavingsInput,
  DeleteSavingsInput,
  FetchUserSavingsInput,
  WithdrawSavingsInput,
} from "./savings.schema";
import { PaginationInput } from "../general/general.schema";

//Utils
import { sendResponse } from "../../utils/response.utils";
import { generateTransactionHash } from "../../utils/generate";
import { emitAndSaveNotification } from "../../utils/socket";

//Create a new savings
export const createSavingsHandler = async (
  request: FastifyRequest<{ Body: CreateSavingsInput }>,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const userId = decodedDetails._id;
  const data = request.body;

  //Fetch User Balance to make sure the user has that amount
  const userBalance = await getUserBalance(userId);

  if (data.savedAmount > userBalance)
    return sendResponse(
      reply,
      400,
      false,
      "Insufficient Amount, kindly top up your balance to continue."
    );

  //Create new Savings and Transaction
  const newSavings = await createSavings({ user: userId, ...data });

  const transactionId = generateTransactionHash();
  const transactionData = {
    amount: data.savedAmount,
    transactionType: TransactionType.DEBIT,
    subType: SubType.SAVINGS,
    status: "successful",
  };
  const newTransaction = await createNewTransaction(
    userId,
    transactionData,
    transactionId
  );

  //Send Notification
  await emitAndSaveNotification({
    user: userId,
    type: "transaction",
    subtype: TransactionType.DEBIT,
    title: `Savings Deposit`,
    message: `$${newTransaction.amount.toLocaleString()} was deposited to your ${newSavings.title} savings account.`,
    data: {
      transactionId: newTransaction.transactionId,
      amount: newTransaction.amount,
      date: newTransaction.createdAt,
    },
  });

  return sendResponse(
    reply,
    201,
    true,
    "Your savings was initiated successfully",
    newSavings
  );
};

// Top up Savings amount
export const topUpSavingsHandler = async (
  request: FastifyRequest<{ Body: WithdrawSavingsInput }>,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const userId = decodedDetails._id;
  const { amount, savingsId } = request.body;

  //Fetch Savings and User Balance
  const savings = await ownsSavings(savingsId, userId);
  const userBalance = await getUserBalance(userId);
  if (!savings)
    return sendResponse(
      reply,
      400,
      false,
      "We can't find that savings account. Please try again or select a different account."
    );

  if (amount > userBalance)
    return sendResponse(
      reply,
      400,
      false,
      "Insufficient Amount, kindly top up your balance to continue."
    );

  //Update Amount and create transaction
  const editedSavings = await editSavings(savingsId, amount);

  const transactionId = generateTransactionHash();
  const transactionData = {
    amount,
    transactionType: TransactionType.DEBIT,
    subType: SubType.SAVINGS,
    status: "successful",
  };
  const newTransaction = await createNewTransaction(
    userId,
    transactionData,
    transactionId
  );

  //Send Notification
  await emitAndSaveNotification({
    user: userId,
    type: "transaction",
    subtype: TransactionType.DEBIT,
    title: `Savings Deposit`,
    message: `$${newTransaction.amount.toLocaleString()} was deposited to your ${savings.title} savings account.`,
    data: {
      transactionId: newTransaction.transactionId,
      amount: newTransaction.amount,
      date: newTransaction.createdAt,
    },
  });

  return sendResponse(
    reply,
    200,
    true,
    "The savings amount was topped successfully.",
    editedSavings
  );
};

//Withdraw from a Savings
export const withdrawSavingsHandler = async (
  request: FastifyRequest<{ Body: WithdrawSavingsInput }>,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const userId = decodedDetails._id;
  const { amount, savingsId } = request.body;

  //Fetch Savings
  const savings = await ownsSavings(savingsId, userId);
  if (!savings)
    return sendResponse(
      reply,
      400,
      false,
      "We can't find that savings account. Please try again or select a different account."
    );

  //Check if the withdrawal amount is available
  if (amount > savings.savedAmount)
    return sendResponse(
      reply,
      400,
      false,
      "Insufficient balance. Your withdrawal amount is greater than what's available."
    );

  if (
    (savings.targetAmount || savings.endDate) &&
    savings.status !== "completed"
  )
    return sendResponse(
      reply,
      403,
      false,
      "Withdrawal unavailable. This savings account can't be accessed yet."
    );

  //Create a new transaction document and remove the amount from the savings
  const transactionId = generateTransactionHash();
  const amountToRemove = amount * -1;

  const data = {
    amount,
    transactionType: TransactionType.CREDIT,
    subType: SubType.SAVINGS,
    status: "successful",
  };
  await editSavings(savingsId, amountToRemove);
  const newWithdrawal = await createNewTransaction(userId, data, transactionId);

  //Send Notification
  await emitAndSaveNotification({
    user: userId,
    type: "transaction",
    subtype: TransactionType.CREDIT,
    title: `Savings Withdrawal`,
    message: `$${amount.toLocaleString()} was withdrawn from your ${savings.title} savings account.`,
    data: {
      transactionId: newWithdrawal.transactionId,
      amount,
      date: newWithdrawal.createdAt,
    },
  });

  return sendResponse(
    reply,
    200,
    true,
    "Withdrawal complete. Your funds are on the way.",
    newWithdrawal
  );
};

//Fetch a users savings
export const fetchSavingsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const user = decodedDetails._id;

  //Fetch a users savings and return
  const savings = await fetchUserSavings(user);
  return sendResponse(
    reply,
    200,
    true,
    "Your savings was fetched successfully",
    savings
  );
};

//Delete Savings for user
export const deleteSavingsHandler = async (
  request: FastifyRequest<{ Params: DeleteSavingsInput }>,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const user = decodedDetails._id;

  const savingsId = request.params.savingsId;

  //Check if the user owns the savings
  const savings = await ownsSavings(savingsId, user);
  if (!savings)
    return sendResponse(
      reply,
      404,
      false,
      "Savings Details not found, kindly try again."
    );

  if (savings.savedAmount > 0)
    return sendResponse(
      reply,
      403,
      false,
      "Kindly withdraw all the available funds before deleting."
    );

  await deleteSavings(savingsId);
  return sendResponse(
    reply,
    204,
    true,
    "The Savings was deleted successfully."
  );
};

//Admin Handlers

//Fetch all savings
export const fetchAllSavingsHandler = async (
  request: FastifyRequest<{ Querystring: PaginationInput }>,
  reply: FastifyReply
) => {
  const { page = "1", limit = "20" } = request.query;

  //Fetch all Savings
  const response = await getAllSavings(parseInt(page), parseInt(limit));
  return sendResponse(
    reply,
    200,
    true,
    "All the savings was fetched successfully",
    response
  );
};

//Fetch a user savings
export const fetchUserSavingsHandler = async (
  request: FastifyRequest<{ Params: FetchUserSavingsInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const userId = request.params.userId;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      400,
      false,
      "Sorry, but you are not authorized to perform this action"
    );

  const userSavings = await fetchUserSavings(userId);
  return sendResponse(
    reply,
    200,
    true,
    "User savings was fetched successfully",
    userSavings
  );
};

//Delete a user Savings
export const deleteUserSavingsHandler = async (
  request: FastifyRequest<{ Params: DeleteSavingsInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const savingsId = request.params.savingsId;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      400,
      false,
      "Sorry, but you are not authorized to perform this action"
    );
  if (admin.role !== "super_admin")
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you are not authorized enough to perform this action"
    );

  const deleted = await deleteSavings(savingsId);
  if (!deleted)
    return sendResponse(reply, 404, false, "Savings Details Not Found");

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Savings Delete",
    target: deleted.user.toString(),
    metadata: {
      title: deleted.title,
      amount: deleted.savedAmount,
      "Target Amount": deleted.targetAmount ?? "No target amount",
      "Total Interest Accrued": deleted.totalInterestAccrued,
      status: deleted.status,
      "Start Date": deleted.startDate,
    },
  };
  await newActivity(data);

  return sendResponse(
    reply,
    204,
    true,
    "The Savings was deleted successfully."
  );
};
