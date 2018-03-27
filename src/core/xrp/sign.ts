// See https://github.com/ripple/ripple-lib/blob/develop/src/transaction/sign.ts
// See https://github.com/LedgerHQ/ripple-lib/blob/develop/src/transaction/sign.js

import * as binary from "ripple-binary-codec";
import {computeBinaryTransactionHash} from "ripple-hashes";
import * as keypairs from "ripple-keypairs";
// const validate = utils.common.validate;

function computeSignature(tx: any, privateKey: string, signAs?: string) {
  const signingData = signAs ?
    binary.encodeForMultisigning(tx, signAs) : binary.encodeForSigning(tx);
  return keypairs.sign(signingData, privateKey);
}

export function signWithKeypair(txJSON: string, keypair: {privateKey: string, publicKey: string}, options: {signAs?: string} = {}):
{signedTransaction: string; id: string} {
  // validate.sign({txJSON, secret});
  // we can't validate that the secret matches the account because
  // the secret could correspond to the regular key

  const tx = JSON.parse(txJSON);
  if (tx.TxnSignature || tx.Signers) {
    throw new Error('txJSON must not contain "TxnSignature" or "Signers" properties');
  }

  tx.SigningPubKey = options.signAs ? "" : keypair.publicKey;

  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(tx, keypair.privateKey, options.signAs),
    };
    tx.Signers = [{Signer: signer}];
  } else {
    tx.TxnSignature = computeSignature(tx, keypair.privateKey);
  }

  const serialized = binary.encode(tx);
  return {
    id: computeBinaryTransactionHash(serialized),
    signedTransaction: serialized,
  };
}
