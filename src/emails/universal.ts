import { baseEmailTheme } from "./theme";

export default ({ name, code, purpose }: { name: string; code: string; purpose: string }) => {

  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `${purpose} Verification Code`;

  const content = `
    <h1>${purpose}</h1>

    <p>Dear ${formattedName},</p>

    <p>
      Please use the verification code below to complete the following request:
      <strong>${purpose}</strong>.
    </p>

    <div style="
      margin: 24px 0;
      padding: 16px;
      background-color: #166B3B;
      border-radius: 8px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #FFFFFF;
      letter-spacing: 4px;
    ">
      ${code}
    </div>

    <p>
      This code is confidential and will expire shortly. Do not share it with
      anyone, including bank staff.
    </p>

    <p>
      If you did not initiate this request, please contact our support team
      immediately.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: `Your ${purpose} verification code`,
      content,
    }),
  };
};
