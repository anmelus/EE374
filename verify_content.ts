import level from 'level-ts';
import * as ed from '@noble/ed25519';
import { object } from './message_types';

let db = new level('./database');  // check that we don't need to import the DB
let UTXO: Set<any>  = new Set(); 

async function isValidSignature(signature: string, hash: string, publicKey: string) {
    const isValid = await ed.verify(signature, hash, publicKey);
    return isValid;
}

// takes dataJson.object (must be type == transaction) argument. Don't feel like writing the interface out for that type right now.
export async function verifyTXContent(tx : any) : Promise<string | true> {
    let inputSum : number = 0;
    let outputSum : number = 0;
    if (tx.hasOwnProperty("height")) {  // treat all coinbase as valid
      return true;
    }
    for (let input of tx.inputs) {
      let outpoint = input.outpoint;
      if (!await db.exists(outpoint.txid)) {
        // This error type look like it is meant to be emitted in response to a getobject 
        // msg but it may also be appropriate for use when an outpoint cannot be found.
        // see Ed -> https://edstem.org/us/courses/31092/discussion/2430962
        return "UNKNOWN_OBJECT";
      }
      let outpointTx = await db.get(outpoint.txid);
      if (outpoint.index >= outpointTx.outputs.length) {
        // The transaction outpoint index is too large.
        return "INVALID_TX_OUTPOINT";
      }
      let outpointPubKey = outpointTx.outputs[outpoint.index].pubkey;
      let sig: string = input.sig;
      if (!isValidSignature(sig, outpoint.txid, outpointPubKey)) {
        console.log("sig check!");
        // The transaction signature is invalid.
        return "INVALID_TX_SIGNATURE";
      }
      inputSum += outpointTx.outputs[outpoint.index].value;
    }
    for (let output of tx.outputs) {
      outputSum += output.value;
    }
    if (outputSum > inputSum) {
      // The transaction does not satisfy the weak law of conservation.
      return "INVALID_TX_CONSERVATION";
    }
    return true;
}

export function isValidPOW (objectId : string, block : any) {
    if (parseInt(objectId, 16) > parseInt(block.T, 16)) {  // check proof of work
        console.log("Proof of work failed")
        return "INVALID_BLOCK_POW";
    } else {
        return true;
    }
}


export async function verifyBlockContent (block : any) : Promise<string | true> {
    // TODO: IGNORE THE BLOCK IF ITS PREVIOUS BLOCK HAS NOT BEEN RECEIVED
    /* Confirm all transactions in blockk txids are now known by this node */
    let updatedUTXO: Set<any> = UTXO;
    for (const txid of block.txids) {
        /* check if transaction is known */
        if (!await db.exists(txid)) { 
            console.log("Transaction could not be found");
            return "UNFINDABLE_OBJECT";
        }

        const txObj = await db.get(txid);

        /* Coinbase transaction not at 0th index of txids */
        if (txObj.hasOwnProperty("height") && !(txid === block.txids[0])) {
            console.log("Coinbase transaction is not at 0th index");
            return "INVALID_BLOCK_COINBASE";
        }

        if (txObj.hasOwnProperty("inputs")) {
            for (let input of txObj.inputs) {
                let outpointObj = input.outpoint;
                console.log("checking utxo");
                if (!UTXO.has(outpointObj)) {
                    console.log("init")
                    return "INVALID_TX_OUTPOINT";
                }
                console.log("post check")
                UTXO.delete(outpointObj);
            }
        }

        for (let i = 0; i < txObj.outputs.length; i++) {
            let newUTXO = {
                "txid": txid,
                "index": i 
            }
            updatedUTXO.add(newUTXO);
        }
    }
    UTXO = updatedUTXO;
    console.log(UTXO); // just for debugging
    const firstTx = await db.get(block.txids[0]);
    if (firstTx.hasOwnProperty("height")) {
        const coinbaseTxObj = firstTx;
        const coinbaseTxid = block.txids[0];
        // Vaidate coinbase transaction
        // TODO: Move this check to validate format
        if (coinbaseTxObj.hasOwnProperty("inputs") || coinbaseTxObj.outputs.length != 1) {
            console.log("Coinbase formatted incorrectly.");
            return "INVALID_FORMAT";
        } 
            
        let blockFees = 0 // difference of input and output of all transactions in this block
        for (let i=1; i < block.txids.length; i++) {
            let txFee = 0  // difference of input and output in this transaction
            // No transaction in the block can have the coinbase transaction as its input
            // console.log("@@@@@@@@@@@@");
            let currTxObj = await db.get(block.txids[i])
            for (let input of currTxObj.inputs) {  
                let outpoint = input.outpoint;
                if (outpoint.txid == coinbaseTxid) {
                    console.log("Coinbase transaction was repeated");
                    return "INVALID_TX_OUTPOINT";
                }
                // console.log("############");
                let outpointTxObj = await db.get(outpoint.txid);
                txFee += outpointTxObj.outputs[outpoint.index].value; // accumulate total value of inputs to this transaction
            }
            for (let ouput of currTxObj.outputs) {
                txFee -= ouput.value;  // remove total value of all outputs of this transaction
            }
            blockFees += txFee  // add (input - output) of each transaction in block to calculate fees in block
        }
        /* the output of the coinbase transaction can be at most the sum of transaction fees in the block plus
        the block reward. In our protocol, the block reward is a constant 50 × 1012 picabu." */
        console.log(coinbaseTxObj.outputs[0]['value']);
        console.log(blockFees);
        if (coinbaseTxObj.outputs[0]['value'] > (50*(10**12)) + blockFees) {
            console.log("Coinsbase output too high");
            return "INVALID_BLOCK_COINBASE";
        }
    }
    return true;
}