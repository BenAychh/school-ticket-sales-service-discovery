export interface IClientEndpoint {
  url: string;
  freshest: string;
}

export interface IClientEndpoints {
  [key: string]: IClientEndpoint;
}
