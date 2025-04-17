import { JSX } from "hono/jsx";
import { Resend } from "resend";
import { InviteEmailTemplate } from "../emails/orgInviteEmail";

export const getResend = (
  apiKey: string,
  domainEmail = "TaskFlow <taskflow-invite@floo.com.ng>"
) => {
  const resend = new Resend(apiKey);

  const emailSender = {
    send: async (to: string, subject: string, react: JSX.IntrinsicElements) => {
      await resend.emails.send({
        from: domainEmail,
        to: [to],
        subject,
        react,
      });
    },
    orgInvite: async (to: string, orgName: string, inviteUrl: string) => {
      await resend.emails.send({
        from: domainEmail,
        to: [to],
        subject: `You're invited to join ${orgName} on TaskFlow!`,
        react: <InviteEmailTemplate name={orgName} inviteUrl={inviteUrl} />,
      });
    },
  };

  return emailSender;
};

export type EmailSender = ReturnType<typeof getResend>;
// export type EmailSenderType = InstanceType<typeof getResend>;
