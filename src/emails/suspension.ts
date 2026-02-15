import { baseEmailTheme } from "./theme";

export default ({ name }: { name: string }) => {
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  const subject = "Important Notice Regarding Your Account Access";

  const content = `
    <h1>Temporary Account Restriction</h1>

    <p>Dear ${formattedName},</p>

    <p>
      We are writing to inform you that access to your
      <span class="highlight">Keystone National Bank</span>
      account has been temporarily restricted as part of our standard
      security and risk monitoring procedures.
    </p>

    <p>
      This action may occur when unusual activity is detected or when
      additional review is required to ensure the safety of your account
      and compliance with applicable banking regulations.
    </p>

    <p>
      During this period, certain account functions may be unavailable
      until the review process is completed.
    </p>

    <p>
      If you believe this restriction was applied in error or if you would
      like to request a review, please contact our support team at
      <a href="mailto:support@keystonenationalbank.com.com">support@keystonenationalbank.com.com</a>.
    </p>

    <p>
      We appreciate your cooperation and understanding as we work to
      maintain a secure banking environment for all clients.
    </p>

    <p>
      Sincerely,<br />
      <strong>Keystone National Bank</strong><br />
      Account Security Team
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Important information regarding your account access",
      content,
    }),
  };
};
