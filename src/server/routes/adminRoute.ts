import express from 'express';
import adminController from '../controllers/adminController';
import { adminAccountExist, isAuthorized } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', adminController.getAll);

router.get('/:id', adminController.getSingle);

router.post('/login', adminController.login);

router.post('/register', [adminAccountExist], adminController.register);

router.post('/resetpassword', adminController.resetPassword);

router.post('/forgotpassword', adminController.sendPasswordResetToken);

router.post('/changepassword', [isAuthorized], adminController.changePassword);

router.put('/:adminId', [isAuthorized], adminController.updateProfile);

router.put('/photo/:adminId', [isAuthorized], adminController.uploadPhoto);

router.post('/refresh/token', adminController.refreshToken);

export default router;
