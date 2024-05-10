declare module 'luckyexcel' {
  export const transformExcelToLucky: (excelFile: File, callback?:(files: IuploadfileList, fs?: string) => void) => void;
}