import * as Datastore from '@google-cloud/datastore';
import { Request } from 'express';
import { ILocalResponse } from './LocalResponse';

export type handlerFunction = (datastore: Datastore, request: Request) => ILocalResponse;
