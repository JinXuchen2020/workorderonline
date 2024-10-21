import { isWxBrowser } from ".";
import { IUserReqModel } from "../models";

const apiUrl = import.meta.env.VITE_API_URL;

const getUrl = (path: string) => {
  if(apiUrl){
    return `${apiUrl}${path}`;
  }
  return path;
};

// route to get logged in user's info (needs the token)
export const getMe = () => {
  const token = sessionStorage.getItem("token");
  return fetch(getUrl('/api/users/me'), {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
};

export const createUser = (input: IUserReqModel) => {
  return fetch(getUrl('/api/users'), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
};

export const getQRCode = () => {
  return fetch(getUrl("/api/wechat/qrcode"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getAuthUrl = () => {
  return fetch(getUrl("/api/wechat/authurl"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const loginWechatUser = (code: string) => {
  const isWxbrowser = isWxBrowser();
  return fetch(getUrl(`/api/wechat/login?code=${code}&isWxBrowser=${isWxbrowser}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  });
};

export const loginTest = (data: any) => {
  return fetch(getUrl(`/api/wechat/login-test`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// save book data for a logged in user
export const saveWorkOrders = (data: any, userName: string) => {
  const token = sessionStorage.getItem("token");
  return fetch(getUrl(`/api/workorders/${userName}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
};

export const getWorkOrders = (userName: string, params: string) => {
  const token = sessionStorage.getItem("token");
  return fetch(getUrl(`/api/workorders/${userName}${params}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
};

export const getAllWorkOrders = (params: string) => {
  const token = sessionStorage.getItem("token");
  return fetch(getUrl(`/api/workorders${params}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
};
