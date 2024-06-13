import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Sheet }  from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css"
import { IUpdatedFortuneCellProps, IUserRangeModel, IUserRspModel } from '../models';
import { saveWorkOrders } from '../utils/api';

export interface FortuneSheetRef {
  getData: () => Sheet[];
  autoSaveWorkbook: (userInfo?: IUserRspModel) => void;
}

export const FortuneSheet = forwardRef<
FortuneSheetRef,
  { key: number, data: Sheet[], userInfo?: IUserRspModel, userRanges?: IUserRangeModel[], messageApi?: any }
>(({ key, data, userInfo, userRanges, messageApi }, ref) => {
  const workbookRef = useRef<WorkbookInstance | null>(null);
  const [updatedCells,] = useState<IUpdatedFortuneCellProps[]>([]);

  useImperativeHandle(
    ref,
    () =>
      ({
        getData,
        autoSaveWorkbook : (userInfo?: IUserRspModel) => autoSaveWorkbook(userInfo),
      } as FortuneSheetRef),
    []
  );

  /**
   * Destroy workbook instance
   */
  const destroyUniver = () => {
    workbookRef.current = null;
    updatedCells.splice(0, updatedCells.length);
  };

  const autoSaveWorkbook = async (preUserInfo: any) => {
    if (!preUserInfo) {
      return;
    }

    if(sessionStorage.getItem("isUpdated") && sessionStorage.getItem("isUpdated") === "false") {      
      messageApi.open({
        type: 'loading',
        content: '正在保存...',
        duration: 0,
      });

      if(userInfo!.role === "admin") {
        const bookData = getData();
        let userBookData : {[key: string]:Sheet[]} = {};
        for(const userRange of userRanges!) {
          const sheetData = bookData.find((sheet) => sheet.id === userRange.sheetId)
          if(sheetData && sheetData.data) {
            const firstRow = sheetData.data[0];
            const filterData = sheetData.data.filter((_, index) => userRange.startRow <= index && index <= userRange.endRow);
            filterData.unshift(firstRow);
            const result = {
              ...sheetData,
              celldata: workbookRef.current?.dataToCelldata(filterData),
              data: undefined,
              config: {
                ...sheetData.config,
                borderInfo: sheetData.config?.borderInfo?.filter((border) => border.value.row_index < filterData.length)
              },
              row : filterData.length
            }
            if (Object.keys(userBookData).includes(userRange.userName))
            {
              userBookData[userRange.userName].push(result);
            }
            else {
              userBookData[userRange.userName]= [result];  
            }
          }
        }

        Promise.all(Object.keys(userBookData).map(async (userName) => {
          await saveWorkOrders(userBookData[userName], userName);
        }))
        .then(() => {
          sessionStorage.setItem("isUpdated", "true");
        })
        .finally(() => {
          messageApi.destroy();
        }); 
      }
      else {
        const bookData = getData();
        const resultData = bookData.map((sheet) => {
          const result = {
            ...sheet,
            celldata: workbookRef.current?.dataToCelldata(sheet.data),
            data: undefined,
          }

          return result;
        });
        saveWorkOrders(resultData, userInfo!.openid)
          .then(() => {
            sessionStorage.setItem("isUpdated", "true");
          })
          .finally(() => {
            messageApi.destroy();
          });
      }
    }
  }

  /**
   * Get workbook data
   */
  const getData = () => {
    if (!workbookRef.current) {
      throw new Error("Workbook is not initialized");
    }

    return workbookRef.current.getAllSheets();
  };

  useEffect(() => {    
    // const preUserInfo = userInfo; 
    return () => {
      // autoSaveWorkbook(preUserInfo);
      destroyUniver();
    };
  }, [data]);

  return (
    <>
      <Workbook key={key} ref={workbookRef} data={data} onChange={()=> {
        for (const sheet of workbookRef.current?.getAllSheets() ?? []) {
          if (!sheet.data) continue;
          for (let r = 0; r < sheet.data.length; r++)
            for (let c = 0; c < sheet.data[r].length; c++)
                if (typeof sheet.data[r][c]?.ct === 'object' && sheet.data[r][c]?.ct?.t !== 's')
                  workbookRef.current?.setCellFormat(r, c, 'ct', sheet.data[r][c]?.ct, { id: sheet.id });
        }
      }}
      onOp={() => {
        if(!sessionStorage.getItem("isUpdated") || sessionStorage.getItem("isUpdated") === "true") 
        {
          sessionStorage.setItem("isUpdated", "false");
        }
      }}
      />
    </>
  )
});