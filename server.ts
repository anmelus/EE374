/*
**********************************
DO NOT GO LIVE WITH PROOF OF WORK CHECKING DISABLED
*********************************
*/

import net from 'net';
import delay from 'delay';
import { appendFileSync, writeFileSync, readFileSync } from 'fs';
import { canonicalize } from 'json-canonicalize';
import { hello, error, get_peers, peers, get_object, i_have_object, object, get_mem_pool, mempool, get_chain_tip, chaintip } from './message_types';
import { verify, check_valid_IP, blakeObject} from "./verify_format"
import level from 'level-ts';
import { verifyTXContent, isValidPOW, verifyBlockContent } from './verify_content';

// npm install blake2 --save

const BOOTSTRAPS = ['45.63.84.226:18018', '45.63.89.228:18018', '144.202.122.8:18018'];
const HOST_PORT = 18018;
const HOST = '0.0.0.0';
const msgTypes = ["transaction", "block", "hello", "error", "getpeers", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];

let shakenHands = new Map<string, boolean>();
let nodes: Array<string> = new Array();

const db = new level('./database');   
let clients: Set<net.Socket> = new Set(); 

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
                                    handleObject(dataJson.object, socket);           
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

async function handleObject (object : any, socket : net.Socket) {
    const objectId = blakeObject(canonicalize(object));
    console.log(objectId);

    if (await db.exists(objectId)) {  // exit if we already store the object
        return;
    }

    let objIsValid : string | true;  // error string if invalid, true if valid

    if (object.type === "transaction") {
        objIsValid = await verifyTXContent(object);

    } else if (object.type === "block") {  // Currently assumes the block with ID previd has been received. Checking will be added in pset 4 
        //objIsValid = isValidPOW (objectId, object);  // REANABLE BEFORE MAKING LIVE TO CHECK POW
        objIsValid = true;
        if (objIsValid !== true) {
            socket.write(canonicalize(error(objIsValid)) + '\n');
            return;  // exited handle object function to prevent later methods from being called
        }

        /* Request all transactions in block txids unkown by this node */
        for (let txid of object.txids) {
            if (!await db.exists(txid)) {
                console.log("asking peers for transaction");
                clients.forEach((client) => {client.write(canonicalize(get_object(txid)) + '\n');})
            }
        }

        console.log("waiting on response for transaction");
        await delay(5000);
        console.log("Finished delay");

        // add call to verify txids contained in block
        objIsValid = await verifyBlockContent(object);
        // handle return value
        
    } else {
        objIsValid = "UNKNOWN_OBJECT";  // this line should never be reached as we should only receive transactions and blocks
    }
    if (objIsValid === true) {
        await db.put(objectId, object)
        console.log("Added object " + objectId)
        // Broadcast the message to all connected peers (including sender)
        clients.forEach((client) => { 
            client.write(canonicalize(i_have_object(objectId)) + '\n')
        });
    } else {
        socket.write(canonicalize(error(objIsValid)) + '\n');
    }
        
    // Local file for easier viewing of databse not working atm
    // const all = await db.all()
    // for (let item in all) {
    //     writeFileSync('database.txt', item + '\n')
    // }                    
}