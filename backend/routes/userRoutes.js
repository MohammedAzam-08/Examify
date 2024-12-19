import express from 'express';
import { authUser, registerUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', authUser);
import { getUsers } from '../controllers/userController.js';

router.get('/', getUsers);
router.post('/', registerUser);

export default router;