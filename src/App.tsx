import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Select, Space, message } from "antd";
import { DEFAULT_WORKBOOK_DATA } from "./assets/default-workbook-data";
import {
  ExcelExport,
  ExcelImport,
  UniverSheet,
  UniverSheetRef,
} from "./components";
import { getAllWorkOrders, getWorkOrders } from "./utils/api";
import { useWeChatLogin } from "./hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import queryString from 'query-string';
import { IWorkbookData } from "@univerjs/core";
import { IUserRangeModel } from "./models";

const App: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IWorkbookData>(DEFAULT_WORKBOOK_DATA);
  const univerRef = useRef<UniverSheetRef | null>(null);
  const [searchParams, ] = useSearchParams();
  const [userRange,] = useState<IUserRangeModel[]>([])
  const { isLoggedIn, userInfo, loginError, handleLogin, handleTempLogin} = useWeChatLogin();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!isLoggedIn) {
      const { code } = queryString.parse(searchParams.toString())
      if(code === undefined) {
        // navigate('/login')
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
      const { role, nickname } = userInfo!      
      messageApi.open({
        type: 'loading',
        content: '正在获取数据...',
        duration: 0,
      });
      if (role === "admin") {
        getAllWorkOrders().then((res) => {
          if (res.status === 200) {
            res.json().then((json) => {
              const keys = Object.keys(json.data);
              let result = json.data[keys[0]] as IWorkbookData;
              const { sheetOrder } = result
              sheetOrder.forEach((sheetId: any) => {     
                userRange.push({ userName: keys[0], sheetId: sheetId, startRow: 1, endRow: Object.keys(result.sheets[sheetId].cellData!).length - 1 });
                //setUserRange([...userRange, { userName: keys[0], startRow: 1, endRow: Object.keys(result.sheets[sheetId].cellData!).length - 1 }])
                keys.forEach((booKey, bookIndex) => {
                  if (bookIndex > 0) {                    
                    const count = Object.keys(result.sheets[sheetId].cellData!).length
                    const rows = json.data[booKey].sheets[sheetId].cellData!
                    Object.keys(rows).forEach((key, rowIndex) => {
                      if (rowIndex > 0) {
                        result.sheets[sheetId].cellData![count + rowIndex - 1] = rows[key as any]
                      }
                    })

                    userRange.push({ userName: booKey, sheetId: sheetId, startRow: count, endRow: Object.keys(result.sheets[sheetId].cellData!).length - 1 });
                    //setUserRange([...userRange, { userName: keys[0], startRow: count, endRow: Object.keys(result.sheets[sheetId].cellData!).length - 1 }])
                  }
                })
              })

              setData(result);
              messageApi.destroy();
            });
          }
        });
      }
      else {
        getWorkOrders(nickname!).then((res) => {
          if (res.status === 200) {
            res.json().then((json) => {
              setData(json.data);
              messageApi.destroy();
            });
          }
        });
      }
    }    
  }, [userInfo]);

  useEffect(() => {
    if (loginError) {
      messageApi.open({
        type: 'error',
        content: '登录失败，请重试',
        duration: 0,
      });
    }
  }, [loginError]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {contextHolder}
      <div className="topBar">
        <Space>
          <ExcelImport callback={setData} />
          <ExcelExport workbook={univerRef.current} />
          <Select onChange={(_, Option) => handleTempLogin(Option)} style={{ width: 120 }}>
            <Select.Option value="用户1">用户1</Select.Option>
            <Select.Option value="用户2">用户2</Select.Option>
            <Select.Option value="用户3">用户3</Select.Option>
            <Select.Option value="主任">车间主任</Select.Option>
          </Select>
        </Space>
      </div>
      <UniverSheet style={{ flex: 1 }} ref={univerRef} data={data} userInfo={userInfo} userRanges={userRange} messageApi={messageApi} />
    </div>
  );
};

export default App;
