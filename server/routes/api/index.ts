import express from 'express';
import workOrderRoutes from './workorders';
import wechatRoutes from './wechat';


const router = express.Router();

router.use('/workorders', workOrderRoutes);
router.use('/wechat', wechatRoutes);

export default router;