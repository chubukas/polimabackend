import express from 'express';
import UserController from '../controllers/userController';
import { isAuthorized } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', UserController.getAll);
router.get('/:id', UserController.getSingle);
router.put('/profile', [isAuthorized], UserController.editProfile);
router.put('/password', [isAuthorized], UserController.changePassword);

export default router;
