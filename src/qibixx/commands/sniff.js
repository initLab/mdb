import { command } from './util.js';

/**
 * Sniff (Telemetry)
 *
 * Our MDB devices have a sniffing method which allows to have a detailed overview of what is happening in the MDB bus.
 *
 * To start the sniffer instance just issue this command
 *
 * Answer:
 * x,ACK
 */
export const enableMdbSniffing = command('X,1');
export const disableMdbSniffing = command('X,0');
