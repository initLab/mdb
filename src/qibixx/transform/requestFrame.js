import { Transform } from 'node:stream';

export class RequestFrameTransform extends Transform {
    _transform(chunk, encoding, callback) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('write', chunk.toString());
        }

        this.push(`${chunk}\n`);
        callback();
    }
}
