import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

if (env.EMAIL_USER && env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: `"ShikshaSetu Platform" <${env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`📧 Email sent to: ${options.to}`);
      return true;
    }

    // Fallback: If Resend API Key is available
    if (env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.RESEND_FROM || 'onboarding@resend.dev',
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });
      if (response.ok) {
        console.log(`📧 Email sent via Resend to: ${options.to}`);
        return true;
      }
    }

    console.log(`⚠️ Email mock sent to: ${options.to} (Subject: ${options.subject})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};
