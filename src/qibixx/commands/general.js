import { command } from './util.js';

/**
 * Retrieve Version Information
 *
 * Answer:
 * v,s.s.s.s,xxxxxxxxxxxx
 *
 * Where:
 * s.s.s.s = software version
 * xxxxxxxx = CPU ID
 */
export const softwareVersion = command('V');

/**
 * Retrieve hardware info
 *
 * Answer:
 * h,x.x,yyyy
 *
 * Where:
 * x.x is the hardware version
 * yyyy are capabilities
 */
export const hardwareVersion = command('H');

/**
 * Reboot and enter firmware update mode
 *
 * Answer:
 * no answer is sent. The device enters bootloader mode
 */
export const update = command('F,UPDATE');

/**
 * Reset the interface by forcing a reboot
 *
 * This command, although accepted in the MDB-Pi Hat (Standard and Plus), does not reboot the interface. The interface can be rebooted by rebooting the Pi Hat (power cycle) or alternatively by toggling Raspberry's GPIO6 (setting to 0 to shutdown, and back to 1 to turn it back on).
 *
 * Answer:
 * No answer is sent. The device reboots.
 */
export const reset = command('F,RESET');

/**
 * Revert to default configuration
 * To roll back to default settings (nothing configured), issue the following command
 */
export const revert = command('F,REVERT');

/**
 * Set license code
 *
 * Answer:
 * f,ACK license has been set
 * f,NACK license code is not valid (or not applicable)
 */
export const set = licenseCode => command(`F,SET,${licenseCode}`);

/**
 * Modify Relay State
 *
 * This operation is only possible on MDB-USB Plus only!
 *
 * Answer:
 * l,ACK : success on activate/deactivate relay.
 * l,NACK: unknown parameter relay control, such as L,xx
 *
 * Possible States:
 * L,0: deactivate relays
 * L,1: activate relay 1
 * L,2: activate relay 2
 * L,3: activate both relays
 */
export const modifyRelayState = state => command(`L,${state}`);
