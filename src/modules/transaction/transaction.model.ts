import mongoose, { Document, model, Schema } from "mongoose";

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

export enum SubType {
  WITHDRAWAL = "withdrawal",
  WIRE = "wire transfer",
  CHECK = "check",
  BILL = "bill payment",
  ACH_DEBIT = "ACH debit",
  TRANSFER = "transfer",
  CHARGE = "charge",
  FEE = "fee",
  DEPOSIT = "deposit",
  ACH_CREDIT = "ACH credit",
  REFUND = "refund",
  INTEREST = "interest",
  CASH_BACK = "cash back",
  CRYPTO = "cryptocurrency",
  SAVINGS = "savings",
}

export enum TransactionStatus {
  SUCCESSFUL = "successful",
  FAILED = "failed",
  PENDING = "pending",
  REVERSED = "reversed",
  DISPUTED = "disputed",
}

export enum Initiator {
  USER = "user",
  ADMIN = "admin",
  SYSTEM = "system",
}

export type TransactionDocument = Document & {
  user: mongoose.Types.ObjectId;
  transactionType: TransactionType;
  subType: string;
  description: string;
  amount: number;
  details: {
    accountNumber: string;
    recipient: mongoose.Types.ObjectId;
    fullName: string;
    bankName: string;
    otherDetails: string;
    balanceAfterTransaction: number;
  };
  isInternational: boolean;
  bankAddress: string;
  routingNumber: string;
  recipientAddress: string;
  swiftCode: string;
  country: string;
  status: TransactionStatus;
  transactionId: string;
  initiatedBy: "user" | "admin" | "system";
  createdAt: Date;
};

const transactionSchema: Schema = new Schema<TransactionDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  transactionType: {
    type: String,
    enum: Object.values(TransactionType),
    required: true,
  },
  subType: { type: String, enum: Object.values(SubType), required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  details: {
    accountNumber: { type: String },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      default: null,
    },
    fullName: { type: String },
    bankName: { type: String },
    otherDetails: { type: String },
    balanceAfterTransaction: { type: Number },
  },
  isInternational: { type: Boolean, default: false },
  bankAddress: { type: String },
  routingNumber: { type: String },
  recipientAddress: { type: String },
  swiftCode: { type: String },
  country: { type: String },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    required: true,
    default: TransactionStatus.PENDING,
  },
  transactionId: { type: String, required: true, unique: true },
  initiatedBy: {
    type: String,
    enum: Object.values(Initiator),
    default: Initiator.USER,
  },
  createdAt: { type: Date, default: Date.now },
});

const TransactionModel = model<TransactionDocument>(
  "Transaction",
  transactionSchema
);
export default TransactionModel;
