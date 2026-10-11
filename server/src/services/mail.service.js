import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger.js';

const log = createLogger('mail.service');
// SMTP settings come from server/.env (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, MAIL_FROM).
// Without SMTP_HOST, emails are not delivered: in development their text is logged so links can be tested;
// in production only an error is logged.
const smtpConfigured = Boolean(process.env.SMTP_HOST);
const transport = smtpConfigured
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    })
    : null;
const from = process.env.MAIL_FROM || 'Campus LMS <no-reply@campus.local>';
// Messages sent while NODE_ENV=test, so tests can read reset links.
export const testOutbox = [];

export async function sendMail({ to, subject, text, html }) {
    if (process.env.NODE_ENV === 'test') {
        testOutbox.push({ to, subject, text });
        return;
    }
    if (!transport) {
        if (process.env.NODE_ENV === 'production')
            log.error('SMTP is not configured; email not sent', { subject });
        else
            log.warn('SMTP is not configured; development email follows', { to, subject, text });
        return;
    }
    await transport.sendMail({ from, to, subject, text, html });
    log.info('Email sent', { subject });
}
