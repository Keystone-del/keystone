import { baseEmailTheme } from "./theme";

export default ({ name, verificationCode }: { name: string; verificationCode: string }) => {

  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = "Verify Your Email Address";

  const content = `
    <h1>Verify Your Email Address</h1>

    <p>Dear ${formattedName},</p>

    <p>
      Thank you for choosing Keystone National Bank.
      To complete your account setup and help us maintain a secure banking
      environment, please verify your email address using the code below.
    </p>

    <div style="
      margin: 24px 0;
      padding: 16px 24px;
      background-color: #F1FAEF;
      border-radius: 10px;
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #166B3B;
    ">
      ${verificationCode}
    </div>

    <p>
      This verification code will expire in <strong>10 minutes</strong>.
      Please enter it promptly to continue.
    </p>

    <h3>Why this is important</h3>
    <ul>
      <li>Confirm ownership of your email address</li>
      <li>Protect your account from unauthorized access</li>
      <li>Enable full access to our digital banking services</li>
    </ul>

    <p>
      If you did not initiate this request, please disregard this message
      or contact our support team immediately.
    </p>

    <p>
      Sincerely,<br />
      Keystone National Bank Team
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Use this code to verify your email address",
      content,
    }),
  };
};
