export interface ILocalResponse {
  body: {
    apiVersion: string;
    data?: any;
    error?: IError;
  };
  code: number;

}

interface IError {
  code: number;
  message: string;
  errors: [{
    domain: string;
    reason: string;
    message: string;
  }]
}