import { baseEmailTheme } from "./theme";

export default ({ name, ip, userAgent, location, date }: {
  name: string;
  ip: string;
  userAgent: string;
  location: { city: string; region: string; country: string };
  date: string;
}) => {
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  const subject = "New Login to Your Account";

  const content = `
    <h1>New Login Detected</h1>

    <p>Dear ${formattedName},</p>

    <p>
      We detected a successful login to your
      <span class="highlight">Keystone National Bank</span>
      account with the following details:
    </p>

    <div style="
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
      font-size: 14px;
    ">
      <p><strong>IP Address:</strong> ${ip}</p>
      <p>
        <strong>Location:</strong>
        ${location.city}, ${location.region}, ${location.country}
      </p>
      <p><strong>Device / Browser:</strong> ${userAgent}</p>
      <p><strong>Date & Time:</strong> ${date}</p>
    </div>

    <p>
      If you recognize this activity, no further action is required.
    </p>

    <p>
      If you do not recognize this login, we recommend that you
      reset your password immediately and contact our support team
      for further assistance.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "A new login was detected on your account",
      content,
    }),
  };
};
