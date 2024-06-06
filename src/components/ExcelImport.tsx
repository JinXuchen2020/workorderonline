import { Button, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import { transformExcelToFortune } from '@zenmrp/fortune-sheet-excel';
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
    const fsh = await transformExcelToFortune(file as File);
    callback(fsh.sheets);
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