import { ICellData, IObjectMatrixPrimitiveType } from "@univerjs/core";
import { Op } from "@fortune-sheet/core";

export interface IUpdatedCellProps {
  cellValue: IObjectMatrixPrimitiveType<ICellData>;
  subUnitId: string;
  unitId: string;
  userName: string;
}

export interface IUpdatedFortuneCellProps {
  operations: Op[];
  sheetId: string;
  userName: string;
}
