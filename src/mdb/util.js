export const readByteArray = (buffer, offset, length) =>
    [...Array(length).keys()].map(index => buffer.readUInt8(offset + index))

export const readShortArray = (buffer, offset, length) =>
    [...Array(length).keys()].map(index => buffer.readUInt16BE(offset + index * 2))

export const splitToBits = (int, length) =>
    int.toString(2).padStart(length, '0').split('');
