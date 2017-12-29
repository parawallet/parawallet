import SecoKeyval from 'seco-keyval'

const kv = new SecoKeyval('wallet.db', { appName: 'the-wallet', appVersion: '1.0.0' })

export function open(password) {
    return kv.open(password)
}

export function get() {
    return kv
}






