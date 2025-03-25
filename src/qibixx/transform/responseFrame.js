import { ReadlineParser } from '@serialport/parser-readline';

export class ResponseFrameTransform extends ReadlineParser {
    constructor(options) {
        super({
            delimiter: '\r\n',
            ...options,
        });
    }
}
