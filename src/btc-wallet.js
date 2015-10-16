var bitcoin = require('bitcoinjs-lib')
var typeforce = require('typeforce')
var fs = require('fs')
var $ = require('jquery')
var dhttp = require('dhttp')
var coinselect = require('coinselect')
var fee = 0.00001
var API_KEY = "a3f9078954c1f4efa062ced312b3ab6bad027ed1"

var totalBalance = 0
var keypairs = []
var network = bitcoin.networks.testnet


// exposed functions
export function updateTotalBalance() {
    totalBalance = 0
    readAccounts(keypair => queryBalance(keypair))
}

export function send(toAddress, amount) {
    alert(amount)

    // if(!typeforce(types.Satoshi, amount)) {
    //     alert("error")
    // }
    
    let allUnspentOutputs = []
    let txnid_address = new Map()
    let requests = []
    for (let keypair of keypairs) {
        requests.push(new Promise((resolve, reject) => {
            let address = keypair.getAddress();
            getUnspentOutputs(address, unspentOutputs => {
                console.log("unspent:" + JSON.stringify(unspentOutputs))
                for (let unspentOutput of unspentOutputs) {
                    txnid_address.set(unspentOutput.txId, keypair)
                }
                allUnspentOutputs = allUnspentOutputs.concat(unspentOutputs)
                console.log("all unspent:" + JSON.stringify(allUnspentOutputs))
                resolve("success")
            })
        }))
    }

    setTimeout(console.log, 3000, requests);
    Promise.all(requests).then((values) => {
        let {inputs, outputs, fee} = coinselect(allUnspentOutputs, [{"address": toAddress, "value": amount}], 10)

        // .inputs and .outputs will be undefined if no solution was found
        if (!inputs || !outputs) {
            alert("This transaction is not possible.")
            return
        }

        inputs.forEach(input => console.log("input::" + JSON.stringify(input)))
        outputs.forEach(output => console.log("output::" + JSON.stringify(output)))


        let txb = new bitcoin.TransactionBuilder(network)
        for(let i =0; i< inputs.length; i++) {
            let input = inputs[i]
            txb.addInput(input.txId, input.vout)
        }
        for(let output of outputs) {
            if (!output.address) {
                output.address = findChangeAddress(inputs, txnid_address)
            }
            txb.addOutput(output.address, output.value)
        }
        for(let i =0; i< inputs.length; i++) {
            let input = inputs[i]
            txb.sign(i, txnid_address.get(input.txId))
        }

        dhttp({
            method: 'POST',
            url: 'https://testnet-api.smartbit.com.au/v1/blockchain/pushtx',
            json: true,
            body: '{"hex":"' + txb.build().toHex()+'"}'
        }, function (err, res) {

            alert("status code:" + res.statusCode)
            console.log(err)
            console.log(JSON.stringify(res.body))
            // err is only provided if the connection failed in some way
            // OR if the content body parsing failed in some way
            if (err) return
            if (res.statusCode !== 200) return
            if (res.headers['content-type'] !== 'application/json') return

            BtcWallet.updateTotalBalance();
            // if `content-type` was not supported, expect body to be `null` (unless an override is given).
            console.log(res.body)
            // => { foo: 'bar' }, a parsed JSON object

            // ...
        })

    });
}

// internal functions

// finds an address that was not selected by coinselect so it can be used as change address
function findChangeAddress(inputs, txnid_address) {
    let selectedTxnids = []
    for (let input of inputs) {
        selectedTxnids.push(input.txId)
    }
    loop1:
        for (let keypair of keypairs) {
            let address = keypair.getAddress()
            loop2:
                for (let txnid of selectedTxnids) {
                    if (txnid_address.get(txnid).getAddress() == address)
                        continue loop1
                }
            console.log("selected addr:" + keypair.toWIF())
            return address
        }
    return generateAddress().getAddress()
}


// todo filter unconfirmed ones. see: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/_testnet.js
function getUnspentOutputs(address, callback) {
    let url = 'https://api.blocktrail.com/v1/tBTC/address/' + address + '/unspent-outputs?api_key=' + API_KEY;
    $.get(url, d => {
        callback(d.data.map(it => new UnspentOutput(it.hash, it.index, it.value)))
    });
}


function readAccounts(callback) {
    fs.readFile('btc.txt', 'utf8', function (err, contents) {
        if (err) {
            console.log(err);
            generateAddress();
            return
        }
        contents.split("###").forEach(
            wif => {
                if (wif.length > 0) {
                    let keypair = bitcoin.ECPair.fromWIF(wif, network);
                    console.log("read address:" + keypair.getAddress());
                    console.log("read wif:" + wif);
                    keypairs.push(keypair)
                    if (callback) {
                        callback(keypair);
                    }
                }
            }
        )
    });
};

function queryBalance(keypair) {
    let address = keypair.getAddress()
    let url = 'https://api.blocktrail.com/v1/tBTC/address/' + address + '?api_key=' + API_KEY;
    $.get(url, function (d) {
        let balance = d.balance / 1e8
        totalBalance += balance
        $("#balance").html(totalBalance)
    });
}

function generateAddress() {
    var keypair = bitcoin.ECPair.makeRandom({network: network})
    console.log("generated address:" + keypair.getAddress())
    let wif = keypair.toWIF();
    console.log("generated wif:" + wif)
    keypairs.push(keypair)
    writeWIFToFile(wif)
    return keypair
};


function writeWIFToFile(wif) {

    fs.exists("btc.txt", (exists) => {
        if (exists) {   // append the wif
            fs.appendFile('btc.txt', "###" + wif, (err) => {
                if (err) throw err;
            });
        }
        else {
            fs.writeFile("btc.txt", wif, function (err) {
                if (err) {
                    return console.log(err);
                }
                $("#balance").html("0")
                console.log("The file was saved!");
            });
        }
    });
}


class UnspentOutput {
    constructor(txid, vout, value) {
        this.txId = txid
        this.vout = vout  // tx index
        this.value = value  // value in satoshi
    }
}
