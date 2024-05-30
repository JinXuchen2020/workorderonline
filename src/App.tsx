import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Space, message } from "antd";
import { DEFAULT_WORKBOOK_DATA } from "./assets/default-workbook-data";
import {
  ExcelExport,
  ExcelImport,
  HeaderCtl,
  UniverSheet,
  UniverSheetRef,
} from "./components";
import { getAllWorkOrders, getWorkOrders } from "./utils/api";
import { useWeChatLogin } from "./hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import queryString from 'query-string';
import { ICellData, IObjectMatrixPrimitiveType, IWorkbookData, ObjectMatrix } from "@univerjs/core";
import { IUserRangeModel } from "./models";
import { DateRangeSelector } from "./components/DateRangeSelector";

const App: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IWorkbookData>();
  const univerRef = useRef<UniverSheetRef | null>(null);
  const [searchParams, ] = useSearchParams();
  const [userRange,] = useState<IUserRangeModel[]>([])
  const {userInfo, loginError, handleLogin, handleLogout} = useWeChatLogin();
  const [messageApi, contextHolder] = message.useMessage();
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  let isLoading = false

  useEffect(() => {
    if (!userInfo) {
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
      const { role, openid, exp } = userInfo!
      const isTimeOut = new Date().getTime() / 1000 > exp
      if(isTimeOut) {
        handleLogout()
        navigate('/login')
      }

      if (isLoading) {
        return;
      }
      messageApi.open({
        type: 'loading',
        content: '正在获取数据...',
        duration: 0,
      });

      isLoading = true;
      const params = searchParams.toString().length > 0? `?${searchParams.toString()}` : ''
      if (role === "admin") {
        getAllWorkOrders(params).then((res) => {
          if (res.status === 200) {
            res.json().then((json) => {
              const keys = Object.keys(json.data);
              let result = json.data[keys[0]] as IWorkbookData;
              for (let sheetId in result.sheets) {
                const originCellData = result.sheets[sheetId].cellData as IObjectMatrixPrimitiveType<ICellData>;
                const matrixObject = new ObjectMatrix<ICellData>(originCellData);
                
                userRange.push({ userName: keys[0], sheetId: sheetId, startRow: 1, endRow: matrixObject.getLength() - 1 });

                keys.forEach((booKey, bookIndex) => {
                  if (bookIndex > 0) {
                    const bookData = json.data[booKey].sheets[sheetId].cellData! as IObjectMatrixPrimitiveType<ICellData>                    
                    const bookMatrixObject = new ObjectMatrix<ICellData>(bookData);
                    const startRow = matrixObject.getLength();
                    bookMatrixObject.forRow((row) => {
                      if (row > 0) {
                        matrixObject.setRow(startRow - 1 + row, bookMatrixObject.getRow(row)!);
                      }
                    });
                    const endRow = matrixObject.getLength() - 1;

                    userRange.push({ userName: booKey, sheetId: sheetId, startRow: startRow, endRow: endRow });
                  }
                })

                const cellData = matrixObject.getMatrix();
                result.sheets[sheetId].cellData = cellData;
              }

              setData(result);
            });
          }
        }).catch((res: any) => {
          messageApi.open({
            type: 'error',
            content: `获取数据失败: ${res.message}`,
            duration: 0,
          });
        }).finally(()=> {
          messageApi.destroy();
          isLoading = false;
        });
      }
      else {
        getWorkOrders(openid!, params).then((res) => {
          if (res.status === 200) {
            res.json().then((json) => {
              setData(json.data);
              messageApi.destroy();
              isLoading = false;
            });
          }
        });
      }
    }    
  }, [userInfo?.openid]);

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
      univerRef.current?.autoSaveWorkbook(userInfo);
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
    }
  }, [loginError]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {contextHolder}
      <div className="topBar">
        <Space>
          <ExcelImport callback={setData} />
          <ExcelExport workbook={univerRef.current} />
          {/* <Select onChange={(_, Option) => handleTempLogin(Option)} style={{ width: 120 }}>
            <Select.Option value="用户1">用户1</Select.Option>
            <Select.Option value="用户2">用户2</Select.Option>
            <Select.Option value="用户3">用户3</Select.Option>
            <Select.Option value="主任">车间主任</Select.Option>
          </Select> */}
        </Space>
        <HeaderCtl callback={()=> univerRef.current?.autoSaveWorkbook(userInfo)} />
      </div>
      {data && <UniverSheet style={{ flex: 1 }} ref={univerRef} data={data} userInfo={userInfo} userRanges={userRange} messageApi={messageApi} />}      
      <DateRangeSelector visible={dateRangeOpen} callback={setDateRangeOpen} />
    </div>
  );
};

export default App;
