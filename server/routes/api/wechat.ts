import express, { Request, Response } from 'express';
import { generateToken } from './token';
const router = express.Router();

const appId = process.env.WE_CHAT_CORP_ID;
const appSecret = process.env.WE_CHAT_CORP_SECRET;
const agentId = process.env.WE_CHAT_AGENT_ID;
const redirectUri = process.env.WE_CHAT_REDIRECT_URI;

const getAccessToken = async (code : string) => {
  const getTokenUrl=`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WE_CHAT_CORP_ID}&secret=${process.env.WE_CHAT_CORP_SECRET}&code=${code}&grant_type=authorization_code`;

  const tokenRsp = await fetch(getTokenUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const tokenData = await tokenRsp.json();
  
  if (tokenRsp.ok) {
    const { access_token, openid, expires_in } = tokenData;
    return {
      access_token,
      openid,
      expires_in
    };
  }
  else {
    return {
      ...tokenData
    };
  }
}

const getUserInfo = async (accessToken : string, openid : string) => {
  const getUserInfoUrl=`https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}`;

  const userRsp = await fetch(getUserInfoUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const data = await userRsp.json();

  if (userRsp.ok) {
    const { openid, nickname } = data;
    return {
      openid,
      nickname
    };
  }
  else {
    return {
      ...data
    };
  }
}

router.get('/qrcode', (req : Request, res : Response) => {
  const data = `https://open.weixin.qq.com/connect/qrconnect?appid=${process.env.WE_CHAT_CORP_ID}&redirect_uri=${process.env.WE_CHAT_REDIRECT_URI}&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect`;
  res.json({
    data: data,
    code: 200,
    success: true,
    message: 'Successfully'
  });
});

router.get('/authurl', (req : Request, res : Response) => {
  const data = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.WE_CHAT_CORP_ID}&redirect_uri=${process.env.WE_CHAT_REDIRECT_URI}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
  res.json({
    data: data,
    code: 200,
    success: true,
    message: 'Successfully'
  });
});

router.get('/login', async (req : Request, res : Response) => {
  const { code } = req.query;
  const accessToken = await getAccessToken(code as string);
  if (!accessToken || accessToken.errcode){
    res.json({
      data: null,
      code: 500,
      success: false,
      message: `Failed to login, Error: ${accessToken.errmsg}`
    });
  }

  const { access_token, openid, expires_in } = accessToken;
  const userInfo = await getUserInfo(access_token, openid);

  if (userInfo.errcode){
    res.json({
      data: null,
      code: 500,
      success: false,
      message: `Failed to login, Error: ${userInfo.errmsg}`
    });
  }

  const { nickname } = userInfo;
  const payload = {
    openid,
    nickname,
    role: openid === process.env.ADMIN_USER_ID ? 'admin' : 'user',
    expires_in
  };

  const token = generateToken(payload);

  res.json({
    data: token,
    code: 200,
    success: true,
    message: 'Successfully'
  });
});

router.post('/login-test', async (req : Request, res : Response) => {
  const { openid, nickname } = req.body;
  const expires_in = 7200;
  const payload = {
    openid,
    nickname,
    role: openid === process.env.ADMIN_USER_ID ? 'admin' : 'user',
    expires_in
  };

  const token = generateToken(payload);

  res.json({
    data: token,
    code: 200,
    success: true,
    message: 'Successfully'
  });
});
export default router;
