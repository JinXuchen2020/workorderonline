import { useMemo, useState } from "react";
import { IUserRspModel } from "../models";
import { getMe, loginTest, loginWechatUser } from "../utils/api";

// 微信登录hook
export const useWeChatLogin = ()=> {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<any>(null);
  //const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfoStr, setUserInfoStr] = useState<string>();

  const handleLogin = async (code: string) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      const data = (await (await loginWechatUser(code)).json());
      if (data.success) {
        sessionStorage.setItem("token", data.data);
        const user = (await (await getMe()).json()).data as IUserRspModel;
        sessionStorage.setItem("userInfo", JSON.stringify(user));
        setUserInfoStr(JSON.stringify(user));
        //setIsLoggedIn(true);
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
      const tokenData = (await (await loginTest(option)).json());
      if (tokenData.success) {
        sessionStorage.setItem("token", tokenData.data);
        const user = (await (await getMe()).json()).data as IUserRspModel;
        sessionStorage.setItem("userInfo", JSON.stringify(user));
        setUserInfoStr(JSON.stringify(user));
        //setIsLoggedIn(true);
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

  const isLoggedIn = useMemo(() => {
    return !sessionStorage.getItem("token") ? false : true;
  },[sessionStorage.getItem("token")])

  const userInfo = useMemo(() => {
    if (userInfoStr) {
      return JSON.parse(userInfoStr) as IUserRspModel;
    }
    else {
      const storage = sessionStorage.getItem("userInfo");
      if (storage) {
        return JSON.parse(storage) as IUserRspModel;
      }
    }    
  },[userInfoStr])

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userInfo");
    setUserInfoStr(undefined)
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
