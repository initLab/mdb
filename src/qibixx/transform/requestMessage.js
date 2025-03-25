import { Transform } from 'node:stream';
import { hardwareVersion, softwareVersion } from '../commands/general.js';

export class RequestMessageTransform extends Transform {
    constructor() {
        super({
            writableObjectMode: true,
        });
    }

    _transform(chunk, encoding, callback) {
        switch (chunk?.type) {
            case 'softwareVersion':
                callback(null, softwareVersion);
                break;
            case 'hardwareVersion':
                callback(null, hardwareVersion);
                break;
            default:
                callback(new Error(`Unsupported type: ${chunk?.type}`));
        }
    }
}
