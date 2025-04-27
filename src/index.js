import { Device } from './qibixx/device.js';
import { sleep } from './util/index.js';
import { VMC } from './vmc/index.js';

const device = new Device('/dev/mdb-hat');
const vmc = new VMC(device);
await vmc.prepare();

while (await vmc.loop()) {
    await sleep(100);
}

await vmc.terminate();
