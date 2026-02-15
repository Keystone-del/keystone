import { Types } from "mongoose";
import TransactionModel, {
  TransactionType,
  TransactionStatus,
  Initiator,
  SubType,
} from "./transaction.model";

import { randomUUID } from "crypto";

const creditSubtypes: SubType[] = [
  SubType.DEPOSIT,
  SubType.ACH_CREDIT,
  SubType.REFUND,
  SubType.INTEREST,
  SubType.CASH_BACK,
  SubType.CRYPTO,
  SubType.SAVINGS,
];

const debitSubtypes: SubType[] = [
  SubType.WITHDRAWAL,
  SubType.WIRE,
  SubType.CHECK,
  SubType.BILL,
  SubType.ACH_DEBIT,
  SubType.TRANSFER,
  SubType.CHARGE,
  SubType.FEE,
  SubType.CRYPTO,
  SubType.SAVINGS,
];

const noDetailsSubtypes: SubType[] = [SubType.FEE, SubType.CHARGE];

const cryptoCoins = ["BTC", "ETH", "USDT", "XRP", "SOL"];

const allStatuses = Object.values(TransactionStatus);
const allInitiators = Object.values(Initiator);

// Utility to get random item
const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

type GenerateOptions = {
  userId: Types.ObjectId;
  recipientId?: Types.ObjectId;
  startAmount: number;
  endAmount: number;
  numberOfTransactions?: number;
};

export async function generateTransactions({
  userId,
  recipientId = new Types.ObjectId(),
  startAmount,
  endAmount,
  numberOfTransactions = 10,
}: GenerateOptions): Promise<void> {
  let currentBalance = startAmount;
  const totalDelta = endAmount - startAmount;

  // Generate random deltas
  const deltas: number[] = [];
  for (let i = 0; i < numberOfTransactions - 1; i++) {
    const delta =
      Math.floor(Math.random() * (totalDelta / 2)) *
      (Math.random() > 0.5 ? 1 : -1);
    deltas.push(delta);
  }

  // Ensure final balance matches
  const sumSoFar = deltas.reduce((a, b) => a + b, 0);
  deltas.push(totalDelta - sumSoFar);

  const transactions = deltas.map((delta) => {
    const isCredit = delta >= 0;
    const amount = Math.abs(delta);
    const transactionType = isCredit
      ? TransactionType.CREDIT
      : TransactionType.DEBIT;
    const subType = isCredit
      ? randomItem(creditSubtypes)
      : randomItem(debitSubtypes);

    currentBalance += delta;

    const transaction: any = {
      user: userId,
      transactionType,
      subType,
      description: `${transactionType.toUpperCase()} (${subType}) of $${amount}`,
      amount,
      level: "tax",
      status: randomItem(allStatuses),
      transactionId: randomUUID(),
      initiatedBy: randomItem(allInitiators),
      createdAt: randomPastDateWithin(90),
    };

    // Set details based on subType
    if (noDetailsSubtypes.includes(subType)) {
      // No details field at all
      transaction.details = undefined;
    } else if (subType === SubType.CRYPTO) {
      const walletAddress = `0x${randomUUID().replace(/-/g, "").slice(0, 40)}`;
      const coin = randomItem(cryptoCoins);
      const price = (Math.random() * 40000 + 1000).toFixed(2);

      transaction.details = {
        accountNumber: walletAddress,
        recipient: null,
        fullName: "Wallet Owner",
        bankName: coin,
        otherDetails: `1 ${coin} = $${price}`,
        balanceAfterTransaction: currentBalance,
      };
    } else {
      // Default: full banking transaction
      transaction.details = {
        accountNumber: "123456789",
        recipient: recipientId,
        fullName: "Jane Doe",
        bankName: "Mock Bank",
        otherDetails: "Auto-generated transaction",
        balanceAfterTransaction: currentBalance,
      };
    }

    return transaction;
  });

  await TransactionModel.insertMany(transactions);

  console.log(`✅ Created ${transactions.length} diversified transactions.`);
}

function randomPastDateWithin(daysBack: number): Date {
  const now = new Date();
  return new Date(
    now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000
  );
}
