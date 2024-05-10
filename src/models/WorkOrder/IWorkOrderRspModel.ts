export interface IWorkOrderRspModel {
  id: string;
  createdDate: any;
  orderNo: string;
  orderType: string;
  orderOperation: string;
  worker: string;
  productAmount: number;
  completeAmount: number;
  deviceId: string;
  unitPrice: number;
  totalPrice: number;
  description: string;
  status: number;
}
