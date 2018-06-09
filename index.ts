import { Request, Response } from 'express';
import { helloWorld } from './src/index';


export function http(request: Request, response: Response) {
  const localResponse = helloWorld(request);
  response.status(localResponse.code).json(localResponse.body);
};
