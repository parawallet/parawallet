// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import {ipcRenderer} from 'electron'
import * as db from './ui/secure-db'

console.log("renderering page")

// TODO: show a login screen, prompt password from user
let p = db.open("the-wallet-secure-password")
p.then(() => {
    console.log("DB is ready now -> " + db.get().hasOpened)
    require('./ui/page')

    ipcRenderer.send('my-page-ready', {})
}, e => console.log(e))



