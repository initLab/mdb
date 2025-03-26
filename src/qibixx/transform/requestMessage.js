import { Transform } from 'node:stream';
import { hardwareVersion, modifyRelayState, reset, revert, set, softwareVersion, update } from '../commands/general.js';
import { disableMdbSniffing, enableMdbSniffing } from '../commands/sniff.js';
import {
    disableCashlessSlave,
    respTimeout,
    setCashlessMasterParameter,
    setCashlessSlaveParameter,
    setRs232Baudrate,
} from '../commands/configuration.js';
import {
    cancelPendingVendingRequest,
    disableCashlessMaster,
    enableCashlessMasterAlwaysIdle,
    enableCashlessMasterAuthorizeFirst,
    endAndFinalizeTransaction,
    endAndRevertTransaction,
    getCashlessStatusFromMaster,
    requestCredit,
    startPollingCashlessReader,
} from '../commands/master/cashless.js';
import {
    busReset,
    disableGenericMaster,
    enableGenericMaster,
    requestCommandGroup,
} from '../commands/master/generic.js';

export class RequestMessageTransform extends Transform {
    constructor() {
        super({
            writableObjectMode: true,
        });
    }

    _transform(chunk, encoding, callback) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('write', chunk);
        }

        switch (chunk?.type) {
            // General
            case 'softwareVersion':
                callback(null, softwareVersion);
                break;
            case 'hardwareVersion':
                callback(null, hardwareVersion);
                break;
            case 'update':
                callback(null, update);
                break;
            case 'reset':
                callback(null, reset);
                break;
            case 'revert':
                callback(null, revert);
                break;
            case 'setLicenseCode':
                callback(null, set(chunk.licenseCode));
                break;
            case 'modifyRelayState':
                callback(null, modifyRelayState(chunk.state));
                break;

            // Sniff
            case 'setMdbSniffing':
                callback(null, chunk.enabled ? enableMdbSniffing : disableMdbSniffing);
                break;

            // Configuration
            case 'setRs232Baudrate':
                callback(null, setRs232Baudrate(chunk.baudrate));
                break;
            case 'setRespTimeout':
                callback(null, respTimeout(chunk.timeout));
                break;

            // Cashless slave
            case 'disableCashlessSlave':
                callback(null, disableCashlessSlave);
                break;
            case 'setCashlessSlaveParameter':
                callback(null, setCashlessSlaveParameter(chunk.parameter, chunk.value));
                break;

            // Cashless master
            case 'setCashlessMasterParameter':
                callback(null, setCashlessMasterParameter(chunk.parameter, chunk.value));
                break;
            case 'disableCashlessMaster':
                callback(null, disableCashlessMaster);
                break;
            case 'enableCashlessMasterAuthorizeFirst':
                callback(null, enableCashlessMasterAuthorizeFirst);
                break;
            case 'enableCashlessMasterAlwaysIdle':
                callback(null, enableCashlessMasterAlwaysIdle);
                break;
            case 'startPollingCashlessReader':
                callback(null, startPollingCashlessReader);
                break;
            case 'requestCashlessMasterCredit':
                callback(null, requestCredit(chunk.amount, chunk.product));
                break;
            case 'cancelPendingCashlessMasterVendingRequest':
                callback(null, cancelPendingVendingRequest);
                break;
            case 'endAndFinalizeCashlessMasterTransaction':
                callback(null, endAndFinalizeTransaction(chunk.softwareVersion, chunk.productId));
                break;
            case 'endAndRevertCashlessMasterTransaction':
                callback(null, endAndRevertTransaction);
                break;
            case 'getCashlessStatusFromMaster':
                callback(null, getCashlessStatusFromMaster);
                break;

            // Generic master
            case 'setGenericMaster':
                callback(null, chunk.enabled ? enableGenericMaster : disableGenericMaster);
                break;
            case 'genericMasterRequestCommandGroup':
                callback(null, requestCommandGroup(chunk.slave, chunk?.data ?? []));
                break;
            case 'genericMasterBusReset':
                callback(null, busReset);
                break;

            default:
                callback(new Error(`Unsupported request message type: ${chunk?.type}`));
        }
    }
}
