// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

console.log("renderering page")

const {ipcRenderer} = require('electron')
const db = require('thewallet/app/secure-db')

// TODO: show a login screen, prompt password from user
let p = db.open("the-wallet-secure-password")
p.then(() => {
    console.log("DB is ready now -> " + db.get().hasOpened)
    require('thewallet/app/page')

    ipcRenderer.send('my-page-ready', {})
}, e => console.log(e))



