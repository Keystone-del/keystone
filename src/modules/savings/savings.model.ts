import mongoose, { model, Document, Schema } from "mongoose";

export enum SavingsStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface SavingsDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  targetAmount?: number;
  savedAmount: number;
  interestRate: number;
  startDate: Date;
  endDate?: Date;
  totalInterestAccrued: number;
  lastInterestDate: Date;
  status: SavingsStatus;
  createdAt: Date;
  updatedAt: Date;
}

const savingsSchema = new Schema<SavingsDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    targetAmount: { type: Number },
    savedAmount: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    totalInterestAccrued: { type: Number, default: 0 },
    lastInterestDate: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: Object.values(SavingsStatus),
      default: SavingsStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

const SavingsModel = model<SavingsDocument>("Savings", savingsSchema);

export default SavingsModel;
