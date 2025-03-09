import { promisify } from 'node:util';

export const sleep = promisify(setTimeout);
export const toInt = str => parseInt(str, 10);
export const hexToBuffer = hex => Buffer.from(hex, 'hex');
