import { toHexByte } from '../util.js';

/**
 * Master Command Group
 * With the Master Commands, the interface can be used to implement or simulate a "Vending Machine Controller".
 * Any communication initiated with the following commands will send out on the "TX" line of the MDB interface, answers will be expected on the "RX" line.
 * The M command is used to start or stop Master Mode. On the Pi Hat interface starting Master Mode will automatically set the slave (RX) interface pull-up to active so that slaves can answer to the master.
 * Stopping Master Mode will disable the pull-up on the RX interface line.
 */
export const enableGenericMaster = 'M,1';
export const disableGenericMaster = 'M,0';

/**
 * Request Command Group (used for Master implementation)
 * MDB Generic Master sends request to the Bus using "R" command set. These commands have the following structure.
 */
export const requestCommandGroup = (slave, data = []) => {
    const hexData = data.map(toHexByte).join('');
    return `R,${toHexByte(slave)}${hexData.length ? `,${hexData}` : ''}`;
};

/**
 * Issue a bus reset condition to the MDB Bus
 */
export const busReset = 'R,RESET';
