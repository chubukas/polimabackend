import express from 'express';
import AuthController from '../controllers/authController';
import { userAccountExist } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/login', AuthController.login);

router.post('/register', [userAccountExist], AuthController.register);

router.post('/forgotpassword', AuthController.sendPasswordResetToken);

router.post('/resetpassword', AuthController.resetPassword);

router.post('/refresh/token', AuthController.refreshToken);

export default router;
