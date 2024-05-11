import express, { Request, Response } from 'express';
const router = express.Router();

router.get('/me', async (req : Request, res : Response) => {
  const result: any = (req as any).user;
  res.json({
    data: result,
    code: 200,
    success: true,
    message: 'Successfully'
  });
});
export default router;
