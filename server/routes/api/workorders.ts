import express, { Request, Response } from 'express';
import fs from 'fs';
import { promisify } from 'util';
const router = express.Router();

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const readJsonFile = async (fileName: string) => {
  let path = `./workorders/${fileName}.json`;
  if(!fs.existsSync(path)){
    path = `./public/template.json`;
  }
  const data = await readFile(path, 'utf8');
  return JSON.parse(data);
};

const writeJsonFile = async (fileName: string, data: any) => {
  const dataStr = JSON.stringify(data);  
  const filePath = `./workorders/${fileName}.json`;
  if(!fs.existsSync(filePath)){
    fs.mkdirSync('./workorders', { recursive: true });
  }
  await writeFile(filePath, dataStr, 'utf8');
};

router.get('/', async (req : Request, res : Response) => {
  let result: any = {}
  fs.readdir('./workorders', (err, files) => {
    Promise.all(files.sort().map(async file => {
      const data = await readFile(`./workorders/${file}`, 'utf8');
      result[file.replace('.json', '')] = JSON.parse(data);
    })).then(() => {      
      res.json({
        data: result,
        code: 200,
        success: true,
        message: 'Get all work order data successfully'
      });
    });
  });
});

/* GET users listing. */
router.get('/:userName', async <T> (req : Request, res : Response) => {
  const userName = req.params.userName;
  const data = await readJsonFile(userName);
  res.json({
    data: data as T,
    code: 200,
    success: true,
    message: 'Get work order data successfully'
  });
});

router.post('/:userName', async <T> (req : Request, res : Response) => {
  const userName = req.params.userName;
  const data = req.body;
  await writeJsonFile(userName, data);
  res.json({
    data: null,
    code: 200,
    success: true,
    message: 'update work order data successfully'
  });
});
export default router;
