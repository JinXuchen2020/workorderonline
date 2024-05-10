import { ICellData, IObjectMatrixPrimitiveType } from "@univerjs/core";

export interface IUpdatedCellProps {
    cellValue: IObjectMatrixPrimitiveType<ICellData>;
    subUnitId: string;
    unitId: string;
    userName: string;
  }