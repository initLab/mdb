import { setTimeout } from 'node:timers/promises';

export const sleep = async delay => await setTimeout(delay);
export const toInt = str => parseInt(str, 10);
export const hexToBuffer = hex => Buffer.from(hex, 'hex');
