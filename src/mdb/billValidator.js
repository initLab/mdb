import { hexToBuffer, toInt } from '../util/index.js';
import { readByteArray, readShortArray, splitToBits } from './util.js';

const billRoutingCodes = {
    0b000: 'BILL_STACKED',
    0b001: 'ESCROW_POSITION',
    0b010: 'BILL_RETURNED',
    0b011: 'BILL_TO_RECYCLER',
    0b100: 'DISABLED_BILL_REJECTED',
    0b101: 'BILL_TO_RECYCLER_MANUAL_FILL',
    0b110: 'MANUAL_DISPENSE',
    0b111: 'TRANSFERRED_FROM_RECYCLER_TO_CASHBOX',
};

const billValidatorStatuses = {
    0b00000001: {
        type: 'DEFECTIVE_MOTOR',
        description: 'One of the motors has failed to perform its expected assignment.',
    },
    0b00000010: {
        type: 'SENSOR_PROBLEM',
        description: 'One of the sensors has failed to provide its response.',
    },
    0b00000011: {
        type: 'VALIDATOR_BUSY',
        description: 'The validator is busy and can not answer a detailed command right now.',
    },
    0b00000100: {
        type: 'VALIDATOR_ROM_CHECKSUM_ERROR',
        description: 'The validators internal checksum does not match the calculated checksum.',
    },
    0b00000101: {
        type: 'VALIDATOR_JAMMED',
        description: 'A bill(s) has jammed in the acceptance path.',
    },
    0b00000110: {
        type: 'VALIDATOR_WAS_RESET',
        description: 'The validator has been reset since the last POLL.',
    },
    0b00000111: {
        type: 'BILL_REMOVED',
        description: 'A bill in the escrow position has been removed by an unknown means. A BILL RETURNED message should also be sent.',
    },
    0b00001000: {
        type: 'CASH_BOX_OUT_OF_POSITION',
        description: 'The validator has detected the cash box to be open or removed.',
    },
    0b00001001: {
        type: 'VALIDATOR_DISABLED',
        description: 'The validator has been disabled, by the VMC or because of internal conditions.',
    },
    0b00001010: {
        type: 'INVALID_ESCROW_REQUEST',
        description: 'An ESCROW command was requested for a bill not in the escrow position.',
    },
    0b00001011: {
        type: 'BILL_REJECTED',
        description: 'A bill was detected, but rejected because it could not be identified.',
    },
    0b00001100: {
        type: 'POSSIBLE_CREDITED_BILL_REMOVAL',
        description: 'There has been an attempt to remove a credited (stacked) bill.',
    },
};

const billRecyclerStatuses = {
    0b00100001: {
        type: 'ESCROW_REQUEST',
        description: 'An escrow lever activation has been detected. If a button is present and activated.',
    },
    0b00100010: {
        type: 'DISPENSER_PAYOUT_BUSY',
        description: 'The dispenser is busy activating payout devices.',
    },
    0b00100011: {
        type: 'DISPENSER_BUSY',
        description: 'The dispenser is busy and can not answer a detailed command right now.',
    },
    0b00100100: {
        type: 'DEFECTIVE_DISPENSER_SENSOR',
        description: 'The dispenser has detected one of the dispenser sensors behaving abnormally.',
    },
    // 0b00100101: not used
    0b00100110: {
        type: 'DISPENSER_DID_NOT_START',
        description: 'Dispenser did not start / motor problem.',
    },
    0b00100111: {
        type: 'DISPENSER_JAM',
        description: 'A dispenser payout attempt has resulted in jammed condition.',
    },
    0b00101000: {
        type: 'RECYCLER_ROM_CHECKSUM_ERROR',
        description: 'The dispensers internal checksum does not match the calculated checksum. (If separate from validator microprocessor.)',
    },
    0b00101001: {
        type: 'DISPENSER_DISABLED',
        description: 'Dispenser disabled because of error or bill in escrow position.',
    },
    0b00101010: {
        type: 'BILL_WAITING',
        description: 'Bill waiting for customer removal.',
    },
    // 0b00101011: not used
    // 0b00101100: not used
    // 0b00101101: not used
    // 0b00101110: not used
    0b00101111: {
        type: 'FILLED_KEY_PRESSED',
        description: 'The VMC should request a new DISPENSER STATUS.',
    },
};

export const billValidatorOptionalFeatures = {
    ftl: 0x01,
    billRecycling: 0x02,
};

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

export function parsePollResponse(hex) {
    const bytes = hexToBuffer(hex);

    if ((bytes[0] & 0xF0) === 0x10) {
        return parseFtlResponse(bytes);
    }

    if (bytes.length > 16) {
        throw new Error('Invalid poll response length, expected 16 or less bytes, got ' + bytes.length);
    }

    return Array.from(bytes).map(parseBillValidatorActivity);
}

// console.log(parsePollResponse('069091929380818283a0a1a2a3'));

function parseFtlResponse(bytes) {
    switch (bytes[0]) {
        case 0x1B:
            if (bytes.length !== 6) {
                throw new Error('Invalid FTL REQ TO RCV length, got ' + bytes.length + ', expected 6');
            }

            return {
                type: 'REQ_TO_RCV',
                destinationAddressOfResponse: bytes[1],
                sourceAddressOfResponse: bytes[2],
                fileId: bytes[3],
                maximumLength: bytes[4],
                control: bytes[5],
            };
        case 0x1C:
            if (bytes.length !== 4) {
                throw new Error('Invalid FTL RETRY/DENY length, got ' + bytes.length + ', expected 4');
            }

            return {
                type: 'RETRY_DENY',
                destinationAddressOfResponse: bytes[1],
                sourceAddressOfResponse: bytes[2],
                retryDelay: bytes[3],
            };
        case 0x1D:
            if (bytes.length < 4 || bytes.length > 34) {
                throw new Error('Invalid FTL SEND BLOCK length, got ' + bytes.length + ', expected 4-34');
            }

            return {
                type: 'SEND_BLOCK',
                destinationAddressOfData: bytes[1],
                blockNumber: bytes[2],
                data: bytes.subarray(3),
            };
        case 0x1E:
            if (bytes.length !== 3) {
                throw new Error('Invalid FTL OK TO SEND length, got ' + bytes.length + ', expected 3');
            }

            return {
                type: 'OK_TO_SEND',
                destinationAddressOfResponse: bytes[1],
                sourceAddressOfResponse: bytes[2],
            };
        case 0x1F:
            if (bytes.length !== 6) {
                throw new Error('Invalid FTL REQ TO SEND length, got ' + bytes.length + ', expected 6');
            }

            return {
                type: 'REQ_TO_SEND',
                destinationAddressOfResponse: bytes[1],
                sourceAddressOfResponse: bytes[2],
                fileId: bytes[3],
                maximumLength: bytes[4],
                control: bytes[5],
            };
        default:
            throw new Error('Unsupported FTL response: ' + bytes[0]);
    }
}

function parseBillValidatorActivity(byte) {
    if ((byte & 0xF0) === 0x00) {
        // Bill validator
        if (!Object.hasOwn(billValidatorStatuses, byte)) {
            throw new Error('Unsupported bill validator status: ' + byte);
        }

        return billValidatorStatuses[byte];
    }

    if ((byte & 0xF0) === 0x10) {
        throw new Error('Unexpected FTL response in bill validator activity');
    }

    if ((byte & 0xF0) === 0x20) {
        // Bill recycler
        if (!Object.hasOwn(billRecyclerStatuses, byte)) {
            throw new Error('Unsupported bill recycler status: ' + byte);
        }

        return billRecyclerStatuses[byte];
    }

    if ((byte & 0xE0) === 0x40) {
        // Number of attempts to input a bill while validator is disabled.
        const numberOfAttempts = byte & 0x1F;

        return {
            type: 'INPUT_BILL_WHILE_DISABLED',
            numberOfAttempts,
        };
    }

    if ((byte & 0x80) === 0x80) {
        // Bills accepted
        const billRoutingCode = (byte & 0x70) >> 4;
        const billRouting = billRoutingCodes[billRoutingCode];
        const billType = (byte & 0x0F);

        return {
            type: 'BILLS_ACCEPTED',
            billRouting,
            billType,
        };
    }
}

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

export function parseRecyclerSetup(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 2) {
        throw new Error('Invalid recycler setup length, expected 2, got ' + bytes.length);
    }

    const billTypeRouting = splitToBits(bytes.readUInt16BE(), 16);

    return {
        billTypeRouting,
    };
}

// console.log(parseRecyclerSetup('0002'));

export function parseBillDispenseStatus(hex) {
    const bytes = hexToBuffer(hex);

    if (bytes.length !== 34) {
        throw new Error('Invalid bill dispense status length, expected 34, got ' + bytes.length);
    }

    const dispenserFullStatus = splitToBits(bytes.readUInt16BE(), 16);
    const billCount = readShortArray(bytes, 2, 16);

    return {
        dispenserFullStatus,
        billCount,
    };
}

// console.log(parseBillDispenseStatus('00000000000a00000000000000000000000000000000000000000000000000000000'));
