import mongoose, { Schema, Document, model } from "mongoose";

export enum LoanStatus {
  PENDING = "pending",
  REJECTED = "rejected",
  ACTIVE = "active",
  COMPLETED = "completed",
  DEFAULTED = "defaulted",
}

export type LoanDocument = Document & {
  user: mongoose.Types.ObjectId;
  principal: number;
  interestRate: number;
  totalRepayable: number;
  termInMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  approvedAt?: Date;
  collateral?: string;
  documents?: string[];
  dueDates: { dueDate: Date; paid: boolean; amount: number }[];
  createdAt: Date;
  updatedAt: Date;
};

const loanSchema = new Schema<LoanDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    totalRepayable: { type: Number, required: true },
    termInMonths: { type: Number, required: true },
    monthlyPayment: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.PENDING,
    },
    approvedAt: { type: Date },
    collateral: { type: String },
    documents: [{ type: String }],
    dueDates: [
      {
        dueDate: { type: Date },
        paid: { type: Boolean, default: false },
        amount: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export default model<LoanDocument>("Loan", loanSchema);
