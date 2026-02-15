import AccountModel, { AccountDocument } from "./account.model";
import { FilterQuery } from "mongoose";

//Schemas
import { CreateAccountInput, EditAccountInput } from "./account.schema";

//Create Account
export const createAccount = async (input: CreateAccountInput) => {
  const account = await AccountModel.create(input);
  return account;
};

//Find user by ID
export const findAccountById = async (id: string) => {
  const account = await AccountModel.findById(id).lean();
  return account;
};

//Find account by Account Number
export const findAccount = async (accountNumber: string) => {
  const account = await AccountModel.findOne({ accountNumber });
  return account;
};

//Edit Account
export const editAccount = async (input: EditAccountInput) => {
  const { accountId, ...rest } = input;

  // Prepare update object
  const updateFields: Partial<typeof input> = { ...rest };

  const updatedAccount = await AccountModel.findOneAndUpdate(
    { _id: accountId },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  return updatedAccount;
};

//Delete Account
export const deleteAccount = async (id: string) => {
  return await AccountModel.findOneAndDelete({
    _id: id,
  });
};

//Fetch all accounts
export const fetchAccounts = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [accounts, total] = await Promise.all([
    AccountModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    AccountModel.countDocuments(),
  ]);

  return {
    data: accounts,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};
