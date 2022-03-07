import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import {
    getUserFromDatabase,
    getUserFromToken,
    userExist,
    validatePassword,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} from '../../utils';
import { consumeEmailJob } from '../jobs/email/consumeJob';
import mailJob from '../jobs/email/emailJob';
import { IN_VALID_LOGIN, NO_USER, STATUS_NOT_AUTHORIZED } from '../types/messages';
import { BAD_REQUEST, NOT_FOUND, SERVER_ERROR, SUCCESS, UNAUTHORIZED } from '../types/statusCode';
import User, { IUser } from './../models/userModel';
import { singleUpload, validateEmail } from '../../utils';

interface IAuth<T> {
    login: () => T;
    register: () => T;
    sendPasswordResetToken: () => T;
    resetPassword: () => T;
}

interface ILogin {
    email: string;
    password: string;
}

interface IPortal extends IUser {
    cacDoc: string;
    licenseDoc: string;
}

export default class AuthController<IAuth> {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { password, email, photo, ...rest }: IUser = req.body;

            let pix;

            if (photo) {
                pix = await singleUpload({
                    base64: photo,
                    id: `${new Date().getTime()}`,
                    path: 'user',
                    type: 'image'
                });
            }

            const registerUser = new User({
                email,
                password,
                photo: pix,
                ...rest
            });

            const user = await registerUser.save();

            const token = await signAccessToken(user);
            const refreshToken = await signRefreshToken(user);

            // Dispatch email
            const userId = user._id;
            const type = 'Confirm Email';
            const title = 'Thank you for registering with Midlman';
            const emailQueue = new mailJob('emailQueue');
            emailQueue.addJob('EmailVerification', { email, userId, type, title });
            emailQueue.consumeJob('EmailVerification', await consumeEmailJob);

            return res.status(SUCCESS).json({
                message: 'Successfully registered, please proceed to confirm your mail',
                token,
                refreshToken,
                user
            });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password }: ILogin = req.body;

            if (!email || !password) {
                return res
                    .status(BAD_REQUEST)
                    .json({ message: 'Please provide an email or username and password' });
            }

            const isEmail = validateEmail(email);

            let user;

            if (isEmail) {
                user = await User.findOne({ email: email });
            }

            if (user.active === false)
                return res.status(BAD_REQUEST).json({ message: STATUS_NOT_AUTHORIZED });

            if (user) {
                const isPasswordValid = await validatePassword(password, user.password);
                if (!isPasswordValid)
                    return res.status(BAD_REQUEST).json({ message: IN_VALID_LOGIN });
                const token = await signAccessToken(user);
                const refreshToken = await signRefreshToken(user);
                return res.status(SUCCESS).json({ token, refreshToken, user });
            }
            return res.status(NOT_FOUND).json({ message: NO_USER });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }

    static async sendPasswordResetToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { email }: IUser = req.body;
            const accountCheck = await userExist(email);
            if (!accountCheck) return res.status(NOT_FOUND).json({ message: NO_USER });
            const user = await User.findOne({ email });
            if (user) {
                const token = await jwt.sign({ user }, config.auth.jwt, { expiresIn: 60 * 60 * 7 });
                // Dispatch email
                const type = 'Reset Password';
                const title = 'Click below link to reset your password';
                const emailQueue = new mailJob('emailQueue');
                emailQueue.addJob('resetPassword', { email, token, type, title });
                emailQueue.consumeJob('resetPassword', await consumeEmailJob);
                return res
                    .status(SUCCESS)
                    .json({ message: 'Password reset link have been sent to your email' });
            }
            return res.status(NOT_FOUND).json({ message: NO_USER });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e });
        }
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password }: IUser = req.body;
            await User.updateOne(
                { email },
                {
                    $set: {
                        password: password
                    }
                }
            );
            return res.status(SUCCESS).json({ message: 'Successfully reset password.' });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e });
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { userRefreshToken } = req.body;
            if (!userRefreshToken)
                return res
                    .status(BAD_REQUEST)
                    .json({ message: 'Field refreshToken must not be empty.' });

            const user = await verifyRefreshToken(userRefreshToken);

            const accessToken = await signAccessToken(user);

            const refreshToken = await signRefreshToken(user);
            return res.status(SUCCESS).json({ accessToken, refreshToken });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }
}
