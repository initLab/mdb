import { Transform } from 'node:stream';

export class RequestFrameTransform extends Transform {
    _transform(chunk, encoding, callback) {
        this.push(`${chunk}\n`);
        callback();
    }
}
