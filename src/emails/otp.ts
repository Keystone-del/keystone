import { baseEmailTheme } from "./theme";

interface OtpEmailProps {
  name: string;
  otp: string;
  otpType: string;
}

export default ({ name, otp, otpType }: OtpEmailProps) => {
  
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  const subject = `${otpType} Verification Code`;

  const content = `
    <h1>${otpType} Verification</h1>

    <p>Dear ${formattedName},</p>

    <p>
      Please use the verification code below to complete your
      <strong>${otpType.toLowerCase()}</strong> process for your
      <span class="highlight">Keystone National Bank</span> account.
    </p>

    <div style="
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 4px;
      margin: 24px 0;
      color: #080200;
    ">
      ${otp}
    </div>

    <p>
      This code is valid for a short period and should not be shared with anyone.
    </p>

    <p>
      If you did not request this code, please contact our support team immediately.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: `Your ${otpType.toLowerCase()} verification code`,
      content,
    }),
  };
};
