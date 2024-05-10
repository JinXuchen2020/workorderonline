import express from 'express';
import { expressjwt } from 'express-jwt';
import workOrderRoutes from './workorders';
import wechatRoutes from './wechat';
import { jwtSecret } from './token';


const router = express.Router();

router.use('/workorders', workOrderRoutes);
router.use(expressjwt({secret: jwtSecret, algorithms: ['HS256']}).unless({path: ['/wechat/login', '/wechat/authurl', '/wechat/qrcode']}));
router.use('/wechat', wechatRoutes);
router.use('/users', wechatRoutes);

export default router;