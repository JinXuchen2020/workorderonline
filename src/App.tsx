import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Select, Space } from "antd";
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
  const { isLoggedIn, userInfo, handleLogin, handleTempLogin} = useWeChatLogin();

  useEffect(() => {
    if (!isLoggedIn) {
      const { code } = queryString.parse(searchParams.toString())
      if(code === undefined) {
        // navigate('/login')
      }
      else {
        handleLogin(code as string).then(() => {
          navigate('/');
        });
      }
    }
    else {
      const { nickname } = userInfo
      if (nickname === "主任") {
        getAllWorkOrders("123456").then((res) => {
          if (res.status === 200) {
            res.json().then((json) => {
              const keys = Object.keys(json.data);
              let result = json.data[keys[0]] as IWorkbookData;
              const { sheetOrder } = result
              sheetOrder.forEach((sheetId) => {     
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
            });
          }
        });
      }
      else {
        getWorkOrders(nickname, "123456").then((res) => {
          if (res.status === 200) {
            res.json().then((json) => {
              setData(json.data);
            });
          }
        });
      }
    }    
  }, [userInfo]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topBar">
        <Space>
          <ExcelImport callback={setData} />
          <ExcelExport workbook={univerRef.current} />
          <Select onChange={(value) => handleTempLogin(value)} style={{ width: 120 }}>
            <Select.Option value="用户1">用户1</Select.Option>
            <Select.Option value="用户2">用户2</Select.Option>
            <Select.Option value="用户3">用户3</Select.Option>
            <Select.Option value="主任">车间主任</Select.Option>
          </Select>
        </Space>
      </div>
      <UniverSheet style={{ flex: 1 }} ref={univerRef} data={data} userInfo={userInfo} userRanges={userRange} />
    </div>
  );
};

export default App;
