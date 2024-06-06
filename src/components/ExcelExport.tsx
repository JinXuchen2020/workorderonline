import { Button } from "antd";
import { FunctionComponent } from "react";
import * as Excel from "exceljs";
import { Transformer } from "../Migrate";

export const ExcelExport: FunctionComponent<{
  callback: any
}> = ({ callback }) => {
  const handleClick = async () => {
    const data = callback();
    if (!data) return;
    const excelFile: Excel.Workbook = Transformer.transformFortuneSheet(data);
    const buffer = await excelFile.xlsx.writeBuffer();
    Transformer.saveFile(buffer, "工作表");
  };

  return (
    <Button type="primary" onClick={handleClick}>
      导出
    </Button>
  );
};
