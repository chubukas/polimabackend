import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/userModel';
import {
    SERVER_ERROR,
    SUCCESS,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDEN,
    NOT_FOUND
} from '../types/statusCode';
import {
    getUserFromToken,
    singleUpload,
    hashPassword,
    validatePassword,
    getUserFromDatabase
} from '../../utils';
import { UPDATE_SUCCESS, NOT_FOUND as NOT_FOUND_M } from '../types/messages';

export default class UserController {
    static async editProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { fullName, phone, photo, gender, address }: IUser = req.body;

            const reqUser = await getUserFromToken(req);
            const user = await User.findOne({ _id: reqUser._id });

            let profilePhoto;

            if (photo) {
                profilePhoto = await singleUpload({
                    base64: photo,
                    id: `${new Date().getTime()}`,
                    path: 'user',
                    type: 'image'
                });
            }

            if (user) {
                user.fullName = fullName ? fullName : user.fullName;
                user.address = address ? address : user.address;
                user.gender = gender ? gender : user.gender;
                user.phone = phone ? phone : user.phone;
            }

            const updatedUser = await user.save();

            return res.status(SUCCESS).json({ message: UPDATE_SUCCESS, updatedUser });
        } catch (e: any) {
            return res.status(SERVER_ERROR).json({ message: e.message });
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

            const dbUser = await getUserFromDatabase(tokenUser.email);

            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res
                    .status(BAD_REQUEST)
                    .json({ message: 'Please provide your old and new password' });
            }
            const isValidPass = await validatePassword(oldPassword, dbUser.password);

            if (isValidPass) {
                const newHashpass = await hashPassword(newPassword);
                const user = await User.updateOne(
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

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const respnose = await User.find({});
            return res.status(SUCCESS).json({ respnose });
        } catch (error: any) {
            return res.status(SERVER_ERROR).json({ message: error.message });
        }
    }

    static async getSingle(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const respnose = await User.findOne({ _id: id });
            if (!respnose) return res.status(NOT_FOUND).json({ message: NOT_FOUND_M });
            return res.status(SUCCESS).json({ respnose });
        } catch (error: any) {
            return res.status(SERVER_ERROR).json({ message: error.message });
        }
    }
}
