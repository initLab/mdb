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
export const setRs232Baudrate = baudrate => `F,SERIAL,${baudrate}`;

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
export const respTimeout = timeout => `F,RESPTIMEOUT,${timeout}`;

export const disableCashlessSlave = 'C,0';

/**
 * Set Cashless Slave Parameter
 *
 * Many "modern" peripherals do not answer within the default answer time (first character must be sent within 5ms). If you have trouble with a device, adjust the timeout with the F,RESPTIMEOUT, command documented above.
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
export const setCashlessSlaveParameter = (parameter, value) => `C,SETCONF,${parameter}=${value}`;

/**
 * Set Cashless Master Parameter
 *
 * Answer:
 * d,SET,OK
 *
 * Description:
 * Assigns value to parameter. The list of possible parameters is presented in the table below. To confirm the respective possible values, please check MDB specification.
 */
export const setCashlessMasterParameter = (parameter, value) => `D,SETCONF,${parameter}=${value}`;
