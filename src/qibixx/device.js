import { reset } from './commands/general.js';
import { Channel } from '../serialport/channel.js';
import { RequestMessageTransform } from './transform/requestMessage.js';
import { RequestFrameTransform } from './transform/requestFrame.js';
import { ResponseFrameTransform } from './transform/responseFrame.js';
import { ResponseMessageTransform } from './transform/responseMessage.js';
import { on } from 'node:events';
import { sleep } from '../util/index.js';

export class Device {
    #channel;
    #inputStream;
    #outputStream;
    #versions;

    constructor(path) {
        this.#channel = new Channel({
            path,
            baudRate: 115200,
        });

        const requestMessageTransform = new RequestMessageTransform();
        const requestFrameTransform = new RequestFrameTransform();
        const responseFrameTransform = new ResponseFrameTransform();
        const responseMessageTransform = new ResponseMessageTransform();

        requestMessageTransform
            .pipe(requestFrameTransform)
            .pipe(this.#channel.stream)
            .pipe(responseFrameTransform)
            .pipe(responseMessageTransform);

        this.#inputStream = requestMessageTransform;
        this.#outputStream = responseMessageTransform;
    }

    get versions() {
        return this.#versions;
    }

    async connect() {
        await this.#channel.connect();
        await this.#resetAndDisconnect();

        // TODO wait until port reappears
        await sleep(1_000);

        await this.#channel.connect();

        this.#versions = {
            software: await this.#simpleCommand('softwareVersion'),
            hardware: await this.#simpleCommand('hardwareVersion'),
        };
    }

    async disconnect() {
        this.#versions = null;
        await this.#channel.disconnect();
    }

    async updateAndDisconnect() {
        await this.#write({
            type: 'update',
        });
        await this.#channel.disconnect();
    }

    async setGenericMaster(enabled) {
        const response = await this.#poll({
            type: 'setGenericMaster',
            enabled,
        });

        if (response.success && enabled) {
            await this.#genericMasterBusReset();
        }

        return response.success;
    }

    async sendGenericMaster(slave, data) {
        const response = await this.#poll({
            type: 'genericMasterRequestCommandGroup',
            slave,
            data,
        });

        return response.answer;
    }

    async #genericMasterBusReset() {
        await this.#writeAndDrain({
            type: 'genericMasterBusReset',
        });

        // t(break) = 100 ms
        // t(setup) = 200 ms
        await sleep(100 + 200);
    }

    async #simpleCommand(type) {
        return await this.#poll({
            type,
        });
    }

    async #write(chunk, encoding) {
        return new Promise((resolve, reject) => {
            const isOkToContinue = this.#inputStream.write(chunk, encoding, err => {
                if (err) {
                    return reject(err);
                }

                resolve(isOkToContinue);
            });
        });
    }

    async #writeAndDrain(...args) {
        const isOkToContinue = await this.#write(...args);

        if (isOkToContinue) {
            return;
        }

        await new Promise(resolve => {
            this.#inputStream.once('drain', resolve);
        });
    }

    async #resetAndDisconnect() {
        await this.#write({
            type: 'reset',
        });
        await this.#channel.disconnect();
    }

    async #poll(request, timeout = 100) {
        const signal = AbortSignal.timeout(timeout);
        const events = on(this.#outputStream, 'data', {
            signal,
        });

        await this.#writeAndDrain(request);

        for await (const event of events) {
            const [ response ] = event;

            if (response?.type === request.type) {
                return response?.params;
            }
        }
    }
}
