export class LoginCredentials {
    public readonly appPass: string;
    public readonly mnemonicPass: string;

    constructor(appPass: string, mnemonicPass: string) {
        this.appPass = appPass;
        this.mnemonicPass = mnemonicPass;
    }
}

export const defaultPassword = "the-wallet-secure-password";
