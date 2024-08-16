import { SequentialSerial } from '../serialport/index.js';
import { reset } from './commands/general.js';

export async function connectPort(path) {
    console.log('Opening port');
    const port = await SequentialSerial.create({
        path,
        baudRate: 115200,
    });
    console.log('Port opened');

    return port;
}

export async function resetDevice(path) {
    const port = await connectPort(path);
    await port.writeAndDrain(reset);
    await port.closeAsync();
}
