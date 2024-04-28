#!/usr/bin/env node

import { ReadlineParser } from '@serialport/parser-readline';
import { SequentialSerial } from './serialport/index.js';
import { hardwareVersion, reset, softwareVersion } from './qibixx/commands.js';

console.log('Opening port');
const port = await SequentialSerial.create({
    path: '/dev/ttyACM0',
    baudRate: 115200,
});
console.log('Port opened');

const parser = port.pipe(new ReadlineParser({
    delimiter: '\r\n',
}));
parser.on('data', parseLine);
await port.writeAndDrain(reset);
await port.writeAndDrain(softwareVersion);
await port.writeAndDrain(hardwareVersion);
await port.writeAndDrain('X,1\n');

function parseLine(line) {
    const parts = line.split(',');

    switch (parts[0]) {
        case 'v':
            console.log('Software version:', parts[1]);
            console.log('CPU ID:', parts[2]);
            break;
        case 'h':
            console.log('Hardware version:', parts[1]);
            console.log('Capabilities:', parts[2]);
            break;
        case 'x':
            if (parts[1] === 'ACK') {
                break;
            }

            console.log(parts[2], parts[1], parts[3], parts[4]);
            break;
        default:
            console.log('Unknown packet type:', parts[0]);
    }
}
