#!/usr/bin/env node

import { ReadlineParser } from '@serialport/parser-readline';
import { hardwareVersion, softwareVersion } from './qibixx/commands/general.js';
import { sleep } from './util/index.js';
import { enableGenericMaster, requestCommandGroup } from './qibixx/commands/master/generic.js';
import { connectPort, resetDevice } from './qibixx/index.js';
import { parseVersion } from './qibixx/util.js';

let response = null;

async function getDevice(path) {
    const versions = {
        software: {
            version: {
                major: 0,
                minor: 0,
                patch: 0,
                build: 0,
            },
            cpuId: '',
        },
        hardware: {
            version: {
                major: 0,
                minor: 0,
                patch: 0,
                build: 0,
            },
            capabilities: '',
        },
    };
    const port = await connectPort(path);
    const parser = port.pipe(new ReadlineParser({
        delimiter: '\r\n',
    }));
    parser.on('data', parseLine);
    await port.writeAndDrain(softwareVersion);
    await port.writeAndDrain(hardwareVersion);
    await port.writeAndDrain(enableGenericMaster);
    // await port.writeAndDrain(enableMdbSniffing);

    function parseLine(line) {
        console.log('reading', JSON.stringify(line));
        const parts = line.split(',');

        switch (parts[0]) {
            case 'v':
                console.log('Software version:', parts[1]);
                console.log('CPU ID:', parts[2]);
                versions.software = {
                    version: parseVersion(parts[1]),
                    cpuId: parts[2],
                }
                break;
            case 'h':
                console.log('Hardware version:', parts[1]);
                console.log('Capabilities:', parts[2]);
                versions.hardware = {
                    version: parseVersion(parts[1]),
                    capabilities: parts[2],
                }
                break;
            case 'x':
                if (parts[1] === 'ACK') {
                    break;
                }

                console.log(parts[2], parts[1], parts[3], parts[4]);
                break;
            case 'm':
                switch (parts[1]) {
                    case 'ACK':
                        console.log('Success on enable/disable master mode');
                        break;
                    case 'NACK':
                        console.log('Unknown parameter on master control');
                        break;
                    default:
                        console.log('Unknown response on master control: ', parts);
                        break;
                }
                break;
            case 'p':
                switch (parts[1]) {
                    case 'ACK':
                        console.log('Slave device acknowledged the command');
                        response = true;
                        break;
                    case 'NACK':
                        console.log('Slave device did not answer the command');
                        response = false;
                        break;
                    default:
                        console.log('Slave device answered with command: ', parts);
                        response = Buffer.from(parts[1], 'hex');
                        break;
                }
                break;
            default:
                console.log('Unknown packet type:', parts[0]);
        }
    }

    return {
        getVersions: () => versions,
        sendCommand: async cmd => port.writeAndDrain(cmd),
    };
}

const path = '/dev/mdb-hat';

// Reset device to ensure state is consistent
await resetDevice(path);
await sleep(1_000);

// Connect to the device after it has been reset
const device = await getDevice(path);
await sleep(1_000);
console.log(device.getVersions());
// await device.sendCommand(busReset);
// await sleep(500);
// await coinChanger();
await billValidator();

// noinspection JSUnusedLocalSymbols
async function coinChanger() {
    await device.sendCommand(requestCommandGroup(0x08));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x09));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x0F, [0x00]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x0F, [0x01, 0x00, 0x00, 0x00, 0x06]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x0F, [0x05]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x0A));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x0C, [0xFF, 0xFF, 0xFF, 0xFF]));
    await sleep(500);

    setInterval(async () => {
        await device.sendCommand(requestCommandGroup(0x0B));
    }, 1_000);
}

// noinspection JSUnusedLocalSymbols
async function billValidator() {
    await device.sendCommand(requestCommandGroup(0x30));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x33));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x31));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x00]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x02]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x01, 0x00, 0x00, 0x00, 0x02]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x36));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x34, [0xFF, 0xFF, 0xFF, 0xFF]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x03, 0xFF, 0xFF]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x04, 0xFF, 0xFF, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x05]));
    await sleep(500);
    await device.sendCommand(requestCommandGroup(0x37, [0x06, 0x01, 0x00, 0x02]));
    await sleep(500);


    setInterval(async () => {
        response = null;
        await device.sendCommand(requestCommandGroup(0x33));
        await sleep(100);

        if (typeof response !== 'object') {
            return;
        }

        for (const b of response) {
            if ((b & 0xF0) === 0x90) {
                const type = b & 0x0F;
                console.log('Inserted banknote of type ' + type);
                await device.sendCommand(requestCommandGroup(0x35, [0x01]));
                console.log('Returned');
            }
        }
    }, 1_000);
}
