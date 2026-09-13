const nodemailer = require('nodemailer');

const APP_NAME = 'College-Events-hub';

const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const wrap = (heading, body) => `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #312e81; color: #fff; padding: 18px 24px; font-size: 18px; font-weight: bold;">${APP_NAME}</div>
        <div style="padding: 24px;">
            <h2 style="color: #1e1b4b; margin-top: 0;">${heading}</h2>
            ${body}
        </div>
    </div>
`;

// Tolerate values pasted into a dashboard with stray spaces, newlines or quotes
const cleanEnv = (value) => (value || '').trim().replace(/^['"]+|['"]+$/g, '').trim();

// Brevo's HTTPS API is used in production because Render's free tier blocks SMTP ports.
const sendWithBrevo = async (options) => {
    const apiKey = cleanEnv(process.env.BREVO_API_KEY);
    if (apiKey.startsWith('xsmtpsib-')) {
        throw new Error('BREVO_API_KEY is an SMTP key (xsmtpsib-…). Create an API key (xkeysib-…) under SMTP & API → API Keys.');
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
            sender: { name: APP_NAME, email: cleanEnv(process.env.MAIL_FROM) },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html
        })
    });
    if (!response.ok) {
        throw new Error(`Brevo API ${response.status}: ${await response.text()}`);
    }
};

const sendWithSmtp = (options) => mailer.sendMail({
    from: `${APP_NAME} <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
});

const deliver = async (options) => {
    const provider = cleanEnv(process.env.BREVO_API_KEY) && cleanEnv(process.env.MAIL_FROM)
        ? 'brevo'
        : process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'smtp' : null;

    // In local/dev setups without email credentials, log instead of failing the request
    if (!provider) {
        console.log(`[mail disabled] to=${options.to} subject="${options.subject}"`);
        if (options.debug) console.log(`[mail disabled] ${options.debug}`);
        return;
    }

    try {
        if (provider === 'brevo') await sendWithBrevo(options);
        else await sendWithSmtp(options);
        console.log(`Mail sent via ${provider} to ${options.to}: ${options.subject}`);
    } catch (error) {
        console.error(`Mail delivery via ${provider} failed:`, error.message);
        if (options.debug && process.env.NODE_ENV !== 'production') console.log(`[dev fallback] ${options.debug}`);
    }
};

const sendRegistrationApprovedMail = (studentEmail, studentName, eventTitle) => deliver({
    to: studentEmail,
    subject: `Registration approved: ${eventTitle}`,
    html: wrap(`You're in, ${studentName}!`, `
        <p style="color:#334155;">Your registration for <strong>${eventTitle}</strong> has been approved by the organizers.</p>
        <p style="color:#334155;">See you at the event!</p>
    `)
});

const sendOtpMail = (email, code, purpose) => {
    const isAccount = purpose === 'account_verification';
    const heading = isAccount ? 'Verify your student account' : 'Confirm your event registration';
    const message = isAccount
        ? `Use this code to activate your ${APP_NAME} account.`
        : 'Use this code to confirm your event registration.';

    return deliver({
        to: email,
        subject: `${heading} – ${APP_NAME}`,
        debug: `OTP for ${email} (${purpose}): ${code}`,
        html: wrap(heading, `
            <p style="color:#334155;">${message}</p>
            <div style="margin: 20px 0; padding: 14px; font-size: 26px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #eef2ff; color: #312e81; border-radius: 8px;">${code}</div>
            <p style="color:#94a3b8; font-size: 12px;">This code expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
        `)
    });
};

module.exports = { sendRegistrationApprovedMail, sendOtpMail };
