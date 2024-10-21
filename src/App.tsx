import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Space, message } from "antd";
//import { DEFAULT_WORKBOOK_DATA } from "./assets/default-workbook-data";
import {
  ExcelExport,
  ExcelImport,
  HeaderCtl,
  // UniverSheet,
  // UniverSheetRef,
} from "./components";
import { getAllWorkOrders, getWorkOrders } from "./utils/api";
import { useWeChatLogin } from "./hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import queryString from 'query-string';
//import { ICellData, IObjectMatrixPrimitiveType, IWorkbookData, ObjectMatrix } from "@univerjs/core";
import { IUserRangeModel, IUserRspModel } from "./models";
import { DateRangeSelector } from "./components/DateRangeSelector";
import { FortuneSheet, FortuneSheetRef } from "./components/FortuneSheet";
import { Sheet } from "@fortune-sheet/core";

const App: React.FC = () => {
  const navigate = useNavigate();
  //const [data, setData] = useState<IWorkbookData>();
  const [data, setData] = useState<Sheet[]>();
  //const univerRef = useRef<UniverSheetRef | null>(null);
  const fortuneSheetRef = useRef<FortuneSheetRef | null>(null);
  const [searchParams, ] = useSearchParams();
  const [userRange,] = useState<IUserRangeModel[]>([])
  const {userInfo, loginError, isLoggedIn, handleLogin, handleLogout, getUserInfo} = useWeChatLogin();
  const [messageApi, contextHolder] = message.useMessage();
  const [dateRangeOpen, setDateRangeOpen] = useState(false);  
  const [key, setKey] = React.useState<number>(1);
  //const [userInfo, setUserInfo] = React.useState<IUserRspModel>();
  //let isLoading = false

  useEffect(() => {
    if (!isLoggedIn) {
      const { code } = queryString.parse(searchParams.toString())
      if(code === undefined) {
        navigate('/login')
      }
      else {        
        messageApi.open({
          type: 'loading',
          content: '正在登录...',
          duration: 0,
        });
        handleLogin(code as string).then(() => {
          navigate('/');
          messageApi.destroy();
        });
      }
    }
    else {
      getUserInfo().then((currentUserInfo) => {
        if(currentUserInfo.openid){
          messageApi.open({
            type: 'loading',
            content: `${isLoggedIn} ${userInfo?.nickname} 正在登录...${currentUserInfo.nickname}`,
            duration: 0,
          });
          getData(currentUserInfo);
        }
        else {
          messageApi.open({
            type: 'error',
            content: `${isLoggedIn} ${userInfo?.nickname} 登录错误...${currentUserInfo.nickname}`,
            duration: 5000,
          });
        }
      });
    }
  }, [isLoggedIn]);

  const getData = (userInfo: IUserRspModel) => {
    const { role, openid, exp } = userInfo!
    const isTimeOut = new Date().getTime() / 1000 > exp
    if(isTimeOut) {
      handleLogout()
      navigate('/login')
    }

    // if (isLoading) {
    //   return;
    // }
    messageApi.open({
      type: 'loading',
      content: '正在获取数据...',
      duration: 0,
    });

    // isLoading = true;
    const params = searchParams.toString().length > 0? `?${searchParams.toString()}` : ''
    if (role === "admin") {
      getAllWorkOrders(params).then((res) => {
        if (res.status === 200) {
          res.json().then((json) => {
            const keys = Object.keys(json.data);
            const firstSheets = json.data[keys[0]] as Sheet[];
            let resultSheets : Sheet[] = [];
            for (let i = 0; i < firstSheets.length; i++) {
              let result: Sheet = {
                ...firstSheets[i]
              }
              const sheetId = result.id!;
              let originCellData = result.celldata!;
              if(originCellData) {
                let startRow = Math.min(...originCellData.map(c => c.r));
                let endRow = Math.max(...originCellData.map(c => c.r));
                if (endRow > 0) {
                  startRow += 1;
                  userRange.push({ userName: keys[0], sheetId: sheetId, startRow: startRow, endRow: endRow });
                }
                keys.forEach((booKey, bookIndex) => {
                  if (bookIndex > 0) {
                    const bookData = (json.data[booKey] as Sheet[]).find(c=>c.id === sheetId)!.celldata!
                    const bookConfig = (json.data[booKey] as Sheet[]).find(c=>c.id === sheetId)!.config!
                    startRow = endRow + 1;
                    const bookEndRow = Math.max(...bookData.map(c => c.r));
                    if(bookEndRow > 0) {
                      for(let j = 1; j <= bookEndRow; j++) {
                        const rowData = bookData.filter(c => c.r === j);
                        if(rowData.length > 0) {
                          rowData.forEach(c => {
                            c.r += startRow - 1;
                          })
                          originCellData = originCellData.concat(rowData);
                        }

                        const rowBorderInfo = bookConfig.borderInfo?.filter(c=>c.value.row_index === j)!;
                        if (rowBorderInfo.length > 0) {
                          rowBorderInfo.forEach((c: any) => {
                            c.value.row_index += startRow - 1;
                            result.config?.borderInfo?.push(c);
                          })
                        }
                      }
                    }

                    endRow = Math.max(...originCellData.map(c => c.r));  
                    userRange.push({ userName: booKey, sheetId: sheetId, startRow: startRow, endRow: endRow });
                  }
                })

                result.row = endRow + 1;  
                result.celldata = originCellData;
                resultSheets.push(result);
              }
            }

            setData(resultSheets);
            // messageApi.destroy();
            // isLoading = false;
          });
        }
      }).catch((res: any) => {
        messageApi.open({
          type: 'error',
          content: `获取数据失败: ${res.message}`,
          duration: 5,
        });
        // isLoading = false;
      });
    }
    else {
      getWorkOrders(openid!, params).then((res) => {
        if (res.status === 200) {
          res.json().then((json) => {              
            setData(json.data);
            // messageApi.destroy();
            // isLoading = false;
          });
        }
      });
    }
  }

  useEffect(() => {
    if (userInfo) {
      const { role } = userInfo
      if (role === "admin") {
        setDateRangeOpen(false);
      }
      else {
        setDateRangeOpen(false);
      }
    }
  }, [userInfo?.openid]);

  useEffect(() => {
    const listener = () => {
      fortuneSheetRef.current?.autoSaveWorkbook(userInfo);
    };
    window.addEventListener('beforeunload', listener);
    return () => {
        window.removeEventListener('beforeunload', listener)
    }
}, []);

  useEffect(() => {
    if (loginError) {
      messageApi.open({
        type: 'error',
        content: '登录失败，请重试',
        duration: 0,
      });
      navigate('/login')
    }
  }, [loginError]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {contextHolder}
      <div className="topBar">
        <Space>
          <ExcelImport callback={(data: Sheet[])=> {
            setKey(key + 1);
            setData(data);
            sessionStorage.setItem("isUpdated", "false");
          }} />
          <ExcelExport callback={()=> fortuneSheetRef.current?.getData()} />
          {/* <Select onChange={(_, Option) => handleTempLogin(Option)} style={{ width: 120 }}>
            <Select.Option value="用户1">用户1</Select.Option>
            <Select.Option value="用户2">用户2</Select.Option>
            <Select.Option value="用户3">用户3</Select.Option>
            <Select.Option value="主任">车间主任</Select.Option>
          </Select> */}
        </Space>
        <HeaderCtl userInfo={userInfo} callback={()=> fortuneSheetRef.current?.autoSaveWorkbook(userInfo)} />
      </div>
      {/* {data && <UniverSheet style={{ flex: 1 }} ref={univerRef} data={data} userInfo={userInfo} userRanges={userRange} messageApi={messageApi} />} */}
      {data && <FortuneSheet ref={fortuneSheetRef} key={key} data={data} userInfo={userInfo} userRanges={userRange} messageApi={messageApi}/> }     
      <DateRangeSelector visible={dateRangeOpen} callback={setDateRangeOpen} />
    </div>
  );
};

export default App;
