/**
 * Enable/Disable Cashless Master
 * Prior to initiating transactions with the MDB Bus, it is necessary to Enable the Cashless Master. Specifically for Cashless Devices, in addition to "Idle" Mode, it is also possible to enable the Device in "Always Idle" Mode.
 *
 * "Authorization First" First Mode - Vending sessions are initiated by the Cashless Peripherals (Meaning that in a real terminal, the user would first have to swipe his card to pre-authorize a certain amount, and then select the product. Further information in Cashless Slave).
 *
 * "Always Idle"/Selection First Mode (direct vend), the Master can request the credit to the Cashless Slave first, and therefore it will start the session (In a real terminal, the user would select the product first on the machine, and then swipe the card to confirm the requested amount).
 */
export const disableCashlessMaster = 'D,0';
export const enableCashlessMasterAuthorizeFirst = 'D,1';
export const enableCashlessMasterAlwaysIdle = 'D,2';

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
export const startPollingCashlessReader = 'D,READER,1';

/**
 * Request Credit
 * The following command is used to send a request to the Cashless Slave. When the Cashless Master is configured in "Idle" Mode, this command should be preceded by a start session command (further info in Cashless Peripheral ). If the Cashless Master is configured in "Always Idle" Mode, the instruction below will trigger a "Start" operation on the slave.
 */

export const requestCredit = (amount, product) => `D,REQ,${amount},${product}`;

/**
 * Cancel a pending vending request
 */
export const cancelPendingVendingRequest = 'D,REQ,-1';

/**
 * End and finalize a transaction
 */
export const endAndFinalizeTransaction = (softwareVersion, productId) => `D,END${
    softwareVersion.major > 3 || softwareVersion.major === 3 && softwareVersion.minor >= 8 ?
        `,${productId}` : ''
}`;

/**
 * End and revert a transaction
 */
export const endAndRevertTransaction = 'D,END,-1';

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

export const getCashlessStatusFromMaster = 'D,STATUS';

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
