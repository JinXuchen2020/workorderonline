import { ICellData, IObjectMatrixPrimitiveType, IStyleData, IWorkbookData, ObjectMatrix } from "@univerjs/core"
import { getWorkOrders, saveWorkOrders } from "./api"
import { IUpdatedCellProps, IUserRspModel } from "../models"

export const USER_PROFILE = 'userProfile'
export const RESPONSIVE_THRESHOLD = 415

export const isOfType = <T>(item: any, itemKey : keyof T) : item is T => {
  return item[itemKey] !== undefined
}

export const isWxBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();

  const regex = ua.match(/MicroMessenger/i);
  if(regex && regex.length > 0 && regex[0] === "micromessenger") {
    return true
  }
  else {
    return false
  }
}

export const saveExcel = async (userInfo : IUserRspModel, params:string, bookData: IWorkbookData, updatedCells: IUpdatedCellProps[] ) => {
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