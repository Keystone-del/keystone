import SavingsModel, { SavingsStatus } from "./savings.model";

//Schema
import { CreateSavingsInput } from "./savings.schema";

//Create Savings Service
export const createSavings = async (input: CreateSavingsInput) => {
  const newSavings = await SavingsModel.create(input);
  return newSavings;
};

//Fetch a Users Savings
export const fetchUserSavings = async (user: string) => {
  return await SavingsModel.find({ user }).lean();
};

//Fetch all Savings
export const getAllSavings = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await SavingsModel.countDocuments();
  const requests = await SavingsModel.find()
    .populate(
      "user",
      "fullName email profilePicture isOnline isVerified isFullyVerified"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    total,
    page,
    limit,
    data: requests,
  };
};

//Edit a Savings
export const editSavings = async (savingsId: string, amount: number) => {
  return await SavingsModel.findByIdAndUpdate(
    savingsId,
    {
      $inc: { savedAmount: amount },
    },
    { new: true }
  );
};

//Make sure the user owns the savings
export const ownsSavings = async (savingsId: string, userId: string) => {
  return await SavingsModel.findOne({ _id: savingsId, user: userId });
};

//Delete Savings
export const deleteSavings = async (id: string) => {
  return await SavingsModel.findByIdAndDelete(id);
};

//Daily Interest Calculations
export const applyDailyInterest = async () => {
  const activeSavings = await SavingsModel.find({
    status: SavingsStatus.ACTIVE,
  });

  const today = new Date();
  const updatedSavings = [];

  for (const saving of activeSavings) {
    const lastDate = new Date(saving.lastInterestDate);
    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff >= 1) {
      const isFixed = saving.targetAmount || saving.endDate;
      const rate = isFixed ? 0.044 : 0.04; // Annual interest rate
      const dailyRate = rate / 365; // Convert annual rate to daily rate

      // Calculate the new amount using daily compounding interest
      let newAmount = saving.savedAmount;

      for (let i = 0; i < daysDiff; i++) {
        newAmount *= 1 + dailyRate; // Compound interest daily
      }

      const interestAccrued = newAmount - saving.savedAmount; // Calculate total interest accrued

      // Update the saving details
      saving.savedAmount = newAmount; // Update saved amount to the new compounded amount
      saving.totalInterestAccrued += interestAccrued; // Update total interest accrued
      saving.lastInterestDate = today; // Update last interest date

      // Check if target or end date reached
      if (
        typeof saving.targetAmount === "number" &&
        saving.savedAmount >= saving.targetAmount
      ) {
        saving.status = SavingsStatus.COMPLETED;
      }

      updatedSavings.push(saving.save());
    }
  }

  await Promise.all(updatedSavings);
};
