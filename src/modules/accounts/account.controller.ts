import { FastifyReply, FastifyRequest } from "fastify";

//Services
import { findAdminById } from "../admin/admin.service";
import { newActivity } from "../activity/activity.services";

//Schemas
import {
  CreateAccountInput,
  DeleteAccountInput,
  EditAccountInput,
  GetAccountInput,
} from "./account.schema";
import { PaginationInput } from "../general/general.schema";

//Utils
import { sendResponse } from "../../utils/response.utils";
import {
  createAccount,
  deleteAccount,
  editAccount,
  fetchAccounts,
  findAccount,
} from "./account.service";

//Fetch an account by account number
export const fetchAccountHandler = async (
  request: FastifyRequest<{ Params: GetAccountInput }>,
  reply: FastifyReply
) => {
  const accountNumber = request.params.accountNumber;

  //Fetch account details if existing
  const account = await findAccount(accountNumber);

  //Return adequate responses
  if (!account)
    return sendResponse(
      reply,
      404,
      false,
      "Couldn't fetch account details, try again later."
    );
  return sendResponse(
    reply,
    200,
    true,
    "Account details was fetched successfully",
    account
  );
};

//Admin Endpoints

//Create new Account
export const CreateAccountHandler = async (
  request: FastifyRequest<{ Body: CreateAccountInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );

  //Make sure account doesn't exist already
  const exists = await findAccount(request.body.accountNumber);
  if (exists)
    return sendResponse(
      reply,
      409,
      false,
      "An account with this account number already exists"
    );

  //Create Account, add it to the activity and return
  const newAccount = await createAccount(request.body);

  const data = {
    admin: admin._id as unknown as string,
    action: "Created new account",
    metadata: {
      accountName: newAccount.fullName,
      bank: newAccount.bankName,
      accountNumber: newAccount.accountNumber,
    },
  };
  await newActivity(data);
  return sendResponse(
    reply,
    201,
    true,
    "Account was created successfully",
    newAccount
  );
};

//Edit Account
export const editAccountHandler = async (
  request: FastifyRequest<{ Body: EditAccountInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );

  //Edit account and return response;
  const editedAccount = await editAccount(request.body);
  if (!editedAccount)
    return sendResponse(reply, 400, false, "Account not found.");

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Edited an existing account",
    metadata: {
      accountName: editedAccount.fullName,
      bank: editedAccount.bankName,
      accountNumber: editedAccount.accountNumber,
    },
  };
  await newActivity(data);

  return sendResponse(
    reply,
    200,
    true,
    "Account was edited successfully",
    editedAccount
  );
};

//Delete Account
export const deleteAccountHandler = async (
  request: FastifyRequest<{ Params: DeleteAccountInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );

  //Delete Account and return response
  const deletedAccount = await deleteAccount(request.params.id);
  if (!deletedAccount)
    return sendResponse(reply, 404, false, "Account not found");

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Deleted an existing account",
    metadata: {
      accountName: deletedAccount.fullName,
      bank: deletedAccount.bankName,
      accountNumber: deletedAccount.accountNumber,
    },
  };
  await newActivity(data);

  return sendResponse(reply, 204, true, "Account was deleted successfully.");
};

//Fetch All Account
export const fetchAccountsHandler = async (
  request: FastifyRequest<{ Querystring: PaginationInput }>,
  reply: FastifyReply
) => {
  const page = parseInt(request.query.page ?? "1");
  const limit = parseInt(request.query.limit ?? "20");
  const decodedAdmin = request.admin!;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      400,
      false,
      "Sorry, but you are not authorized to perform this action"
    );

  const accounts = await fetchAccounts(page, limit);
  return sendResponse(
    reply,
    200,
    true,
    "All accounts accounts was fetched successfully",
    accounts
  );
};
