import { Channel } from './serialport/channel.js';
import { RequestFrameTransform } from './qibixx/transform/requestFrame.js';
import { RequestMessageTransform } from './qibixx/transform/requestMessage.js';
import { ResponseFrameTransform } from './qibixx/transform/responseFrame.js';
import { ResponseMessageTransform } from './qibixx/transform/responseMessage.js';
import { on } from 'node:events';

const path = '/dev/mdb-hat';
const channel = new Channel({
    path,
    baudRate: 115200,
});

const requestMessageTransform = new RequestMessageTransform();
const requestFrameTransform = new RequestFrameTransform();
const responseFrameTransform = new ResponseFrameTransform();
const responseMessageTransform = new ResponseMessageTransform();

requestMessageTransform
    .pipe(requestFrameTransform)
    .pipe(channel.stream)
    .pipe(responseFrameTransform)
    .pipe(responseMessageTransform);

await channel.connect();
const softwareVersion = await simpleCommand('softwareVersion');
console.log(softwareVersion);
const hardwareVersion = await simpleCommand('hardwareVersion');
console.log(hardwareVersion);
await channel.disconnect();

async function simpleCommand(type) {
    requestMessageTransform.write({
        type,
    });

    const signal = AbortSignal.timeout(20);

    for await (const event of on(responseMessageTransform, 'data', {
        signal,
    })) {
        const [ message ] = event;

        if (message?.type === type) {
            return message;
        }
    }
}
