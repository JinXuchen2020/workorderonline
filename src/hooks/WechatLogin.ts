import { useState } from "react";
import { loginWechatUser } from "../utils/api";

// 微信登录hook
export const useWeChatLogin = ()=> {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleLogin = async (code: string) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      const response = await loginWechatUser(code);
      const data = await response.json();
      if (data.success) {
        setUserInfo(data.data);
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
    setUserInfo(null);
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
