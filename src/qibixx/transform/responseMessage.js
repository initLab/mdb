import { Transform } from 'node:stream';
import { hardwareVersion, softwareVersion } from '../commands/general.js';
import { parseAnswer, parseVersion } from '../util.js';

export class ResponseMessageTransform extends Transform {
    constructor() {
        super({
            readableObjectMode: true,
        });
    }

    _transform(chunk, encoding, callback) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('read', chunk.toString());
        }

        const parts = chunk.toString().split(',');

        switch (parts[0]) {
            case 'v':
                callback(null, {
                    type: 'softwareVersion',
                    version: parseVersion(parts[1]),
                    cpuId: parts[2],
                });
                break;
            case 'h':
                callback(null, {
                    type: 'hardwareVersion',
                    version: parseVersion(parts[1]),
                    capabilities: parts[2],
                });
                break;
            case 'm':
                callback(null, {
                    type: 'setGenericMaster',
                    success: parseAnswer(parts[1]),
                });
                break;
            case 'p':
                callback(null, {
                    type: 'genericMasterRequestCommandGroup',
                    answer: parseAnswer(parts[1], true),
                });
                break;
            default:
                callback(new Error(`Unsupported response message: ${chunk}`));
                break;
        }
    }
}
