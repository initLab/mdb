import { Device } from './qibixx/index.js';
import { sleep } from './util/index.js';
import {
    parseLevel1IdentificationWithoutOptionBits,
    parseLevel2PlusIdentificationWithOptionBits,
    parsePollResponse,
    parseSetupResponse,
    parseStackerResponse,
} from './mdb/billValidator.js';

const path = '/dev/mdb-hat';
const device = new Device(path);
await device.connect();

console.log(device.versions);

await device.setGenericMaster(true);

const coinChangerFound = await device.sendGenericMaster(0x08);
console.log('coinChangerFound', coinChangerFound);

const billValidatorFound = await device.sendGenericMaster(0x30);
console.log('billValidatorFound', billValidatorFound);

if (billValidatorFound) {
    const pollResponse = await device.sendGenericMaster(0x33);
    console.log('POLL', typeof pollResponse === 'string' ? parsePollResponse(pollResponse) : pollResponse);
    const setupResponse = await device.sendGenericMaster(0x31);
    console.log('SETUP', parseSetupResponse(setupResponse));
    const expansionIdL1Response = await device.sendGenericMaster(0x37, [0x00]);
    console.log('EXP.ID.1', parseLevel1IdentificationWithoutOptionBits(expansionIdL1Response));
    const expansionIdL2Response = await device.sendGenericMaster(0x37, [0x02]);
    console.log('EXP.ID.2', parseLevel2PlusIdentificationWithOptionBits(expansionIdL2Response));
    const expansionFeatureEnableResponse = await device.sendGenericMaster(0x37, [0x01, 0x00, 0x00, 0x00, 0x02]);
    console.log('EXP.FEAT.ENABLE', expansionFeatureEnableResponse);
    const stackerResponse = await device.sendGenericMaster(0x36);
    console.log('STACKER', parseStackerResponse(stackerResponse));
    const billTypeResponse = await device.sendGenericMaster(0x34, [0xFF, 0xFF, 0xFF, 0xFF]);
    console.log('BILL TYPE', billTypeResponse);
    /*
    const x3703 = await device.sendGenericMaster(0x37, [0x03, 0xFF, 0xFF]);
    console.log('x3703', x3703);
    const x3704 = await device.sendGenericMaster(0x37, [0x04, 0xFF, 0xFF, 0x03, 0x03, 0x03,
     0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03]);
    console.log('x3704', x3704);
    const x3705 = await device.sendGenericMaster(0x37, [0x05]);
    console.log('x3705', x3705);
    const x3706 = await device.sendGenericMaster(0x37, [0x06, 0x01, 0x00, 0x02]);
    console.log('x3706', x3706);
    */

    while (true) {
        await sleep(1_000);

        const pollResponse = await device.sendGenericMaster(0x33);

        if (typeof pollResponse !== 'string') {
            if (process.env.NODE_ENV !== 'production') {
                console.log('POLL', pollResponse);
            }

            continue;
        }

        const parsedPollResponse = parsePollResponse(pollResponse);
        console.log('POLL', parsedPollResponse);

        for (const event of parsedPollResponse) {
            if (event?.type === 'BILLS_ACCEPTED' && event?.billRouting === 'ESCROW_POSITION') {
                console.log('Inserted bill of type ' + event?.billType);
                const accept = 0x00;
                const escrowResponse = await device.sendGenericMaster(0x35, [accept]);

                if (accept) {
                    console.log(escrowResponse ? 'Accepted' : 'Failed to accept');
                }
                else {
                    console.log(escrowResponse ? 'Returned' : 'Failed to return');
                }
            }
        }
    }
}

await device.disconnect();
