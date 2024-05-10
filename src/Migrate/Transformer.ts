import { HorizontalAlign, ICellData, IColorStyle, IObjectArrayPrimitiveType, IStyleData, ITextDecoration, ITextRotation, IWorkbookData, Nullable, VerticalAlign, WrapStrategy } from '@univerjs/core';
import * as Excel from 'exceljs';

export class Transformer {
  static transform(data: IWorkbookData, _options?: any): Excel.Workbook {
    const workbook = new Excel.Workbook();

    Object.keys(data.sheets).forEach(key => {
      const currentSheet = data.sheets[key];
      const sheetData = Object.keys(currentSheet.cellData!).map(cellKey => currentSheet.cellData![cellKey as any]!);
      const worksheet = workbook.addWorksheet(currentSheet.name!, { views: [{ showGridLines: true }] });
      const columnData = currentSheet.columnData ?? {};
      const defaultColumnWidth = currentSheet.defaultColumnWidth ?? 80;

      if(sheetData.length > 0) {        
        worksheet.columns = Object.keys(sheetData[0]).map(cellKey => {
          const cell = sheetData[0][cellKey as any];

          const result : Partial<Excel.Column> = {
            header: cell.v?.toString() ?? '',
            key: cellKey,
            width: (columnData[cellKey as any]?.w ?? defaultColumnWidth) / 8,
            isCustomWidth: false,
          }

          return result
        });

        Transformer.setStyleAndValue(sheetData, worksheet);

      }
    });

    return workbook;
  }

  static saveFile (buf: Excel.Buffer, fileName: string) {
    let blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
    const downloadElement = document.createElement('a');
    let href = window.URL.createObjectURL(blob);
    downloadElement.href = href;
    downloadElement.download = fileName +".xlsx"; // 文件名字
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement); // 下载完成移除元素
    window.URL.revokeObjectURL(href); // 释放掉blob对象
  }

  static setStyleAndValue (cellArr:IObjectArrayPrimitiveType<ICellData>[], worksheet: Excel.Worksheet) {
    if (!Array.isArray(cellArr)) return;
   
    cellArr.forEach(function (row, rowid) {
      //const dbrow = worksheet.getRow(rowid+1);
      //设置单元格行高,默认乘以1.2倍
      //dbrow.height=luckysheet.getRowHeight([rowid])[rowid]*1.2;
      Object.keys(row).every(function (cellKey, columnid) {
        const cell = row[cellKey as any];
        if (!cell) return true;
        if(rowid == 0){
          //const dobCol = worksheet.getColumn(columnid+1);
           //设置单元格列宽除以8
          //dobCol.width=luckysheet.getColumnWidth([columnid])[columnid]/8;
        }

        const cellStyle = cell.s as IStyleData;
        let fill = Transformer.fillConvert(cellStyle.bg);
        let font = Transformer.fontConvert(cellStyle.ff, cellStyle.cl?.rgb, cellStyle.bl, cellStyle.it, cellStyle.fs, cellStyle.st, cellStyle.ul);
        let alignment = Transformer.alignmentConvert(cellStyle.vt, cellStyle.ht, cellStyle.tb, cellStyle.tr);
        let value : Excel.CellValue;
   
        let v = cell.v ?? "";
        if (cell.f) {
          value = { formula: cell.f, result: v };
        } else {
          value = v;
        }
        let target = worksheet.getCell(rowid + 1, columnid + 1);
        target.fill = fill ?? { type: 'pattern', pattern: 'none' };
        target.font = font ?? { name: 'Arial', size: 10, color: { argb: '000000' } };
        target.alignment = alignment ?? { vertical: 'top', horizontal: 'left', wrapText: false, textRotation: 0 };
        target.value = value ?? '';
        return true;
      })
    })
  }

  static rgb2hex (rgb: string) {
    if (rgb.charAt(0) == '#'){
      return rgb;
    }
 
    var ds = rgb.split(/\D+/);
    var decimal = Number(ds[1]) * 65536 + Number(ds[2]) * 256 + Number(ds[3]);
    return "#" + zero_fill_hex(decimal, 6);
 
    function zero_fill_hex(num: number, digits: number) {
      var s = num.toString(16);
      while (s.length < digits)
        s = "0" + s;
      return s;
   }
  }

  static fillConvert ( bg: Nullable<IColorStyle>) : Excel.Fill | null {
    if (!bg) {
      return null;
    }
    const rgb = bg.rgb!.indexOf('rgb')>-1 ? this.rgb2hex(bg.rgb!) : bg.rgb!;
    let fill : Excel.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {argb: rgb.replace('#', '')}
    }
    return fill
  }

  static fontConvert (ff: Nullable<string>, fc: Nullable<string>, bl = 0, it = 0, fs = 10, cl: ITextDecoration | undefined, ul:ITextDecoration | undefined) : Partial<Excel.Font> { // luckysheet：ff(样式), fc(颜色), bl(粗体), it(斜体), fs(大小), cl(删除线), ul(下划线)
    const luckyToExcel = {
      num2bl: function (num: number) {
        return num === 0 ? false : true
      }
    }
    const color = fc ? '': fc!;
   
    const font: Partial<Excel.Font> = {
      name: ff ?? undefined,
      family: 1,
      size: fs,
      color: {argb: color.replace('#', '')},
      bold: luckyToExcel.num2bl(bl),
      italic: luckyToExcel.num2bl(it),
      underline: luckyToExcel.num2bl(ul?.s ?? 0),
      strike: luckyToExcel.num2bl(cl?.s ?? 0)
    }
   
    return font;
  }

  static alignmentConvert (vt: Nullable<VerticalAlign>, ht:Nullable<HorizontalAlign>, tb: Nullable<WrapStrategy>, tr:Nullable<ITextRotation>) :any { // luckysheet:vt(垂直), ht(水平), tb(换行), tr(旋转)
    const luckyToExcel = {
      vertical: {
        [VerticalAlign.MIDDLE]: 'middle',
        [VerticalAlign.TOP]: 'top',
        [VerticalAlign.BOTTOM]: 'bottom',
        [VerticalAlign.UNSPECIFIED] : 'justify'        
      },
      horizontal: {
        [HorizontalAlign.CENTER]: 'center',
        [HorizontalAlign.LEFT]: 'left',
        [HorizontalAlign.RIGHT]: 'right',
        [HorizontalAlign.JUSTIFIED]: 'JUSTIFIED',
        [HorizontalAlign.UNSPECIFIED]: 'left'
      },
      wrapText: {
        [WrapStrategy.UNSPECIFIED]: false,
        [WrapStrategy.CLIP]: false,
        [WrapStrategy.OVERFLOW]: false,
        [WrapStrategy.WRAP]: true
      },
      textRotation: {
        0: 0,
        1: 45,
        2: -45,
        3: 'vertical',
        4: 90,
        5: -90,
        default: 0
      }
    }
   
    let alignment = {
      vertical: luckyToExcel.vertical[vt ?? VerticalAlign.TOP],
      horizontal: luckyToExcel.horizontal[ht?? HorizontalAlign.LEFT],
      wrapText: luckyToExcel.wrapText[tb ?? WrapStrategy.CLIP],
      textRotation: luckyToExcel.textRotation[(tr?.a as keyof typeof luckyToExcel.textRotation) ?? 'default']
    }

    return alignment;
   
  }
}
