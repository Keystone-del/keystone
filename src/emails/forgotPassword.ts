import { baseEmailTheme } from "./theme";

export default ({ name, verificationCode }: { name: string; verificationCode: string }) => {
  
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  const subject = "Password Reset Verification Code";

  const content = `
    <h1>Password Reset Request</h1>

    <p>Dear ${formattedName},</p>

    <p>
      We received a request to reset the password for your
      <span class="highlight">Keystone National Bank</span> account.
    </p>

    <p>
      To proceed, please use the verification code below to confirm that this
      request was initiated by you.
    </p>

    <p style="
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 2px;
      margin: 20px 0;
      color: #080200;
    ">
      ${verificationCode}
    </p>

    <p>
      If you did not request a password reset, please ignore this message.
      For your security, no changes will be made unless this code is submitted.
    </p>

    <p>
      If you require further assistance, our support team is available to help.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Use this code to reset your Atlantic Bank account password",
      content,
    }),
  };
};
