import { CoinChanger } from './coinChanger.js';
import { BillValidator } from './billValidator.js';

export class VMC {
    #device;
    #coinChanger;
    #billValidator;
    #prepared = false;

    constructor(device) {
        this.#device = device;
        this.#coinChanger = new CoinChanger(this);
        this.#billValidator = new BillValidator(this);
    }

    async terminate() {
        if (!this.#device) {
            console.warn('Duplicate terminate call, ignoring');
            return;
        }

        const device = this.#device;
        this.#device = null;

        await device.disconnect();
    }

    async prepare() {
        if (this.#prepared) {
            console.warn('Already prepare');
        }

        this.#prepared = true;

        await this.#device.connect();

        console.log('VERSIONS', this.#device.versions);

        await this.#device.setGenericMaster(true);

        await this.#coinChanger.prepare();
        await this.#billValidator.prepare();
    }

    async loop() {
        let result = true;

        if (!await this.#coinChanger.loop()) {
            console.warn('Coin changer terminated the loop');
            result = false;
        }

        if (!await this.#billValidator.loop()) {
            console.warn('Bill validator terminated the loop');
            result = false;
        }

        return result;
    }

    async transceive(slave, data) {
        return await this.#device.sendGenericMaster(slave, data);
    }
}
