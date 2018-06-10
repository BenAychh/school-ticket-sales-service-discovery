import { Request, Response } from 'express';
import { helloWorld } from './src/index';
import { create } from './src/post';

export function http(request: Request, response: Response) {
  const localResponse = helloWorld(request);
  response.status(localResponse.code).json(localResponse.body);
}

export async function post(request: Request, response: Response) {
  const localResponse = await create(request);
  response.status(localResponse.code).json(localResponse.body);
}
