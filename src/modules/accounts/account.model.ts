import { Schema, model, Document, Types } from "mongoose";

export type AccountDocument = Document & {
  fullName: string;
  accountNumber: string;
  bankName: string;
  createdAt: Date;
  updatedAt: Date;
};

const accountSchema = new Schema<AccountDocument>(
  {
    fullName: { type: String, required: true },
    accountNumber: { type: String, required: true, unique: true },
    bankName: { type: String, required: true },
  },
  { timestamps: true }
);

const AccountModel = model<AccountDocument>("Account", accountSchema);

export default AccountModel;
