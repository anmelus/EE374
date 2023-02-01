import net from 'net';
import delay from 'delay';
import { appendFileSync, writeFileSync, readFileSync } from 'fs';
import { canonicalize } from 'json-canonicalize';
import { hello, error, get_peers, peers, get_object, i_have_object, object, get_mem_pool, mempool, get_chain_tip, chaintip } from './message_types';
import { verify, check_valid_IP, blakeObject, verifyTXContent} from "./verify_format"
import level from 'level-ts';

// npm install blake2 --save

const BOOTSTRAPS = ['45.63.84.226:18018', '45.63.89.228:18018', '144.202.122.8:18018'];
const HOST_PORT = 18018;
const HOST = '0.0.0.0';
const msgTypes = ["transaction", "block", "hello", "error", "getpeers", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];

let shakenHands = new Map<string, boolean>();
let nodes: Array<string> = new Array();

const db = new level('./database');  // commented out object_key type as database stores diff structured block and transaction objects 
let clients: Set<net.Socket> = new Set();  // moved out of createServer's connection istener to aggregate set rather than re-init per client 

try {
    let file_content = readFileSync('peers.txt', 'utf8'); 
    nodes = file_content.split(/\r?\n/);
    for (let item of BOOTSTRAPS) {
        if (!nodes.includes(item)) {
            nodes.push(item);
        }
    }
} catch(e) {
    nodes = BOOTSTRAPS;
}

const server = net.createServer((socket) => {
    const address = `${socket.remoteAddress}:`;
    const port = `${socket.remotePort}`;
    console.log(`Client connected: ${address}:${port}`);
    clients.add(socket);
    shakenHands.set(address, false);

    writeFileSync('peers.txt', nodes.join('\n'));

    if (!nodes.includes(`${address}:${port}`)) {
        nodes.push(`${address}:${port}`);
        appendFileSync('peers.txt', '\n' + `${address}:${port}`);
    }

    let buffer = '';

    socket.write(canonicalize(hello()) + '\n');
    socket.write(canonicalize(get_peers()) + '\n');

    /* Timeout if a hello message is not received within 30 seconds */ 
    let timeout_hello = setTimeout(() => {
        console.log("Hello not received in time");
        socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n');
        socket.end();
    }, 30000);

    // let timeoutBlock: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    socket.on('data', async (data) => { 
        /* Timeout if a message is not completed within 10 seconds */
        if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                console.log("timing out");
                socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n');
                socket.end();
            }, 10000);
        }

        /* Add data from client to a buffer */
        let dataString = data.toString();;
        let dataJson;
        // console.log(dataString);
        buffer += dataString;
        console.log(buffer);
        if (buffer.length > 100000) {  // handle buffer overflow
            buffer = "";
        }

        /* Separate and handle individual messages within buffer */
        let cnt = 0;
        const messages = buffer.split('\n');
        buffer = messages[messages.length - 1];  // moved ahead of long conditional block to avoid odd asynch (uncomment at end to see)
        // console.log(messages)
        if (messages.length > 1) {
            clearTimeout(timeoutId);
            clearTimeout(timeout_hello);
            timeoutId = null;
            for (const message of messages.slice(0, -1)){  // for each msg excluding empty string at end of messages array
                /* Check if message received is JSON */
                let isJSON = true;
                try {
                    dataJson = JSON.parse(message);
                } catch(e) {
                    console.log("Not a JSON");
                    socket.write(canonicalize(error("INVALID_FORMAT")) + '\n');
                    isJSON = false;
                    if (!shakenHands.get(address)) {
                        socket.end();
                    }
                }

                if (isJSON) {
                    if (!msgTypes.includes(dataJson.type)) {
                        console.log("Type Error");
                        socket.write(canonicalize(error("INVALID_FORMAT")) + '\n');
                        if (!shakenHands.get(address)) {
                            socket.end();
                        }
                    } else {
                        let msgType = dataJson.type;
                        let msgIsValid = false;
                        
                        try {  // validate message format
                            if(!verify(dataJson)) {
                                console.log("Data formatted incorrectly.");
                                socket.write(canonicalize(error("INVALID_FORMAT")) + '\n');
                                if (!shakenHands.get(address)) {
                                    socket.end();
                                }
                            } else {
                                msgIsValid = true;
                            }
                        } catch(e) { 
                            console.log("Data formatted incorrectly.");
                            socket.write(canonicalize(error("INVALID_FORMAT")) + '\n');
                            if (!shakenHands.get(address)) {
                                socket.end();
                            }
                        }

                        /* Check for valid handshake and disconnect if not received */
                        if (!shakenHands.get(address) && msgIsValid) {
                            if (msgType === "hello") {                     
                                shakenHands.set(address, true);
                            } else {
                                socket.write(canonicalize(error("INVALID_HANDSHAKE")) + '\n');
                                socket.end();
                            }
                        } 

                        /* handle valid message */
                        else if (msgIsValid) {
                            switch(msgType) {
                                case("getpeers"):
                                    socket.write(canonicalize(peers(nodes)) + '\n');
                                    break;

                                case("peers"):
                                    for (let item of dataJson.peers) {
                                        if (!nodes.includes(item) && check_valid_IP(item)) {
                                            nodes.push(item);
                                            appendFileSync('peers.txt', '\n' + item); // Add nodes to local file
                                        }
                                    }
                                    break;

                                case("getobject"): {
                                    const objectId = dataJson.objectid
                                    if (await db.exists(objectId)) {
                                        let obj = await db.get(objectId)
                                        socket.write(canonicalize(object(obj)) + '\n')
                                        console.log("Sent object " + objectId)
                                    }
                                    break;
                                }

                                case("ihaveobject"): {
                                    const objectId = dataJson.objectid
                                    if (!await db.exists(objectId)) {
                                        socket.write(canonicalize(get_object(objectId)) + '\n')
                                    }
                                    break;
                                }

                                case("object"): {
                                    const objectId = blakeObject(canonicalize(dataJson.object));
                                    if (!await db.exists(objectId)) {
                                        let objIsValid : string | true;  // error string if invalid, true if valid
                                        if (dataJson.object.type === "transaction") {
                                            objIsValid = await verifyTXContent(dataJson.object);
                                        } else if (dataJson.object.type === "block") {
                                            console.log(objectId);
                                            // Currently assumes the block with ID previd has been received. Checking will be added in pset 4
                                            // if (parseInt(objectId, 16) > parseInt(dataJson.object.T, 16)) {  // check proof of work
                                            //     console.log("Proof of work failed")
                                            //     socket.write(canonicalize(error("INVALID_FORMAT")));
                                            //     return;
                                            // } 
                                            for (let txid of dataJson.object.txids) {  // could maybe be redone more cleanly with sets but not a priority right now
                                                if (!await db.exists(txid)) {
                                                    console.log("asking peers for transaction");
                                                    clients.forEach((client) => {client.write(canonicalize(get_object(txid)) + '\n');})
                                                }
                                            }
                                            
                                            console.log("waiting on response for transaction");
                                            await delay(5000)
                                            console.log("Finished delay")
                                            
                                            for (let txid of dataJson.object.txids) {
                                                if (!await db.exists(txid)) { 
                                                    console.log("Transaction could not be found");
                                                    socket.write(canonicalize(error("UNFINDABLE_OBJECT"))+ '\n');
                                                    return;
                                                }

                                                if ((await db.get(txid)).hasOwnProperty("height") && !(txid === dataJson.object.txids[0])) {
                                                    console.log("Coinbase transaction is not at 0th index");
                                                    socket.write(canonicalize(error("INVALID_BLOCK_COINBASE"))+ '\n');
                                                    return;
                                                }
                                                
                                                // handle case wherein there is a valid coinbase transaction in the block
                                                else if ((await db.get(txid)).hasOwnProperty("height") && (txid === dataJson.object.txids[0])) {
                                                    // Vaidate coinbase transaction
                                                    let COINBASE = await db.get(txid)
                                                    if (COINBASE.hasOwnProperty("inputs") || COINBASE.outputs.length != 1) {
                                                        console.log("Coinbase formatted incorrectly.");
                                                        socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n')
                                                        return;
                                                    } 
                                                    
                                                    let blockFees = 0 // difference of input and output of all transactions in this block
                                                    for (let i=1; i < dataJson.object.txids.length; i++) {
                                                        let txFee = 0  // difference of input and output in this transaction
                                                        // No transaction in the block can have the coinbase transaction as its input
                                                        let currTxObj = await db.get(dataJson.object.txids[i])
                                                        for (let input of currTxObj.inputs) {  
                                                            let outpoint = input.outpoint;
                                                            if (outpoint.txid == txid) {
                                                                console.log("Coinbase transaction was repeated");
                                                                socket.write(canonicalize(error("INVALID_TX_OUTPOINT")) + '\n');
                                                                return;
                                                            }
                                                            let outpointTxObj = await db.get(outpoint.txid);
                                                            txFee += outpointTxObj.outputs[outpoint.index].value; // add the value of every input to this transaction
                                                        }
                                                        for (let ouput of currTxObj.outputs) {
                                                            txFee -= ouput.value;  // subtract the value of every output of this transaction
                                                        }
                                                        blockFees += txFee
                                                    }
                                                    /* the output of the coinbase transaction can be at most the sum of transaction fees in the block plus
                                                    the block reward. In our protocol, the block reward is a constant 50 × 1012 picabu." */
                                                    console.log(COINBASE.outputs[0]['value']);
                                                    console.log(blockFees);
                                                    if (COINBASE.outputs[0]['value'] > (50*(10**12)) + blockFees) {
                                                        console.log("Coinsbase output too high");
                                                        socket.write(canonicalize(error("INVALID_BLOCK_COINBASE")) + '\n');
                                                        return;
                                                    } 
                                            
                                                }
                                            }

                                            objIsValid = true;  // TODO PSET3 Add code to handle block object 
                                        } else {
                                            objIsValid = "UNKNOWN_OBJECT";  // this line should never be reached as we should only receive transactions and blocks
                                        }
                                        if (objIsValid === true) {
                                            await db.put(objectId, dataJson.object)
                                            console.log("Added object " + objectId)
                                            // Broadcast the message to all connected peers (including sender)
                                            clients.forEach((client) => { 

                                                client.write(canonicalize(i_have_object(objectId)) + '\n')
                                            });
                                        } else {
                                            socket.write(canonicalize(error(objIsValid)) + '\n');
                                        }
                                    }
                                        
                                    // Local file for easier viewing of databse not working atm
                                    const all = await db.all()
                                    for (let item in all) {
                                        writeFileSync('database.txt', item + '\n')
                                    }                                    
                                    break;
                                }

                                default:
                                    break;
                            }
                        }
                    }
                }
            }
            // buffer = messages[messages.length - 1];
        }
    });
    
    socket.on('error', (error) => {
        console.error(`Client ${address} error: ${error}`);
    });
    socket.on('close', () => {
        console.log(`Client ${address} disconnected`);
        clients.delete(socket);
    });
});

server.listen(HOST_PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${HOST_PORT}`);
});

// // connect to one peer
//  const client = new net.Socket();
//  client.connect(18018, '45.63.84.226', async () => {
//     client.write(canonicalize(hello()) + '\n');
//     client.write(canonicalize(get_peers()) + '\n');
//  })
//  client.on('data', (data) => {  // receive data from server
//     console.log(`Server sent: ${data}`);
//  });
