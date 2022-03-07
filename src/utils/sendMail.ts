import nodemailer from 'nodemailer';
import { mailHTML } from './mailHTML';
import config from '../config/config';

// async..await is not allowed in global scope, must use a wrapper
export const sendEmail = async (
    email: string,
    url: string,
    type: string,
    title: string,
    body: string
) => {
    // const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: true, // set to false on localhost
        auth: {
            user: config.mail.user,
            pass: config.mail.pass
        }
    });

    const info = await transporter.sendMail({
        from: config.mail.user,
        to: email,
        subject: `Midlman ${type}`,
        text: url,
        html: mailHTML(url, type, title, body)
    });

    console.log('Message sent: %s', info.messageId);
    // console.log('Preview URL: %s', await nodemailer.getTestMessageUrl(info));
};
