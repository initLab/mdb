import { toInt } from '../util/index.js';

export function parseVersion(str) {
    const [ major, minor, patch, build] = str.split('.').map(toInt);
    return { major, minor, patch, build };
}

export function parseAnswer(str, allowData = false) {
    if (str === 'ACK') {
        return true;
    }

    if (str === 'NACK') {
        return false;
    }

    if (!allowData) {
        throw new Error(`Unexpected answer: ${str}`);
    }

    return str;
}
