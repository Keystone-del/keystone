import { baseEmailTheme } from "./theme";

export default ({ name }: { name: string }) => {
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  const subject = "Your Account Has Been Fully Verified";

  const content = `
    <h1>Account Verification Complete</h1>

    <p>Dear ${formattedName},</p>

    <p>
      We are pleased to inform you that your
      <span class="highlight">Keystone National Bank</span>
      account has been successfully verified.
    </p>

    <p>
      You now have full access to our complete range of banking services,
      designed to help you manage and grow your finances securely and
      efficiently.
    </p>

    <p class="highlight">You can now enjoy:</p>

    <ul>
      <li>Full access to your account dashboard and transaction history</li>
      <li>Secure transfers, deposits, and withdrawals</li>
      <li>24/7 access through our online and mobile banking platforms</li>
      <li>Dedicated customer support whenever you need assistance</li>
    </ul>

    <a href="#" class="cta">Access Your Account</a>

    <p>
      Thank you for choosing
      <span class="highlight">Keystone National Bank</span>.
      We look forward to supporting your financial journey.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Your Atlantic Bank account is now fully verified",
      content,
    }),
  };
};
