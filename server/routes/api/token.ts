import jwt from 'jsonwebtoken'
import fs from 'fs';
import { promisify } from 'util';
const writeFile = promisify(fs.writeFile)

export const jwtSecret = 'your_secret_key';

export const generateToken = (payload: any) => {
  const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h', algorithm: 'HS256' });
  saveAdminToken(token);
  return token;
}

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    return null;
  }
}

const saveAdminToken = async (token: string) => {
  const filePath = `C:/token.txt`;
  await writeFile(filePath, token, 'utf8');
};

// Usage:
// const token = generateToken({ userId: 123, role: 'admin' });
// const decoded = verifyToken(token);