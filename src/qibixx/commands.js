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

/**
 * Enable/Disable Cashless Master
 * Prior to initiating transactions with the MDB Bus, it is necessary to Enable the Cashless Master. Specifically for Cashless Devices, in addition to "Idle" Mode, it is also possible to enable the Device in "Always Idle" Mode.
 *
 * "Authorization First" First Mode - Vending sessions are initiated by the Cashless Peripherals (Meaning that in a real terminal, the user would first have to swipe his card to pre-authorize a certain amount, and then select the product. Further information in Cashless Slave).
 *
 * "Always Idle"/Selection First Mode (direct vend), the Master can request the credit to the Cashless Slave first, and therefore it will start the session (In a real terminal, the user would select the product first on the machine, and then swipe the card to confirm the requested amount).
 */
export const disableCashlessMaster = command('D,0');
export const enableCashlessMasterAuthorizeFirst = command('D,1');
export const enableCashlessMasterAlwaysIdle = command('D,2');

/**
 * Start polling for the Cashless Reader
 * Once the Master and Slave are enabled (please see instructions to enable Slave Peripherals in Cashless Peripheral) , the master can start polling the Cashless Reader, by issuing the command below.
 *
 * This instruction must be issued every time the Cashless Master is enabled or booted.
 *
 * Answer:
 * d,STATUS,IDLE
 * d,ERR,"-1" # Cashless Slave is not enabled to start polling
 */
export const startPollingCashlessReader = command('D,READER,1');

/**
 * Request Credit
 * The following command is used to send a request to the Cashless Slave. When the Cashless Master is configured in "Idle" Mode, this command should be preceded by a start session command (further info in Cashless Peripheral ). If the Cashless Master is configured in "Always Idle" Mode, the instruction below will trigger a "Start" operation on the slave.
 */

export const requestCredit = (amount, product) => command(`D,REQ,${amount},${product}`);

/**
 * Cancel a pending vending request
 */
export const cancelPendingVendingRequest = command('D,REQ,-1');

/**
 * End and finalize a transaction
 */
export const endAndFinalizeTransaction = (softwareVersion, productId) => command(`D,END${
    softwareVersion.major > 3 || softwareVersion.major === 3 && softwareVersion.minor >= 8 ?
        `,${productId}` : ''
}`);

/**
 * End and revert a transaction
 */
export const endAndRevertTransaction = command('D,END,-1');

/**
 * Cashless master answers
 *
 * D,ERR,"cashless master is on"	Master instance was already ON
 * d,STATUS,RESET	Master/VMC instance was initialized and there are no peripherals connected to it
 * d,STATUS,INIT,1	There is a peripheral on the bus and the master instance is polling it
 * d,STATUS,IDLE	The reader is enabled and VMC is Idle (waiting for a vending cycle to be started)
 * d,STATUS,CREDIT,-1	The peripheral has started the session and a payment method with has been inserted
 * d,STATUS,RESULT,-1	The terminal has denied the vending session. E.g. due to lack of funds in the credit card.
 * d,STATUS,VEND	A vending request has been made by the master instance and it is waiting for the slave to accept it
 * d,STATUS,RESULT,1,1.50	The peripheral has accepted 1.50€ for the VMC vending request
 * d,ERR,-1	Command not applicable in current state
 */

/**
 * Get Cashless Status From Master
 *
 * Answer:
 * d,STATUS,<status>,#,<featurelevel>,<CurrCode>,<scalefac>,<decimals>,<timeout>,<flags>,<direct_vend_mode>
 *
 * <featurelevel>,<CurrCode>,<scalefac>,<decimals>,<timeout> and <flags> <direct_vend_mode>are all part of the information exchanged between the Cashless Terminal and the VMC during setup. Please refer to section 7.4.2 of the MDB Specification for more details about these fields.
 *
 * status: The state of the Cashless Reader:
 * INIT: The reader is active but waiting to be enabled (meaning it is not yet ready to accept payments)
 * IDLE: The reader is Enabled, waiting for a session to be started(If Idle/Authorization First), or a vend request from the machine(If always Idle/Selection First).
 * VEND: The reader has received a request for a value and is processing it (the VMC is waiting for the reader to confirm the transaction).
 * RESULT: The result of the vend request. In other words, tells if the reader approved the request. If so, the result will be d,STATUS,RESULT,1,<credit>,#,.....
 *
 * featurelevel: Reader announced MDB Feature level
 * CurrCode: Reader Currency Code
 * scalefac: Country/Currency Code
 * decimals: Decimal Places
 * timeout: Application Maximum Response time (s)
 * flags: Miscellaneous options announced by the reader during the setup
 * direct_vend___mode: It will display 1 or 2 depending if you start with D,1 or D,2.
 *
 * NOTE: Even if you start with D,2 but the machine does not support it, it will display 1
 */

export const getCashlessStatusFromMaster = command('D,STATUS');

/**
 * Examples
 *
 * d,STATUS,INIT,1,#,3,1756,1,2,30,8 Reader level 3, <!--currency code Swiss francs (756),Scaling factor 1,2 decimal places, 30s timeout, and bit 3 of flags enabled=Supports Cash Sale subcommand -->
 * (Reader enabled during this interval ...)
 * d,STATUS,IDLE,#,3,1756,1,2,30,8
 * (Vend Request during this interval ...)
 * d,STATUS,VEND,#,3,1756,1,2,30,8
 * (Vend Approved by the reader and confirmed by the VMC (MASTER) during this interval ... )
 * STATUS,IDLE,#,3,1756,1,2,30,8
 */


