import { duplexPair } from 'node:stream';
import { SequentialSerial } from './index.js';

export class Channel {
    #options;
    #port;
    #internalStream;
    #externalStream;

    constructor(options) {
        this.#options = options;
        [ this.#internalStream, this.#externalStream ] = duplexPair();
    }

    async connect() {
        this.#port = await SequentialSerial.create(this.#options);
        this.#port.pipe(this.#internalStream).pipe(this.#port);
    }

    async disconnect() {
        this.#port.unpipe(this.#internalStream);
        this.#internalStream.unpipe(this.#port);
        await this.#port.closeAsync();
        this.#port = null;
    }

    /**
    * @returns {Duplex}
    */
    get stream() {
        return this.#externalStream;
    }
}
