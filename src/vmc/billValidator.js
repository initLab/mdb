import {
    billValidatorOptionalFeatures,
    parseBillDispenseStatus,
    parseLevel1IdentificationWithoutOptionBits,
    parseLevel2PlusIdentificationWithOptionBits,
    parsePayoutStatus,
    parsePayoutValuePoll,
    parsePollResponse,
    parseRecyclerSetup,
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
            billValidator: {
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
            },
            billRecycler: {
                // recycler setup
                billTypeRouting: null,

                // bill dispense status
                dispenserFullStatus: null,
                billCount: null,
            },
        };
    }

    async prepare() {
        const hasBillValidator = await this.reset();
        console.log('Has bill validator', hasBillValidator);
    }

    async loop() {
        // const payoutValuePollResponse = await this.expansionPayoutValuePoll();
        // console.log('PAYOUT VALUE POLL', payoutValuePollResponse);
        //
        // if (payoutValuePollResponse === true) {
        //     const payoutStatusResponse = await this.expansionPayoutStatus();
        //     console.log('PAYOUT STATUS', payoutStatusResponse);
        // }

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
                    // const dispenseResponse = await this.expansionDispenseBill(1, 1);
                    // const dispenseResponse = await this.expansionDispenseValue(5);
                    // console.log(dispenseResponse);
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
        await this.resetSequence();
        await this.enableSequence();

        if (this.#status.billValidator.optionalFeatures?.billRecycling) {
            const billDispenseResponse = await this.expansionBillDispenseStatus();

            if (process.env.NODE_ENV !== 'production') {
                console.log('BILL DISPENSE STATUS', billDispenseResponse);
            }

            if (typeof billDispenseResponse !== 'object') {
                throw new Error('Invalid recycler enable response');
            }

            this.#status.billRecycler = {
                ...this.#status.billRecycler,
                ...billDispenseResponse,
            };
        }
    }

    async resetSequence() {
        const setupResponse = await this.setup();

        if (process.env.NODE_ENV !== 'production') {
            console.log('SETUP', setupResponse);
        }

        if (typeof setupResponse !== 'object') {
            throw new Error('Invalid setup response');
        }

        this.#status.billValidator = {
            ...this.#status.billValidator,
            ...setupResponse,
        };

        const securityResponse = await this.security(0xFFFF);

        if (process.env.NODE_ENV !== 'production') {
            console.log('SECURITY', securityResponse);
        }

        // TODO add security response to this.#status

        const expansionIdentificationResponse = await this.expansionIdentification();

        if (process.env.NODE_ENV !== 'production') {
            console.log('EXP.ID.1', expansionIdentificationResponse);
        }

        if (typeof expansionIdentificationResponse !== 'object') {
            throw new Error('Invalid expansion identification response');
        }

        this.#status.billValidator = {
            ...this.#status.billValidator,
            ...expansionIdentificationResponse,
        };

        const expansionIdentificationWithOptionBitsResponse = await this.expansionIdentificationWithOptionBits();

        if (process.env.NODE_ENV !== 'production') {
            console.log('EXP.ID.2', expansionIdentificationWithOptionBitsResponse);
        }

        if (typeof expansionIdentificationWithOptionBitsResponse !== 'object') {
            throw new Error('Invalid expansion identification with option bits response');
        }

        this.#status.billValidator = {
            ...this.#status.billValidator,
            ...expansionIdentificationWithOptionBitsResponse,
        };

        const billRecyclingSupported = expansionIdentificationWithOptionBitsResponse.optionalFeatures.billRecycling;
        const optionalFeatures = billRecyclingSupported ? billValidatorOptionalFeatures.billRecycling : 0;

        const expansionFeatureEnableResponse = await this.expansionFeatureEnable(optionalFeatures);

        if (process.env.NODE_ENV !== 'production') {
            console.log('EXP.FEAT.ENABLE', expansionFeatureEnableResponse);
        }

        if (expansionFeatureEnableResponse !== true) {
            throw new Error('Invalid expansion feature enable response');
        }

        if (billRecyclingSupported) {
            const recyclerSetupResponse = await this.expansionRecyclerSetup();

            if (process.env.NODE_ENV !== 'production') {
                console.log('RECYCLER SETUP', recyclerSetupResponse);
            }

            if (typeof recyclerSetupResponse !== 'object') {
                throw new Error('Invalid recycler setup response');
            }

            this.#status.billRecycler = {
                ...this.#status.billRecycler,
                ...recyclerSetupResponse,
            };

            const recyclerEnableResponse = await this.expansionRecyclerEnable(
                0x0000,
                Array(16).fill(0x03),
            );

            if (process.env.NODE_ENV !== 'production') {
                console.log('RECYCLER ENABLE', recyclerEnableResponse);
            }

            if (recyclerEnableResponse !== true) {
                throw new Error('Invalid recycler enable response');
            }
        }
    }

    async enableSequence() {
        const stackerResponse = await this.stacker();

        if (process.env.NODE_ENV !== 'production') {
            console.log('STACKER', stackerResponse);
        }

        if (typeof stackerResponse !== 'object') {
            throw new Error('Invalid stacker response');
        }

        this.#status.billValidator = {
            ...this.#status.billValidator,
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
    async security(billTypes) {
        return await this.#vmc.transceive(0x32, [
            (billTypes >> 8) & 0xFF, billTypes & 0xFF,
        ]);
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

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x03
     */
    async expansionRecyclerSetup() {
        const response = await this.#vmc.transceive(0x37, [0x03]);
        return typeof response === 'string' ? parseRecyclerSetup(response) : response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x04
     */
    async expansionRecyclerEnable(manualDispenseEnable, billsRecyclerEnabled) {
        return await this.#vmc.transceive(0x37, [
            0x04,
            (manualDispenseEnable >> 8) & 0xFF, manualDispenseEnable & 0xFF,
            ...billsRecyclerEnabled,
        ]);
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x05
     */
    async expansionBillDispenseStatus() {
        const response = await this.#vmc.transceive(0x37, [0x05]);
        return typeof response === 'string' ? parseBillDispenseStatus(response) : response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x06
     */
    async expansionDispenseBill(billType, numberOfBills) {
        return await this.#vmc.transceive(0x37, [
            0x06,
            billType & 0x0F,
            (numberOfBills >> 8) & 0xFF, numberOfBills & 0xFF,
        ]);
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x07
     */
    async expansionDispenseValue(valueOfBills) {
        return await this.#vmc.transceive(0x37, [
            0x07,
            (valueOfBills >> 8) & 0xFF, valueOfBills & 0xFF,
        ]);
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x08
     */
    async expansionPayoutStatus() {
        const response = await this.#vmc.transceive(0x37, [0x08]);
        return typeof response === 'string' ? parsePayoutStatus(response) : response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x09
     */
    async expansionPayoutValuePoll() {
        const response = await this.#vmc.transceive(0x37, [0x09]);
        return typeof response === 'string' ? parsePayoutValuePoll(response) : response;
    }

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0x0A
     */
    async expansionPayoutCancel() {
        return await this.#vmc.transceive(0x37, [0x0A]);
    }

    // TODO FTL commands
    // command 0x37, sub command 0xFA-0xFE

    /*
     * EXPANSION COMMAND 0x37
     * SUB-COMMAND 0xFF
     */
    async expansionDiagnostics(data = []) {
        return await this.#vmc.transceive(0x37, [
            0xFF,
            ...data,
        ]);
    }
}
