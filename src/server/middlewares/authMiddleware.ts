import { NextFunction, Request, Response } from 'express';
import { adminExist, userExist, usernameExist } from '../../utils';
import { getUserFromToken } from '../../utils/findUser';
import Admin, { IAdmin } from '../models/adminModel';
import { IUser } from '../models/userModel';
import { ACCOUNT_INACTIVE, USER_EXIST } from '../types/messages';
import { BAD_REQUEST, SERVER_ERROR, UNAUTHORIZED } from '../types/statusCode';

export const isAuthorized = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: ACCOUNT_INACTIVE });
        }
        next();
    } catch (e: any) {
        return res.status(SERVER_ERROR).json({ message: e.message });
    }
};

export const userAccountExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let { email, username }: IUser = req.body;
        let { email }: IUser = req.body;
        let user = await userExist(email);
        // let usernameboolean = await usernameExist(username);

        if (user) {
            return res.status(BAD_REQUEST).json({ message: USER_EXIST });
        }

        // if (usernameboolean) {
        //     return res.status(BAD_REQUEST).json({
        //         message: USERNAME_EXIST
        //     });
        // }
        next();
    } catch (e: any) {
        return res.status(SERVER_ERROR).json({ message: e.message });
    }
};

export const adminAccountExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { email }: IAdmin = req.body;
        let user = await adminExist(email);
        if (user) {
            return res.status(BAD_REQUEST).json({ message: USER_EXIST });
        }
        next();
    } catch (e: any) {
        return res.status(SERVER_ERROR).json({ message: e.message });
    }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { _id } = await getUserFromToken(req);
        const adminExist = await Admin.findById(_id);
        if (!adminExist) {
            return res.status(UNAUTHORIZED).json({ message: 'User must be an admin.' });
        }
        next();
    } catch (e: any) {
        return res.status(SERVER_ERROR).json({ message: e.message });
    }
};
