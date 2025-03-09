import { hexToBuffer, toInt } from '../util/index.js';
import { readByteArray, splitToBits } from './util.js';

export function parseSetupResponse(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 27) {
        throw new Error('Invalid setup response length, expected 27, got ' + bytes.length);
    }

    const countryCurrencyCode = toInt(hex.substring(2, 6)); // BCD encoding

    return {
        billValidatorFeatureLevel: bytes.readUInt8(),
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

export function parseStackerResponse(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 2) {
        throw new Error('Invalid stacker response length, expected 2, got ' + bytes.length);
    }

    const response = bytes.readUInt16BE();

    return {
        stackerIsFull: (response & 0x8000) === 0x8000,
        numberOfBills: response & 0x7FFF,
    };
}

// console.log(parseStackerResponse('0014'));
// console.log(parseStackerResponse('8164'));

export function parseLevel1IdentificationWithoutOptionBits(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 29) {
        throw new Error('Invalid level 1 identification length, expected 29, got ' + bytes.length);
    }

    return {
        manufacturerCode: bytes.toString('ascii', 0, 3),
        serialNumber: bytes.toString('ascii', 3, 15),
        modelNumber: bytes.toString('ascii', 15, 27),
        softwareVersion: toInt(hex.substring(27 * 2)),
    };
}

// console.log(parseLevel1IdentificationWithoutOptionBits('49544c3030303030363138353136314e56313120333834203030300425'));

export function parseLevel2PlusIdentificationWithOptionBits(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 33) {
        throw new Error('Invalid level 2+ identification length, expected 33, got ' + bytes.length);
    }

    const optionalFeatures = bytes.readUInt32BE(29);

    return {
        ...parseLevel1IdentificationWithoutOptionBits(hex.substring(0, 29 * 2)),
        optionalFeatures: {
            ftl: (optionalFeatures & 0x1) === 0x1,
            billRecycling: (optionalFeatures & 0x2) === 0x2,
        },
    };
}

// console.log(parseLevel2PlusIdentificationWithOptionBits('49544c3030303030363138353136314e5631312033383420303030042500000002'));
