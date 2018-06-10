export interface ILocalResponse {
  body: {
    apiVersion: string;
    data?: any;
    error?: IErrorBody;
  };
  code: number;
}

export interface IErrorBody {
  code: number;
  message: string;
  errors: IInstanceError[];
}

export interface IInstanceError {
  domain: string;
  reason: string;
  message: string;
}
