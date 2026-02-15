import { baseEmailTheme } from "./theme";

export default ({ name }: { name: string }) => {

  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = "Your Account Access Has Been Restored";

  const content = `
    <h1>Account Access Restored</h1>

    <p>Dear ${formattedName},</p>

    <p>
      We are pleased to inform you that the temporary restriction on your
      Keystone National Bank account has been lifted.
      You now have full access to all banking services and features.
    </p>

    <p>
      This action followed a successful review in line with our security
      and compliance procedures.
    </p>

    <p>
      If you experience any issues or have further questions, please contact
      our support team at
      <a href="mailto:support@atlanticbank.com">support@atlanticbank.com</a>.
    </p>

    <p>
      Thank you for your patience and for choosing Keystone National Bank.
    </p>

    <p>
      Sincerely,<br />
      Keystone National Bank Support Team
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Your account access has been restored",
      content,
    }),
  };
};
