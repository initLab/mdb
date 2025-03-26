import { SerialPort } from 'serialport';
import { promisify } from 'node:util';

export class SequentialSerial extends SerialPort {
    closeAsync = promisify(this.close).bind(this);

    static async create(options) {
        return new Promise((resolve, reject) => {
            const port = new this(options, err =>
                err ? reject(err) : resolve(port),
            );
        });
    }
}
