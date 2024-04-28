export const command = content => `${content}\n`;

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

/**
 * Set RS232 Interface Baudrate (MDB USB Plus & MDB USB Ultra versions only)
 *
 * By default, the MDB-USB will communicate through the USB interface and ignore the serial port.
 *
 * To communicate through the RS232 interface, it is necessary to first configure a baudrate for the serial port via USB.
 * Note that you will need to unplug USB (you can provide power, but no USB host must be connected) for the device to use the serial port.
 *
 * This configuration is stored in nonvolatile memory and, therefore, it is not needed to set this configuration at each boot.
 *
 * The serial port uses the exact same command set which is used on the USB port.
 *
 * When the device boots, it first tries to detect a USB host. Only if NO USB host is available AND a serial baudrate is configured the device will switch to the RS-232 host interface.
 *
 * Answer:
 * f,ACK
 *
 * Description:
 * Sets the serial port (RS232) Baudrate. Default (0) means serial port disabled.
 */
export const setRs232Baudrate = baudrate => command(`F,SERIAL,${baudrate}`);

/**
 * Set the response timeout (milliseconds)
 *
 * Answer:
 * f,ACK
 *
 * Description:
 * While in master mode, the MDB interface, will wait this amount of time, before it assumes the peripheral does not answer the POLLS and therefore, is disconnected. This value, by standard, will be 5ms, but many "modern" Peripherals are much slower. The timeout value can be configured in a range from 10 to 1000.
 * If you have problems with a peripheral, try to set the value to 1000.
 */
export const respTimeout = timeout => command(`F,RESPTIMEOUT,${timeout}`);

export const disableCashlessSlave = command('C,0');

/**
 * Set Cashless Slave Parameter
 *
 * Many "modern" peripherals do not answer within the default answer time (first character must be send within 5ms). If you have trouble with a device, adjust the timeout with the F,RESPTIMEOUT, command documented above.
 *
 * To perform configurations on the cashless peripheral, it is necessary to disable the cashless peripheral first. That can be done by issuing the following command above.
 *
 * These parameters must be set every time that the interface is powered on.
 *
 * Answer:
 * c,SET,OK
 *
 * Description:
 * Assigns value to parameter. The list of possible parameters is presented in the table below. To confirm the respective possible values, please check MDB specification.
 */
export const setCashlessSlaveParameter = (parameter, value) => command(`C,SETCONF,${parameter}=${value}`);

/**
 * Set Cashless Master Parameter
 *
 * Answer:
 * d,SET,OK
 *
 * Description:
 * Assigns value to parameter. The list of possible parameters is presented in the table below. To confirm the respective possible values, please check MDB specification.
 */
export const setCashlessMasterParameter = (parameter, value) => command(`D,SETCONF,${parameter}=${value}`);

/**
 * Sniff (Telemetry)
 *
 * Our MDB devices have a sniffing method which allows to have a detailed overview of what is happening in the MDB bus.
 *
 * To start the sniffer instance just issue this command
 *
 * Answer:
 * x,ACK
 */
export const enableMdbSniffing = command('X,1');
export const disableMdbSniffing = command('X,0');
