import { ICellData, IObjectMatrixPrimitiveType, IWorkbookData, ObjectMatrix, IStyleData} from "@univerjs/core";
import { DEFAULT_WORKBOOK_DATA } from "../assets/default-workbook-data";
import * as LuckyExcel from "luckyexcel"
import { migrate } from "../Migrate";
import { getAllWorkOrders, getWorkOrders, saveWorkOrders } from "./api";
import { IUpdatedCellProps, IUserRangeModel, IUserRspModel } from "../models";

export const transformExcelToUniver = (file: File, callback: (workbook: IWorkbookData) => void) => {
  LuckyExcel.transformExcelToLucky(file as File, (exportJson) =>{                                
    if(exportJson.sheets==null || exportJson.sheets.length==0){
      alert("Failed to read the content of the excel file, currently does not support xls files!");
      return;
    }

    const luckysheetConfig = {
      data: exportJson.sheets,
      title: exportJson.info.name,
    };
    const univerWorkbookConfig = migrate(luckysheetConfig);

    const sheets = univerWorkbookConfig.sheets;

    if (!sheets) {
      return console.error('No content');
    }

    const workbook : IWorkbookData =  {
      ...DEFAULT_WORKBOOK_DATA,
      sheets: {},
      sheetOrder: [],
      styles: {},
    };

    for (const sheetId in sheets) {
      const sheetData = sheets[sheetId];
      workbook.sheets[sheetId] = sheetData as any
    }

    callback(workbook);
  });  
}

export const saveUniverExcel = async (userInfo : IUserRspModel, params:string, bookData: IWorkbookData, updatedCells: IUpdatedCellProps[] ) => {
  const { role, openid } = userInfo;
  if(role === "admin") {
    updatedCells.map(async({ userName, subUnitId, cellValue }) => {
      const workbook = (await (await getWorkOrders(userName, params)).json()).data as IWorkbookData;
      const originCellData = workbook.sheets[subUnitId].cellData as IObjectMatrixPrimitiveType<ICellData>;
      const matrixObject = new ObjectMatrix<ICellData>(originCellData);
      const updateObject = new ObjectMatrix<ICellData>(cellValue);

      updateObject.forValue((rowIndex, colIndex, cell) => {
        if (cell.v) {
          matrixObject.setValue(rowIndex, colIndex, cell);
        }
        else {
          const originCell = matrixObject.getValue(rowIndex, colIndex);
          matrixObject.setValue(rowIndex, colIndex, { ...originCell, v: cell.p?.body?.dataStream?.replace("/r/n", "").trim() });
        }
      });

      workbook.sheets[subUnitId].cellData = matrixObject.getMatrix();  
      await saveWorkOrders(workbook, userName);
    });
  }
  else {
    Object.keys(bookData.sheets).forEach(async (subUnitId) => {
      if(updatedCells.some((cell) => cell.subUnitId === subUnitId)) {
        const originCellData = bookData.sheets[subUnitId].cellData as IObjectMatrixPrimitiveType<ICellData>;
        const matrixObject = new ObjectMatrix<ICellData>(originCellData);
  
        let rowIndex = 0;
        let colIndex = 0;
        let cellFormat : ICellData = matrixObject.getValue(rowIndex, colIndex);
        while(!cellFormat.v || cellFormat.v.toString().length === 0) {
          colIndex++;
          cellFormat = matrixObject.getValue(rowIndex, colIndex);
        }

        matrixObject.forValue((rowIndex, colIndex, cell) => {
          if (cell.s && typeof cell.s !== "string") {
            return;
          }

          const style = cellFormat.s as IStyleData;

          if (!cell?.v && cell?.p) {
            cell = {s: {...style, bl: 0 }, v: cell.p?.body?.dataStream?.replace("/r/n", "").trim() };
          }
          else {
            cell = {s: {...style, bl: 0 }, v: cell.v };
          }

          matrixObject.setValue(rowIndex, colIndex, cell);
        });
  
        bookData.sheets[subUnitId].cellData = matrixObject.getMatrix();
      }
    });

    await saveWorkOrders(bookData, openid);
  }
}

export const getUniverExcel = async (params: string, userRange:IUserRangeModel[], setData: (data: IWorkbookData) => void) => {
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
  })
}