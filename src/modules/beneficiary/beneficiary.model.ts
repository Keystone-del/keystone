import { Schema, model, Document, Types } from "mongoose";

export type BeneficiaryDocument = Document & {
  user: Types.ObjectId;
  fullName: string;
  accountNumber: string;
  bankName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const beneficiarySchema = new Schema<BeneficiaryDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const BeneficiaryModel = model<BeneficiaryDocument>(
  "Beneficiary",
  beneficiarySchema
);
export default BeneficiaryModel;
