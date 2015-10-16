import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import * as BtcWallet from 'btc-wallet';


ReactDOM.render(
    <h1>Balance: <span id="btc-balance"></span> btc</h1>,
    document.getElementById('root')
);

$("#sendBtn").click(function () { BtcWallet.send("mq3ce8CE4jmyg5a8Y4HqcPtnLRGJu9qhHf", 1)})

BtcWallet.updateTotalBalance();

