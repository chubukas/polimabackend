import { sendEmail, createConfirmationUrl } from '../../../utils';

interface IProps {
    email: string;
    userId: string;
    type: string;
    title: string;
    body: string;
}

export const consumeEmailJob = async ({ email, userId, type, title, body }: IProps) => {
    try {
        await sendEmail(email, await createConfirmationUrl(userId), type, title, body);
    } catch (e: any) {
        throw new Error(e);
    }
};
