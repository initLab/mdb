import { Device } from './qibixx/index.js';

const path = '/dev/mdb-hat';
const device = new Device(path);
await device.connect();

console.log(device.versions);

await device.setGenericMaster(true);

const coinChangerFound = await device.sendGenericMaster(0x08);
console.log('coinChangerFound', coinChangerFound);

const billValidatorFound = await device.sendGenericMaster(0x30);
console.log('billValidatorFound', billValidatorFound);

await device.disconnect();
