import {
    parseLevel1IdentificationWithoutOptionBits,
    parseLevel2PlusIdentificationWithOptionBits,
    parsePollResponse,
    parseSetupResponse,
    parseStackerResponse,
} from '../mdb/billValidator.js';

export class BillValidator {
    #vmc;
    #status;

    constructor(vmc) {
        this.#clear();
        this.#vmc = vmc;
    }

    #clear() {
        this.#status = {
            // setup
            billValidatorFeatureLevel: null,
            countryCode: null,
            currencyCode: null,
            billScalingFactory: null,
            decimalPlaces: null,
            stackerCapacity: null,
            billSecurityLevels: null,
            hasEscrow: null,
            billTypeCredit: null,

            // expansion identification
            manufacturerCode: null,
            serialNumber: null,
            modelNumber: null,
            softwareVersion: null,
            optionalFeatures: null,

            // stacker
            stackerIsFull: null,
            numberOfBills: null,
        };
    }

    async prepare() {
        const hasBillValidator = await this.reset();
        console.log('Has bill validator', hasBillValidator);
    }

    async loop() {
        const pollResponses = await this.poll();

        if (typeof pollResponses === 'boolean') {
            return pollResponses;
        }

        for (const event of pollResponses) {
            switch (event?.type) {
                case 'VALIDATOR_WAS_RESET':
                    this.#clear();
                    await this.initialize();
                    console.log('Initialize', this.#status);
                    break;
                case 'VALIDATOR_BUSY':
                    // do nothing
                    break;
                case 'BILLS_ACCEPTED':
                    switch (event?.billRouting) {
                        case 'ESCROW_POSITION':
                            console.log('Inserted bill of type ' + event?.billType);
                            const accept = 0x00;
                            const escrowResponse = await this.escrow(accept);

                            if (accept) {
                                console.log(escrowResponse ? 'Accepted' : 'Failed to accept');
                            }
                            else {
                                console.log(escrowResponse ? 'Returned' : 'Failed to return');
                            }
                            break;
                    }
                    break;
                default:
                    console.log('EVENT', event);
                    break;
            }
        }

        return true;
    }

    async initialize() {
        const setupResponse = await this.setup();

        if (process.env.NODE_ENV !== 'production') {
            console.log('SETUP', setupResponse);
        }

        if (typeof setupResponse !== 'object') {
            throw new Error('Invalid setup response');
        }

        this.#status = {
            ...this.#status,
            ...setupResponse,
        };

        const expansionIdentificationResponse = await this.expansionIdentification();

        if (process.env.NODE_ENV !== 'production') {
            console.log('EXP.ID.1', expansionIdentificationResponse);
        }

        if (typeof expansionIdentificationResponse !== 'object') {
            throw new Error('Invalid expansion identification response');
        }

        this.#status = {
            ...this.#status,
            ...expansionIdentificationResponse,
        };

        const expansionIdentificationWithOptionBitsResponse = await this.expansionIdentificationWithOptionBits();

        if (process.env.NODE_ENV !== 'production') {
            console.log('EXP.ID.2', expansionIdentificationWithOptionBitsResponse);
        }

        if (typeof expansionIdentificationWithOptionBitsResponse !== 'object') {
            throw new Error('Invalid expansion identification with option bits response');
        }

        this.#status = {
            ...this.#status,
            ...expansionIdentificationWithOptionBitsResponse,
        };

        const expansionFeatureEnableResponse = await this.expansionFeatureEnable(0x02);

        if (process.env.NODE_ENV !== 'production') {
            console.log('EXP.FEAT.ENABLE', expansionFeatureEnableResponse);
        }

        if (expansionFeatureEnableResponse !== true) {
            throw new Error('Invalid expansion feature enable response');
        }

        const stackerResponse = await this.stacker();

        if (process.env.NODE_ENV !== 'production') {
            console.log('STACKER', stackerResponse);
        }

        if (typeof stackerResponse !== 'object') {
            throw new Error('Invalid stacker response');
        }

        this.#status = {
            ...this.#status,
            ...stackerResponse,
        };

        const billTypeResponse = await this.billType(0xFFFF, 0xFFFF);

        if (process.env.NODE_ENV !== 'production') {
            console.log('BILL TYPE', billTypeResponse);
        }

        if (billTypeResponse !== true) {
            throw new Error('Invalid bill type response');
        }
    }

    /*
     * RESET 0x30
     */
    async reset() {
        const response = await this.#vmc.transceive(0x30);

        if (typeof response !== 'boolean') {
            throw new Error('Unexpected bill validator reset response: ' + response);
        }

        return response;
    }

    /*
     * SETUP 0x31
     */
    async setup() {
        const response = await this.#vmc.transceive(0x31);
        return typeof response === 'string' ? parseSetupResponse(response) : response;
    }

    /*
     * SECURITY 0x32
     */
    async security() {
        throw new Error('Bill validator security is not implemented');
    }

    /*
     * POLL 0x33
     */
    async poll() {
        const response = await this.#vmc.transceive(0x33);
        return typeof response === 'string' ? parsePollResponse(response) : response;
    }

    /*
     * BILL TYPE 0x34
     */
    async billType(billEnable, billEscrowEnable) {
        const response = await this.#vmc.transceive(0x34, [
            (billEnable >> 8) & 0xFF, billEnable & 0xFF,
            (billEscrowEnable >> 8) & 0xFF, billEscrowEnable & 0xFF,
        ]);

        if (typeof response !== 'boolean') {
            throw new Error('Unexpected bill validator bill type response: ' + response);
        }

        return response
    }

    /*
     * ESCROW 0x35
     */
    async escrow(accept) {
        const response = await this.#vmc.transceive(0x35, [accept]);

        if (typeof response !== 'boolean') {
            throw new Error('Unexpected bill validator bill type response: ' + response);
        }

        return response
    }

    /*
     * STACKER 0x36
     */
    async stacker() {
        const response = await this.#vmc.transceive(0x36);
        return typeof response === 'string' ? parseStackerResponse(response) : response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x00
     */
    async expansionIdentification() {
        const response = await this.#vmc.transceive(0x37, [0x00]);
        return typeof response === 'string' ? parseLevel1IdentificationWithoutOptionBits(response) :
            response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x01
     */
    async expansionFeatureEnable(features) {
        const response = await this.#vmc.transceive(0x37, [
            0x01, (features >> 24) & 0xFF, (features >> 16) & 0xFF,
            (features >> 8) & 0xFF, features & 0xFF,
        ]);

        if (typeof response !== 'boolean') {
            throw new Error('Unexpected bill validator expansion feature enable response: ' + response);
        }

        return response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x02
     */
    async expansionIdentificationWithOptionBits() {
        const response = await this.#vmc.transceive(0x37, [0x02]);
        return typeof response === 'string' ? parseLevel2PlusIdentificationWithOptionBits(response) :
            response;
    }

    // TODO
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
}
