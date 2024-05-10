import jwt from 'jsonwebtoken'

export const jwtSecret = 'your_secret_key';


export const generateToken = (payload: any) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h', algorithm: 'HS256' });
}

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Usage:
// const token = generateToken({ userId: 123, role: 'admin' });
// const decoded = verifyToken(token);