import config from '../../config/config';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import mailJob from '../jobs/email/emailJob';
import { consumeEmailJob } from '../jobs/email/consumeJob';
import Admin, { IAdmin } from '../models/adminModel';
import {
    IN_VALID_LOGIN,
    NO_USER,
    UPDATE_SUCCESS,
    NOT_FOUND as NOT_FOUND_M,
    STATUS_NOT_AUTHORIZED
} from '../types/messages';
import {
    BAD_REQUEST,
    FORBIDEN,
    NOT_FOUND,
    SERVER_ERROR,
    SUCCESS,
    UNAUTHORIZED
} from '../types/statusCode';
import {
    getAdminFromDatabase,
    getUserFromToken,
    hashPassword,
    adminExist,
    validatePassword,
    singleUpload,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} from '../../utils';

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

interface IPhoto {
    photo: string;
}

export default class adminController<IAuth> {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { password, email, photo, ...rest }: IAdmin = req.body;

            if (password.length < 6)
                return res
                    .status(SERVER_ERROR)
                    .json({ message: 'Password cannot be less than six characters' });

            let photoUri = '';

            const user = new Admin({ email, password, ...rest });

            if (photo) {
                photoUri = await singleUpload({
                    base64: photo,
                    id: `${new Date().getTime()}`,
                    path: 'adminPhoto',
                    type: 'image'
                });
            }
            user.photo = photoUri;
            await user.save();

            // Dispatch email
            const userId = user._id;
            const type = 'Confirm Email';
            const title = 'Thank you for registering with Midlman';
            const emailQueue = new mailJob('emailQueue');
            emailQueue.addJob('EmailVerification', { email, userId, type, title });
            emailQueue.consumeJob('EmailVerification', await consumeEmailJob);

            return res.status(SUCCESS).json({
                message: 'Successfully registered, please proceed to confirm your mail'
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
                    .json({ message: 'Please provide and email and password' });
            }
            const user = await Admin.findOne({ email });
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
            return res.status(NOT_FOUND).json({ message: IN_VALID_LOGIN });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }

    static async sendPasswordResetToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { email }: IAdmin = req.body;
            const accountCheck = await adminExist(email);
            if (!accountCheck) return res.status(NOT_FOUND).json({ message: NO_USER });
            const user = await Admin.findOne({ email });
            if (user) {
                const token = await jwt.sign({ user }, config.auth.jwt, { expiresIn: 60 * 60 * 7 });
                // Dispatch email
                const type = 'Reset Password';
                const title = 'Click below link to reset your password';
                const emailQueue = new mailJob('emailQueue');
                emailQueue.addJob('resetPassword', { email, userId: user._id, token, type, title });
                emailQueue.consumeJob('resetPassword', await consumeEmailJob);
                return res
                    .status(SUCCESS)
                    .json({ message: 'Password reset link have been sent to your email' });
            }
            return res.status(NOT_FOUND).json({ message: NO_USER });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, password } = req.body;
            await Admin.updateOne(
                { _id: userId },
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

    static async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const tokenUser = await getUserFromToken(req);
            if (!tokenUser) {
                return res
                    .status(UNAUTHORIZED)
                    .json({ message: 'User must be logined in to change password' });
            }

            const dbUser = await getAdminFromDatabase(tokenUser.email);

            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res
                    .status(BAD_REQUEST)
                    .json({ message: 'Please provide your old and new password' });
            }
            const isValidPass = await validatePassword(oldPassword, dbUser.password);

            if (isValidPass) {
                const newHashpass = await hashPassword(newPassword);
                const user = await Admin.updateOne(
                    { email: tokenUser.email },
                    {
                        $set: {
                            password: newHashpass
                        }
                    }
                );

                return res.status(SUCCESS).json({ message: 'Successfully updated password.' });
            }
            return res.status(FORBIDEN).json({ message: 'Old password incorrect' });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
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

    static async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { adminId } = req.params;

            const response = await Admin.updateOne({ _id: adminId }, { $set: { ...req.body } });
            if (response.nModified === 1)
                return res.status(SUCCESS).json({ message: UPDATE_SUCCESS });
            return res.status(NOT_FOUND).json({ message: NOT_FOUND_M });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }

    static async uploadPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            const { adminId } = req.params;
            const { photo }: IPhoto = req.body;
            if (!photo) {
                return res
                    .status(BAD_REQUEST)
                    .json({ message: 'Field(s) photo can not be empty.' });
            }

            const photoUri = await singleUpload({
                base64: photo,
                id: `${new Date().getTime()}`,
                path: 'adminPhoto',
                type: 'image'
            });
            const response = await Admin.updateOne({ _id: adminId }, { $set: { photo: photoUri } });

            if (response.nModified === 1)
                return res.status(SUCCESS).json({ message: UPDATE_SUCCESS });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
        }
    }

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const respnose = await Admin.find({});
            return res.status(SUCCESS).json({ respnose });
        } catch (error: any) {
            return res.status(SERVER_ERROR).json({ message: error.message });
        }
    }

    static async getSingle(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const respnose = await Admin.findOne({ _id: id });
            if (!respnose) return res.status(NOT_FOUND).json({ message: NOT_FOUND_M });
            return res.status(SUCCESS).json({ respnose });
        } catch (error: any) {
            return res.status(SERVER_ERROR).json({ message: error.message });
        }
    }
}
