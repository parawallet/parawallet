export interface Balance {
    readonly address: string;
    readonly amount: number;
}

export type TransactionStatus = "success" | "failure" | "pending";

// todo ensure all the explorers use 'tx' and 'address' in their rest endpoint
export type ExplorerDataType = "tx" | "address";

export interface Transaction {
    readonly id: string;
    // milliseconds since unix epoch
    readonly timestamp: number;
    readonly source?: string;
    readonly destination: string;
    readonly amount: number;
    status: TransactionStatus;
}

export interface WalletType {
    readonly code: string;
    readonly name: string;
}

export interface WalletEventListener {

    onBalanceChange(address: string, previousAmount: number, currentAmount: number): void;

    onTransactionComplete(txid: string, amount: number, status: TransactionStatus): void;
  }

export interface Wallet extends WalletType {

    /**
     * Total of current balances.
     */
    readonly totalBalanceAmount: number;
    /**
     * The default public address to receive crypto.
     */
    readonly defaultAddress: string;

    /**
     * Current/latest balances.
     */
    readonly currentBalances: ReadonlyArray<Balance>;

    /**
     * Known transactions initiated by this wallet.
     */
    readonly knownTransactions: ReadonlyArray<Transaction>;

    /**
     * Initializes the wallet, either by restoring from database
     * or creating an empty wallet.
     */
    initialize(createEmpty: boolean): Promise<any>;

    /**
     * Returns true if this wallet supports multi-address transactions,
     * false otherwise.
     */
    supportsMultiAddressTransactions(): boolean;

    /**
     * Returns true if address is public, false otherwise.
     */
    isPublicAddress(address: string): boolean;

    /**
     * Adds a new public address to the wallet.
     */
    addNewAddress(): Promise<string>;

    /**
     * Updates balances of addresses belonging to wallet via RPC service.
     */
    updateBalances(): Promise<Balance[]>;

    /**
     * Initiates transaction to send requested amount
     * to target address and returns promise for transaction id.
     *
     * `fromAddress` is required for wallets NOT supporting multi-address transaction.
     * `fromAddress` is not used used for wallets supporting multi-address transaction.
     */
    send(toAddress: string, amount: number, fromAddress?: string): Promise<string>;

    /**
     * Changes/sets the default public address
     */
    setDefaultAddress(address: string): Promise<string>;

    /**
     * Returns web explorer url for this wallet.
     */
    getExporerURL(type: ExplorerDataType): string | null;

    /**
     * Validates given address. Fails with an error if address is not valid, returns silently otherwise.
     */
    validateAddress(address: string): void;

    /**
     * Sets event listener for this wallet
     */
    setEventListener(listener: WalletEventListener): void;
}
