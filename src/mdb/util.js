export const readByteArray = (buffer, offset, length) =>
    [...Array(length).keys()].map(index => buffer.readUInt8(offset + index))

export const splitToBits = (int, length) =>
    int.toString(2).padStart(length, '0').split('');
