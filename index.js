import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms));

const port = new SerialPort({
    path: '/dev/ttyACM0',
    baudRate: 115200,
});
const parser = port.pipe(new ReadlineParser({
    delimiter: '\r\n',
}));
parser.on('data', parseLine);
port.write('X,0\n');
await sleep(100);
port.write('V\n');
await sleep(100);
port.write('H\n');
await sleep(100);
port.write('X,1\n');

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
