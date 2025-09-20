// lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,// Mailtrap SMTP
    port: process.env.MAILTRAP_PORT ? Number(process.env.MAILTRAP_PORT) : 587,
    secure: Number(process.env.MAILTRAP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAILTRAP_USER, // from your Mailtrap credentials
        pass: process.env.MAILTRAP_PASSWORD,
    },
});

export async function sendMail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        await transporter.sendMail({
            from: '"Ticketing" <no-reply@manilasbkzoverdose.com>',
            to,
            subject,
            html,
        });
    } catch (err) {
        console.error("Failed to send mail:", err);
    }
}
