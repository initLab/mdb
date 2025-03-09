import { hexToBuffer } from '../util/index.js';
import { readByteArray, splitToBits } from './util.js';

export function parseSetupResponse(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 27) {
        throw new Error('Invalid setup response length, expected 27, got ' + bytes.length);
    }

    const countryCurrencyCode = parseInt(hex.substring(2, 6), 10); // BCD encoding

    return {
        billValidatorFeatureLevel: bytes.readUInt8(0),
        countryCode: countryCurrencyCode <= 999 ? countryCurrencyCode : null,
        currencyCode: countryCurrencyCode >= 1000 && countryCurrencyCode <= 1999 ?
            countryCurrencyCode - 1000 : null,
        billScalingFactory: bytes.readUInt16BE(3),
        decimalPlaces: bytes.readUInt8(5),
        stackerCapacity: bytes.readUInt16BE(6),
        billSecurityLevels: splitToBits(bytes.readUInt16BE(8), 16),
        hasEscrow: bytes.readUInt8(10) === 0xFF,
        billTypeCredit: readByteArray(bytes, 11, 16),
    };
}

// console.log(parseSetupResponse('021975006402012cffffff02050a14326400000000000000000000'));
