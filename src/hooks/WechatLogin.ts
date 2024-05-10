import { useState } from "react";
import { ITokenRspModel } from "../models/Login/ITokenRspModel";
import { IUserRspModel } from "../models/User/IUserRspModel";
import { getMe, loginWechatUser } from "../utils/api";

// 微信登录hook
export const useWeChatLogin = ()=> {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<Partial<IUserRspModel>>();

  const handleLogin = async (code: string) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      const response = await loginWechatUser(code);
      const data = (await response.json()) as ITokenRspModel;
      if (data.success) {
        sessionStorage.setItem("token", data.token);
        const user = (await (await getMe()).json()).data as IUserRspModel;
        setUserInfo(user);
        setIsLoggedIn(true);
      }
      else {
        setLoginError(data.message);
      }
    } 
    catch (error: any) {
      setLoginError(error);
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleTempLogin = async (userName: string) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      setUserInfo({nickname: userName});
      setIsLoggedIn(true);
    } 
    catch (error: any) {
      setLoginError(error);
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUserInfo(undefined);
    setIsLoggedIn(false);
  };

  return {
    isLoading,
    isLoggedIn,
    loginError,
    userInfo,
    handleLogin,
    handleTempLogin,
    handleLogout,
  };
}
