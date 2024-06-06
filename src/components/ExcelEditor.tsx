import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula/lib/index.css";

import {
  ICellData,
  ICommandInfo,
  IObjectMatrixPrimitiveType,
  IWorkbookData,
  Univer,
  UniverInstanceType,
  Workbook,
} from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverFindReplacePlugin } from '@univerjs/find-replace';
import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter';
import { UniverSheetsFilterUIPlugin } from '@univerjs/sheets-filter-ui';
import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace';
import { FUniver } from "@univerjs/facade";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import SaveExcelButton from "../plugins/SaveExcelButton";
import { IUserRangeModel, IUpdatedCellProps, IUserRspModel } from "../models";
import { useSearchParams } from "react-router-dom";
import { saveUniverExcel } from "../utils/univerApi";

export interface UniverSheetRef {
  getData: () => IWorkbookData;
  autoSaveWorkbook: (userInfo?: IUserRspModel) => void;
}

// eslint-disable-next-line react/display-name
export const UniverSheet = forwardRef<
  UniverSheetRef,
  { data: IWorkbookData; style?: React.CSSProperties, userInfo?: IUserRspModel, userRanges?: IUserRangeModel[], messageApi?: any }
>(({ data, style, userInfo, userRanges, messageApi }, ref) => {
  const univerRef = useRef<Univer | null>(null);
  const univerApiRef = useRef<FUniver | null>(null);
  const workbookRef = useRef<Workbook | null>(null);
  const containerRef = useRef(null);
  const [updatedCells,] = useState<IUpdatedCellProps[]>([]);
  const [searchParams, ] = useSearchParams();

  useImperativeHandle(
    ref,
    () =>
      ({
        getData,
        autoSaveWorkbook : (userInfo?: IUserRspModel) => autoSaveWorkbook(userInfo),
      } as UniverSheetRef),
    []
  );

  /**
   * Initialize univer instance and workbook instance
   * @param data {IWorkbookData} document see https://univer.work/api/core/interfaces/IWorkbookData.html
   */
  const init = (data: IWorkbookData) => {
    if (!containerRef.current) {
      throw Error("container not initialized");
    }
    const univer = new Univer({
      theme: defaultTheme,
    });
    univerRef.current = univer;

    // core plugins
    univer.registerPlugin(UniverRenderEnginePlugin);
    univer.registerPlugin(UniverFormulaEnginePlugin);
    univer.registerPlugin(UniverUIPlugin, {
      container: containerRef.current,
      header: true,
      //toolbar: true,
      footer: true,
    });

    // doc plugins
    univer.registerPlugin(UniverDocsPlugin, {
      hasScroll: false,
    });
    univer.registerPlugin(UniverDocsUIPlugin);

    // sheet plugins
    univer.registerPlugin(UniverSheetsPlugin);
    univer.registerPlugin(UniverSheetsUIPlugin);
    univer.registerPlugin(UniverSheetsFormulaPlugin);

    // find replace
    univer.registerPlugin(UniverFindReplacePlugin);
    univer.registerPlugin(UniverSheetsFindReplacePlugin);

    // filter
    univer.registerPlugin(UniverSheetsFilterPlugin);
    univer.registerPlugin(UniverSheetsFilterUIPlugin);


    univer.registerPlugin(SaveExcelButton, {
      userInfo,
      updatedCells,
      searchParams: searchParams.toString().length > 0? `?${searchParams.toString()}` : ''
    });

    // create workbook instance
    workbookRef.current = univer.createUnit<IWorkbookData, Workbook>(
      UniverInstanceType.UNIVER_SHEET,
      data
    );
    
    univerApiRef.current = FUniver.newAPI(univer);
    const workbookApi = univerApiRef.current.getActiveWorkbook();
    workbookApi?.onCommandExecuted((commandInfo: Readonly<ICommandInfo>) => {
      if (commandInfo.id === "sheet.mutation.set-range-values") {
        if(sessionStorage.getItem("isUpdated") && sessionStorage.getItem("isUpdated") === "true") {
          updatedCells.splice(0, updatedCells.length);
          sessionStorage.setItem("isUpdated", "false");
        }        
        const { cellValue, subUnitId, unitId } =  commandInfo.params! as any;
        const cell = cellValue as IObjectMatrixPrimitiveType<ICellData>;
        const rowkey = parseInt(Object.keys(cell)[0]);
        let resultKey = rowkey;
        let existCell = updatedCells.find(c => c.userName === userInfo!.openid && c.subUnitId === subUnitId && c.unitId === unitId && c.cellValue[resultKey]);
        let userName = userInfo!.openid;
        if (userInfo!.role === "admin") {
          const userRange = userRanges!.find (c => c.startRow <= rowkey && c.endRow >= rowkey && c.sheetId === subUnitId);
          if (!userRange) return;
          resultKey = rowkey - userRange.startRow + 1;
          existCell = updatedCells.find(c => c.userName === userRange.userName && c.subUnitId === subUnitId && c.unitId === unitId && c.cellValue[resultKey]);
          userName = userRange.userName;       
        }
        if (existCell) {
          const cellKey = parseInt(Object.keys(cell[rowkey])[0])
          if(existCell.cellValue[resultKey][cellKey]) {
            existCell.cellValue[resultKey][cellKey].v = cell[rowkey][cellKey].v;
          }
          else {
            existCell.cellValue[resultKey] = {...existCell.cellValue[resultKey], ...cell[rowkey]};
          }
        }
        else {
          const param: IUpdatedCellProps = {
            cellValue: {[resultKey]: cell[rowkey]},
            subUnitId: subUnitId,
            unitId: unitId,
            userName: userName
          };
          updatedCells.push(param);
          //setChangeCells([...changeCells, param]);
        }
      }
    });

  };

  /**
   * Destroy univer instance and workbook instance
   */
  const destroyUniver = () => {
    univerRef.current?.dispose();
    univerApiRef.current = null;
    univerRef.current = null;
    workbookRef.current = null;
    updatedCells.splice(0, updatedCells.length);
  };

  const autoSaveWorkbook = async (preUserInfo: any) => {
    if (!preUserInfo) {
      return;
    }

    if (updatedCells && updatedCells.length > 0) {
      messageApi.open({
        type: 'loading',
        content: '正在保存...',
        duration: 0,
      });
      const params = searchParams.toString().length > 0? `?${searchParams.toString()}` : ''
      const bookData = getData();
      saveUniverExcel(userInfo!, params, bookData, updatedCells)
      .then(() => {
        sessionStorage.setItem("isUpdated", "true");
      })
      .finally(() => {
        messageApi.destroy();
      });
    }
  }

  /**
   * Get workbook data
   */
  const getData = () => {
    if (!workbookRef.current) {
      throw new Error("Workbook is not initialized");
    }

    return workbookRef.current.save();
  };

  useEffect(() => {
    init(data);
    
    const preUserInfo = userInfo; 
    return () => {
      autoSaveWorkbook(preUserInfo);
      destroyUniver();
    };
  }, [data]);

  return <div ref={containerRef} className="univer-container" style={style} />;
});
