import TransactionModel, {
  Initiator,
  SubType,
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.model";
import LoanModel, { LoanStatus } from "./loan.model";

//Services
import { getUserBalance } from "../transaction/transaction.service";

//Schemas
import { CreateLoanInput, UpdateLoanInput } from "./loan.schema";

//Utils
import { generateTransactionHash } from "../../utils/generate";

// Create a new loan
export const createLoan = async (user: string, input: CreateLoanInput) => {
  const { principal, interestRate, termInMonths, collateral, documents } =
    input;

  const totalRepayable = principal + principal * (interestRate / 100);
  const monthlyPayment = totalRepayable / termInMonths;

  const dueDates = Array.from({ length: termInMonths }).map((_, i) => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return { dueDate, paid: false, amount: monthlyPayment };
  });

  return await LoanModel.create({
    user,
    principal,
    interestRate,
    totalRepayable,
    termInMonths,
    monthlyPayment,
    collateral,
    documents,
    dueDates,
    status: LoanStatus.PENDING,
  });
};

//Get all loans
export const getLoans = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    LoanModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "fullName email profilePicture isOnline isVerified isFullyVerified"
      ),
    LoanModel.countDocuments(),
  ]);

  return {
    data: transactions,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

// Read all loans for a user
export const getLoansByUser = async (userId: string) => {
  return await LoanModel.find({ user: userId }).sort({ createdAt: -1 });
};

//Check Active or Pending Loan
export const checkPendingOrActiveLoan = async (userId: string) => {
  return await LoanModel.findOne({
    user: userId,
    status: { $in: [LoanStatus.PENDING, LoanStatus.ACTIVE] },
  });
};

// Get single loan
export const getLoanById = async (loanId: string) => {
  return await LoanModel.findById(loanId);
};

// Admin Services

// Update loan status
export const updateLoanStatus = async (input: UpdateLoanInput) => {
  const { loanId, status } = input;
  const update: any = { status };

  if (status === LoanStatus.ACTIVE) {
    update.approvedAt = new Date();

    const loan = await LoanModel.findById(loanId);
    if (!loan) throw new Error("Loan not found");

    // Calculate updated balance
    const newBalance =
      (await getUserBalance(loan.user.toString())) + loan.principal;

    await TransactionModel.create({
      user: loan.user,
      transactionType: TransactionType.CREDIT,
      subType: SubType.DEPOSIT,
      description: "Loan Disbursement",
      amount: loan.principal,
      details: {
        accountNumber: "N/A",
        recipient: loan.user,
        fullName: "Loan Disbursement",
        bankName: "Internal Bank",
        otherDetails: "Loan Disbursed",
        balanceAfterTransaction: newBalance,
      },
      status: TransactionStatus.SUCCESSFUL,
      transactionId: generateTransactionHash(),
      initiatedBy: Initiator.SYSTEM,
      createdAt: new Date(),
    });
  }

  return await LoanModel.findByIdAndUpdate(loanId, update, { new: true });
};

//Fetch all loan requests
export const getLoanRequests = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await LoanModel.countDocuments();
  const requests = await LoanModel.find()
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

// Delete a loan
export const deleteLoan = async (loanId: string) => {
  return await LoanModel.findByIdAndDelete(loanId);
};
