var fs = require('fs')
var $ = require('jquery')

var totalBalance = 0
var walletCode = "XRP"


// exposed functions
export function updateTotalBalance() {
    totalBalance = 0
    $("#"+walletCode+"-balance").html("wallet not available")
    $("#"+walletCode+"-address").html("")

}

export function send(toAddress, amount) {
    alert("wallet not available")
}
