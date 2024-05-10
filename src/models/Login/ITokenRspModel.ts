import { IUserRspModel } from "../User/IUserRspModel";

export interface ITokenRspModel {
  id: string;
  code: number;
  message: string;
  success: boolean;
  token: string;
  user: IUserRspModel;
  timestamp: number;
}
