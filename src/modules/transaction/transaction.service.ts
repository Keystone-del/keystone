import mongoose from "mongoose";
import TransactionModel, { Initiator, SubType, TransactionDocument, TransactionStatus, TransactionType } from "./transaction.model";

//Schemas
import { CreateTransactionInput } from "./transaction.schema";

//New Transaction
export const createNewTransaction = async (user: string, input: CreateTransactionInput, transactionId: string) => {

  const transactionData: any = {
    ...input,
    user,
    transactionId,
  };

  if (
    transactionData.details &&
    transactionData.details.recipient &&
    mongoose.Types.ObjectId.isValid(transactionData.details.recipient)
  ) {
    transactionData.details.recipient = new mongoose.Types.ObjectId(
      transactionData.details.recipient
    );
  } else if (transactionData.details) {
    transactionData.details.recipient = null;
  }

  const newTransaction = await TransactionModel.create(transactionData);
  return newTransaction;
};

//Fetch all Transactions
export const fetchAllTransactions = async (user: string, page: number = 1, limit: number = 20) => {

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    TransactionModel.find({ user })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TransactionModel.countDocuments({ user }),
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

//Fetch Transactions by Type
export const fetchTransactions = async (user: string, type: string) => {
  const transactions = await TransactionModel.find({ user, type }).sort({
    createdAt: -1,
  });
  return transactions;
};

//Fetch a Particular Transaction
export const getTransactionById = async (id: string) => {
  return await TransactionModel.findById(id);
};

//Get a users last five transactions
export const getLastFiveTransactions = async (user: string) => {
  const transactions = await TransactionModel.find({ user })
    .sort({ createdAt: -1 })
    .limit(5);
  return transactions;
};

//Fetch all transactions with pagination
export const getTransactions = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    TransactionModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "fullName email profilePicture isOnline isVerified isFullyVerified"
      ),
    TransactionModel.countDocuments(),
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

//Fetch a specific user transactions
export const getUserTransactions = async (user: string, page = 1, limit = 20, transactionType?: TransactionType) => {

  const skip = (page - 1) * limit;

  const filter: any = { user };
  if (transactionType) {
    filter.transactionType = transactionType;
  }

  const [transactions, total] = await Promise.all([
    TransactionModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TransactionModel.countDocuments(filter),
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

//Update a transaction
export const updateTransaction = async (id: string, data: Partial<TransactionDocument>) => {

  return await TransactionModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );
};

//Delete a transaction
export const deleteTransaction = async (id: string) => {
  return await TransactionModel.findByIdAndDelete(id);
};

//Get a users balance
export const getUserBalance = async (userId: string, includePending = false) => {

  const objectId = new mongoose.Types.ObjectId(userId);

  // Decide which statuses to include
  const allowedStatuses = includePending
    ? [TransactionStatus.SUCCESSFUL, TransactionStatus.PENDING]
    : [TransactionStatus.SUCCESSFUL];

  // Get matching transactions
  const transactions = await TransactionModel.find({
    status: { $in: allowedStatuses },
    user: objectId,
  });

  let balance = 0;

  for (const txn of transactions) {
    if (txn.transactionType === TransactionType.CREDIT) {
      balance += txn.amount;
    } else if (txn.transactionType === TransactionType.DEBIT) {
      balance -= txn.amount;
    }
  }

  return balance;
};


const INFLOW_POOLS = {
  massive: [
    { desc: "Morgan Stanley Wire Transfer", sub: SubType.WIRE, bank: "Morgan Stanley", name: "Investment Acct" },
    { desc: "Vanguard Asset Liquidation", sub: SubType.WIRE, bank: "Vanguard", name: "Brokerage Acct" },
    { desc: "Sotheby's Auction Proceeds", sub: SubType.TRANSFER, bank: "JPMorgan Chase", name: "Sotheby's Escrow" }
  ],
  large: [
    { desc: "Executive Payroll Deposit", sub: SubType.ACH_CREDIT, bank: "Corporate Bank NA", name: "TechCorp Inc." },
    { desc: "Consulting Retainer", sub: SubType.WIRE, bank: "Bank of America", name: "Client LLC" },
    { desc: "Real Estate Rental Income", sub: SubType.DEPOSIT, bank: "Wells Fargo", name: "Property Mgmt" }
  ],
  medium: [
    { desc: "Charles Schwab Dividend", sub: SubType.INTEREST, bank: "Charles Schwab", name: "Brokerage" },
    { desc: "Coinbase Crypto Sale", sub: SubType.CRYPTO, bank: "Coinbase", name: "Exchange Wallet" },
    { desc: "IRS Tax Refund", sub: SubType.REFUND, bank: "US Treasury", name: "IRS" }
  ],
  small: [
    { desc: "Amex Cash Back Reward", sub: SubType.CASH_BACK, bank: "American Express", name: "Rewards" },
    { desc: "Venmo Transfer from Friend", sub: SubType.TRANSFER, bank: "Venmo", name: "Venmo Balance" },
    { desc: "High Yield Savings Interest", sub: SubType.INTEREST, bank: "Marcus by Goldman Sachs", name: "Savings" }
  ]
};

const OUTFLOW_POOLS = {
  massive: [
    { desc: "Amex Centurion Card Payment", sub: SubType.BILL, bank: "American Express", name: "Amex" },
    { desc: "Capital Gains Tax Payment", sub: SubType.ACH_DEBIT, bank: "US Treasury", name: "IRS" },
    { desc: "Private Jet Charter", sub: SubType.WIRE, bank: "NetJets", name: "NetJets Inc" }
  ],
  large: [
    { desc: "JPMorgan Chase Mortgage", sub: SubType.ACH_DEBIT, bank: "JPMorgan Chase", name: "Mortgage Services" },
    { desc: "Porsche Financial Services", sub: SubType.BILL, bank: "Porsche Financial", name: "Auto Loan" },
    { desc: "Four Seasons Hotel Penthouse", sub: SubType.CHARGE, bank: "Four Seasons", name: "Resorts" },
    { desc: "Rolex Boutique", sub: SubType.CHARGE, bank: "Rolex", name: "Retail" }
  ],
  medium: [
    { desc: "Equinox All-Access Membership", sub: SubType.CHARGE, bank: "Equinox", name: "Health Club" },
    { desc: "Whole Foods Market", sub: SubType.CHARGE, bank: "Whole Foods", name: "Grocery" },
    { desc: "Delta Air Lines First Class", sub: SubType.CHARGE, bank: "Delta", name: "Airlines" },
    { desc: "Apple Store - 5th Ave", sub: SubType.CHARGE, bank: "Apple", name: "Retail" },
    { desc: "Le Bernardin Fine Dining", sub: SubType.CHARGE, bank: "Chase Merchant Services", name: "Restaurant" }
  ],
  small: [
    { desc: "Starbucks Reserve", sub: SubType.CHARGE, bank: "Starbucks", name: "Coffee" },
    { desc: "Uber Black", sub: SubType.CHARGE, bank: "Uber", name: "Transport" },
    { desc: "Netflix Premium", sub: SubType.CHARGE, bank: "Netflix", name: "Subscription" },
    { desc: "Erewhon Market", sub: SubType.CHARGE, bank: "Erewhon", name: "Grocery" },
    { desc: "ATM Withdrawal", sub: SubType.WITHDRAWAL, bank: "Chase ATM", name: "Cash" }
  ]
};

// --- HELPER FUNCTIONS ---

const getMetadata = (amount: number, type: "inflow" | "outflow") => {
  const pools = type === "inflow" ? INFLOW_POOLS : OUTFLOW_POOLS;
  let selectedPool;

  if (amount >= 10000) selectedPool = pools.massive;
  else if (amount >= 2000) selectedPool = pools.large;
  else if (amount >= 300) selectedPool = pools.medium;
  else selectedPool = pools.small;

  return selectedPool[Math.floor(Math.random() * selectedPool.length)];
};

const splitAmountRealistic = (total: number, minParts: number, maxParts: number): number[] => {
  let remaining = total;
  const amounts: number[] = [];
  const parts = Math.floor(Math.random() * (maxParts - minParts + 1)) + minParts;

  for (let i = 0; i < parts - 1; i++) {
    const isLarge = Math.random() > 0.8;
    const max = remaining - (parts - i - 1) * 1;

    let amount = 0;
    if (isLarge) {
      amount = parseFloat((Math.random() * (max * 0.6) + 1).toFixed(2));
    } else {
      amount = parseFloat((Math.random() * (Math.min(max, 500)) + 1).toFixed(2));
    }

    amounts.push(amount);
    remaining -= amount;
  }

  amounts.push(parseFloat(remaining.toFixed(2)));
  return amounts.sort(() => Math.random() - 0.5);
};

// NEW: Dynamically build the details object based on the SubType
const buildTransactionDetails = (meta: any, currentBalance: number, subType: SubType) => {
  const baseDetails = {
    balanceAfterTransaction: currentBalance,
  };

  // SubTypes that represent bank-to-bank movement (Needs Account/Bank info)
  const bankTransferTypes = [
    SubType.WIRE, SubType.TRANSFER, SubType.ACH_DEBIT, SubType.ACH_CREDIT, SubType.BILL, SubType.DEPOSIT
  ];

  if (bankTransferTypes.includes(subType)) {
    return {
      ...baseDetails,
      accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: meta.name,
      bankName: meta.bank,
    };
  }

  // SubTypes like CHARGE, WITHDRAWAL, FEE, CRYPTO, CASH_BACK (No Bank/Account info needed)
  return {
    ...baseDetails,
    fullName: meta.name, // Usually just the Merchant Name (e.g., Starbucks, Uber)
  };
};

// --- MAIN SERVICE EXPORT ---

export const generateRandomTransactions = async (userId: string, totalInflow: number, totalOutflow: number, startDate: string, endDate: string) => {
  
  const transactions: any[] = [];
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1;

  const getRandomDate = () => {
    return new Date(startTimestamp + Math.random() * (endTimestamp - startTimestamp));
  };

  let currentRunningBalance = 0;

  // Generate Inflow (Credits)
  if (totalInflow > 0) {
    const creditAmounts = splitAmountRealistic(totalInflow, 5, 15);

    creditAmounts.forEach((amount) => {
      const meta = getMetadata(amount, "inflow");
      currentRunningBalance += amount;

      transactions.push({
        user: userObjectId,
        transactionType: TransactionType.CREDIT,
        subType: meta.sub,
        description: meta.desc,
        amount: amount,
        details: buildTransactionDetails(meta, currentRunningBalance, meta.sub),
        status: TransactionStatus.SUCCESSFUL,
        transactionId: `TXN-CR-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        initiatedBy: Initiator.SYSTEM,
        createdAt: getRandomDate(),
      });
    });
  }

  // Generate Outflow (Debits)
  if (totalOutflow > 0) {
    const debitAmounts = splitAmountRealistic(totalOutflow, 20, 50);

    debitAmounts.forEach((amount) => {
      const meta = getMetadata(amount, "outflow");
      currentRunningBalance -= amount;

      transactions.push({
        user: userObjectId,
        transactionType: TransactionType.DEBIT,
        subType: meta.sub,
        description: meta.desc,
        amount: amount,
        details: buildTransactionDetails(meta, currentRunningBalance, meta.sub), // Applied the new helper here
        status: TransactionStatus.SUCCESSFUL,
        transactionId: `TXN-DR-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        initiatedBy: Initiator.SYSTEM,
        createdAt: getRandomDate(),
      });
    });
  }

  // Sort chronologically by date
  transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Save to database
  if (transactions.length > 0) {
    await TransactionModel.insertMany(transactions);
  }

  return transactions;
};