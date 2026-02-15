import { baseEmailTheme } from "./theme";

type CardRequestEmailParams = {
  name: string;
  status: "successful" | "declined" | "pending";
  date: string;
};

export const cardRequestEmail = ({
  name,
  status,
  date,
}: CardRequestEmailParams) => {
  const formattedName = name.replace(/\b\w/g, (c) => c.toUpperCase());

  const isApproved = status === "successful";
  const isDeclined = status === "declined";

  const subject = isApproved
    ? "Your Card Request Has Been Approved"
    : isDeclined
      ? "Update on Your Card Request"
      : "Your Card Request Is Being Reviewed";

  const content = `
    <h1>
      ${isApproved
      ? "Card Request Approved"
      : isDeclined
        ? "Card Request Update"
        : "Card Request Received"
    }
    </h1>

    <p>Dear ${formattedName},</p>

    ${isApproved
      ? `
          <p>
            We are pleased to inform you that your card request has been
            <span class="highlight">approved</span> on <strong>${date}</strong>.
          </p>

          <p>
            You will receive further instructions regarding card delivery
            and activation shortly. Please ensure that your contact and
            delivery details are up to date.
          </p>
        `
      : isDeclined
        ? `
            <p>
              We regret to inform you that your recent card request was
              <span class="highlight">not approved</span> as of
              <strong>${date}</strong>.
            </p>

            <p>
              This decision was made in accordance with our internal
              assessment and credit policies.
            </p>

            <p>
              If you require clarification or wish to discuss your
              application further, our support team will be happy to assist you.
            </p>
          `
        : `
            <p>
              We confirm receipt of your card request on
              <strong>${date}</strong>.
            </p>

            <p>
              Our team is currently reviewing your application, and you
              will be notified once a decision has been made.
            </p>
          `
    }

    <p>
      Thank you for choosing
      <span class="highlight">Keystone National Bank</span>.
    </p>
  `;

  return {
    subject,
    html: baseEmailTheme({
      title: subject,
      previewText: "Update regarding your card request",
      content,
    }),
  };
};
