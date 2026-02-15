import { baseEmailTheme } from "./theme";

type KycEmailParams = {
  name: string;
  status: "accepted" | "rejected";
  reason?: string;
};

export default ({ name, status, reason }: KycEmailParams) => {
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());
  const isApproved = status === "accepted";

  const subject = isApproved
    ? "Your KYC Verification Has Been Approved"
    : "Update on Your KYC Verification";

  const content = `
    <h1>KYC Verification Status</h1>

    <p>Dear ${formattedName},</p>

    ${isApproved
      ? `
          <p>
            We are pleased to inform you that your Know Your Customer (KYC)
            verification with
            <span class="highlight">Keystone National Bank</span>
            has been successfully completed.
          </p>

          <p>
            You now have full access to our banking services and features,
            subject to applicable terms and conditions.
          </p>
        `
      : `
          <p>
            Thank you for submitting your KYC information. After careful review,
            we were unable to complete the verification process at this time.
          </p>
        `
    }

    ${!isApproved && reason
      ? `
          <div style="
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 14px;
            margin: 20px 0;
            font-size: 14px;
          ">
            <strong>Reason for review outcome:</strong><br />
            ${reason}
          </div>
        `
      : ""
    }

    ${!isApproved
      ? `
          <p>
            You may review and resubmit your documents for another verification
            attempt. Please ensure that all information provided is accurate,
            clear, and up to date.
          </p>

          <p>
            If you require assistance, our support team will be happy to help.
          </p>
        `
      : `
          <p>
            Thank you for completing this important step. We appreciate your
            cooperation in helping us maintain a secure banking environment.
          </p>
        `
    }
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Update regarding your KYC verification status",
      content,
    }),
  };
};
