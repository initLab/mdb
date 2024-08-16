import { toInt } from '../util/index.js';

export function parseVersion(str) {
    const [ major, minor, patch, build] = str.split('.').map(toInt);
    return { major, minor, patch, build };
}
