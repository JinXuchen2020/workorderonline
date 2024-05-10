import { Button, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import * as LuckyExcel from "luckyexcel"
import { migrate } from "../Migrate";
import { IWorkbookData } from "@univerjs/core";
import { DEFAULT_WORKBOOK_DATA } from '../assets/default-workbook-data';
import { FunctionComponent } from "react";

export const ExcelImport : FunctionComponent<{callback: any}> = ({callback}) => {
  const beforeUpload = (file: RcFile) => {
    if (!/\.(xlsx)$/.test(file.name)) {
      alert("目前只支持上传xlsx文件！");
      return false;
    }
    return true;
  }

  const handleUpload =  async (options: RcCustomRequestOptions )=> 
  {
    const { file } = options;
    if (!file) return;
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

  return (
    <Upload
      name="file"
      accept='.xlsx'
      showUploadList={false}
      customRequest={handleUpload}
      beforeUpload={beforeUpload}
    >
      <Button type="primary">导入</Button>
    </Upload>
  );
}