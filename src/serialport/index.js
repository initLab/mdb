import { SerialPort } from 'serialport';
import { promisify } from 'node:util';

export class SequentialSerial extends SerialPort {
    static async create(options) {
        return new Promise((resolve, reject) => {
            const port = new this(options, err =>
                err ? reject(err) : resolve(port),
            );
        });
    }

    async drainAsync() {
        return promisify(this.drain).bind(this);
    }

    async closeAsync() {
        return promisify(this.close).bind(this);
    }

    async writeAndDrain(chunk, encoding) {
        console.log('writing', JSON.stringify(chunk));
        const isOkToContinue = await promisify(this.write).call(this, chunk, encoding);

        if (!isOkToContinue) {
            await this.drainAsync();
        }
    }
}
