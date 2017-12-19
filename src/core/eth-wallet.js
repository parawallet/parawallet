import $ from 'jquery';


export class EthWallet {
    constructor() {
        this.totalBalance = 0
        this.code = "ETH"
        this.name = "Ethereum"
    }

    // TODO: get rid of page updates, instead pass a callbak from page
    updateTotalBalance() {
        this.totalBalance = 0
        $("#" + this.code + "-balance").html("wallet not available")
        $("#" + this.code + "-address").html("")

    }

    send(toAddress, amount) {
        alert("wallet not available")
    }
}