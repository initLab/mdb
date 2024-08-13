#!/usr/bin/env node

import { ReadlineParser } from '@serialport/parser-readline';
import { SequentialSerial } from './serialport/index.js';
import { hardwareVersion, reset, softwareVersion } from './qibixx/commands/general.js';
import { sleep } from './util/index.js';
import { busReset, requestCommandGroup } from './qibixx/commands/master/generic.js';

async function connectPort(path) {
    console.log('Opening port');
    const port = await SequentialSerial.create({
        path,
        baudRate: 115200,
    });
    console.log('Port opened');

    return port;
}

async function resetDevice(path) {
    const port = await connectPort(path);
    await port.writeAndDrain(reset);
    await port.closeAsync();
}

const toInt = str => parseInt(str, 10);

function parseVersion(str) {
    const [ major, minor, patch, build] = str.split('.').map(toInt);
    return { major, minor, patch, build };
}

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
    await port.writeAndDrain('M,1\n');

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
                        break;
                    case 'NACK':
                        console.log('Slave device did not answer the command');
                        break;
                    default:
                        console.log('Slave device answered with command: ', parts);
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
await device.sendCommand(busReset);
await sleep(500);
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

setInterval(async () => {
    await device.sendCommand(requestCommandGroup(0x0B));
}, 1_000);
