import express from 'express';
import { expressjwt } from 'express-jwt';
import workOrderRoutes from './workorders';
import wechatRoutes from './wechat';
import usersRoutes from './users';
import { jwtSecret } from './token';


const router = express.Router();

router.use(expressjwt({secret: jwtSecret, algorithms: ['HS256'], requestProperty: 'user'}).unless({path: [/\/wechat\/.*/]}));
router.use('/workorders', workOrderRoutes);
router.use('/wechat', wechatRoutes);
router.use('/users', usersRoutes);

export default router;