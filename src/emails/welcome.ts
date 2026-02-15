import { baseEmailTheme } from "./theme";

export default ({ name }: { name: string }) => {
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    html: baseEmailTheme({
      title: "Welcome to Keystone National Bank",
      previewText: "Welcome to secure and modern banking with Atlantic Bank",
      content: `
        <h1>Welcome to Keystone National Bank</h1>

        <p>Dear ${formattedName},</p>

        <p> We are pleased to welcome you to <span class="highlight">Keystone National Bank</span>.</p>
        <p>
          Our goal is to provide secure, transparent, and innovative banking
          solutions that support your financial growth.
        </p>

        <p class="highlight">As a valued client, you can expect:</p>

        <ul>
          <li>Secure access to your accounts anytime</li>
          <li>Reliable transfers and payment services</li>
          <li>24/7 digital banking support</li>
          <li>A dedicated team focused on your success</li>
        </ul>

        <a href="#" class="cta">Access Your Account</a>
      `,
    }),
  };
};
