import { useState } from "react";
import { IUserRspModel } from "../models";
import { getMe, loginTest, loginWechatUser } from "../utils/api";

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
      const data = (await (await loginWechatUser(code)).json());
      if (data.success) {
        sessionStorage.setItem("token", data.data);
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

  const handleTempLogin = async (option: any) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      const testUser ={
        nickname: option.children,
        openid: option.value
      }
      const tokenData = (await (await loginTest(testUser)).json());
      if (tokenData.success) {
        sessionStorage.setItem("token", tokenData.data);
        const user = (await (await getMe()).json()).data as IUserRspModel;
        setUserInfo(user);
        setIsLoggedIn(true);
      }
      else {
        setLoginError(tokenData.message);
      }
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
