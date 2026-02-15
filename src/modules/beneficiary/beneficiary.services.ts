import BeneficiaryModel from "./beneficiary.model";

//Schemas
import { CreateBeneficiaryInput } from "./beneficiary.schema";

//Create New Beneficiary
export const createBeneficiary = async (
  data: CreateBeneficiaryInput,
  user: string
) => {
  const newBeneficiary = await BeneficiaryModel.create({ user, ...data });
  return newBeneficiary;
};

//Get a User Beneficiaries
export const getUserBeneficiaries = async (userId: string) => {
  const beneficiaries = await BeneficiaryModel.find({ user: userId });
  return beneficiaries;
};

//Check if a beneficiary belongs to a user
export const ownBeneficiary = async (accountNumber: string, userId: string) => {
  const beneficiary = await BeneficiaryModel.findOne({
    accountNumber,
    user: userId,
  });
  return beneficiary;
};

//Delete Beneficiary
export const deleteBeneficiary = async (
  beneficiaryId: string,
  userId: string
) => {
  return await BeneficiaryModel.findOneAndDelete({
    _id: beneficiaryId,
    user: userId,
  });
};
