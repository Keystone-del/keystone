import { Resend } from "resend";
import { RESEND_API, FROM_EMAIL, REPLY_EMAIL } from "../config";

const resend = new Resend(RESEND_API);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      replyTo: REPLY_EMAIL,
    });

    console.log("✅ Email sent via Resend:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to send email via Resend:", error);
    throw error;
  }
}
