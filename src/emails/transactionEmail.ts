import { baseEmailTheme } from "./theme";

export default ({ name, amount, date, transactionId, description, balance, type, subType }: {
  name: string; amount: number; date: string; transactionId: string; description: string; balance: number; type: string; subType: string
}) => {

  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = "Transaction Notification";

  const content = `
    <h1>Transaction Alert</h1>

    <p>Dear ${formattedName},</p>

    <p>
      This is to notify you of a recent transaction on your
      <span class="highlight">Keystone National Bank</span> account.
    </p>

    <div style="
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
      font-size: 14px;
    ">
      <p><strong>Transaction Type:</strong> ${type}</p>
      <p><strong>Method:</strong> ${subType}</p>
      <p><strong>Amount:</strong> $${amount.toLocaleString()}</p>
      <p><strong>Description:</strong> ${description || "Not provided"}</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
      <p><strong>Date & Time:</strong> ${date}</p>
      <p><strong>Available Balance:</strong> $${balance.toLocaleString()}</p>
    </div>

    <p>
      If you recognize this transaction, no further action is required.
    </p>

    <p>
      If you do not recognize this activity, please contact our support team
      immediately for assistance.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "A recent transaction was recorded on your account",
      content,
    }),
  };
};
