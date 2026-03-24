import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@slicing-edge.com';

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  if (!resend) {
    throw new Error('Missing RESEND_API_KEY. Email provider is not configured.');
  }

  const { data, error } = await resend.emails.send({
    from: `Slicing Edge <${FROM_EMAIL}>`,
    to,
    subject,
    react,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export { resend };
export { WelcomeEmail } from './templates/welcome';
export { OrderConfirmationEmail } from './templates/order-confirmation';
export { PasswordResetEmail } from './templates/password-reset';
