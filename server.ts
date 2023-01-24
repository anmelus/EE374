import net from 'net';
import { appendFileSync, writeFileSync, readFileSync } from 'fs';
import { canonicalize } from 'json-canonicalize';
import { hello, error, get_peers, peers, get_object, i_have_object, object, get_mem_pool, mempool, get_chain_tip, chaintip } from './message_types';
import { verify, check_valid_IP, blake_object } from "./verify_format"
import level from 'level-ts';

// npm install blake2 --save

const BOOTSTRAPS = ['45.63.84.226:18018', '45.63.89.228:18018', '144.202.122.8:18018'];
const HOST_PORT = 18018;
const HOST = '0.0.0.0';
const msgTypes = ["transaction", "block", "hello", "error", "getpeers", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];

let shakenHands = new Map<string, boolean>();
let nodes: Array<string> = new Array();

interface object_key {
    "object": {
        "type": string,
        "txids": Array<string>,
        "nonce": string,
        "previd": string,
        "created": string,
        "T": string
    }
}
const db = new level<object_key>('./database')

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
    const address = `${socket.remoteAddress}:`
    const port = `${socket.remotePort}`
    console.log(`Client connected: ${address}:${port}`)
    shakenHands.set(address, false)

    writeFileSync('peers.txt', nodes.join('\n'));

    if (!nodes.includes(`${address}:${port}`)) {
        nodes.push(`${address}:${port}`);
        appendFileSync('peers.txt', '\n' + `${address}:${port}`);
    }

    let buffer = '';

    socket.write(canonicalize(hello()) + '\n');
    socket.write(canonicalize(get_peers()) + '\n');
    let timeoutId: NodeJS.Timeout | null = null;

    let timeout_hello = setTimeout(() => {
        console.log("Hello not received in time");
        socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n');
        socket.end();
    }, 30000);

    let clients: Set<net.Socket> = new Set();
    clients.add(socket)

    socket.on('data', async (data) => { 
        // Data Timer
        if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                console.log("timing out");
                socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n');
                socket.end();
            }, 10000);
        }
        let dataString = data.toString();;
        let dataJson;
        buffer += dataString;
        if (buffer.length > 100000) {
            buffer = "";
        }
        const messages = buffer.split('\n');

        if (messages.length > 1) {  // messages.length = num cmplete msgs + one empty string
            console.log(buffer);
            clearTimeout(timeoutId);
            timeoutId = null;
            for (const message of messages.slice(0, -1)){  // for each msg excluding empty string at end of messages array
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

                        try {
                            if(!verify(dataJson)) {
                                console.log("Data formatted incorrectly.");
                                socket.write(canonicalize(error("INVALID_FORMAT")) + '\n');
                                if (!shakenHands.get(address)) {
                                    socket.end();
                                }
                            }
                        } 
                        catch(e) { 
                            console.log("Data formatted incorrectly.");
                            socket.write(canonicalize(error("INVALID_FORMAT")) + '\n');
                        }

                        if (!shakenHands.get(address)) {
                            if (msgType === "hello") {                     
                                shakenHands.set(address, true);
                                clearTimeout(timeout_hello);
                                socket.write(canonicalize(get_peers()) + '\n');
                            } else {
                                socket.write(canonicalize(error("INVALID_HANDSHAKE")) + '\n');
                                socket.end();
                            }
                        } 

                        else {
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
                                    const OBJECT_ID = dataJson.objectid
                                    if (await db.exists(OBJECT_ID)) {
                                        let obj = await db.get(OBJECT_ID)
                                        socket.write(canonicalize(object(obj)))
                                        console.log("Sent object " + OBJECT_ID)
                                    }
                                    break;
                                }

                                case("ihaveobject"): {
                                    const OBJECT_ID = dataJson.objectid
                                    if (!await db.exists(OBJECT_ID)) {
                                        socket.write(canonicalize(get_object(OBJECT_ID)))
                                    }
                                    break;
                                }

                                case("object"): {
                                    // TODO: Check validity of objects
                                    let OBJECT_ID = blake_object(canonicalize(JSON.stringify(dataJson.object)))
                                    if (!await db.exists(OBJECT_ID)) {
                                        // first argument should be hash
                                        // second argument should be transaction id
                                        // .get(transaction id) to get a previous transaction
                                        await db.put(OBJECT_ID, dataJson.object)
                                        console.log("Added object " + OBJECT_ID)
                                        
                                        // Broadcast the message to all connected peers (including sender)
                                        clients.forEach((client) => {
                                            client.write(canonicalize(i_have_object(OBJECT_ID)));
                                        });
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
            buffer = messages[messages.length - 1];
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

// connect to one peer
 const client = new net.Socket();
 client.connect(18018, '45.63.84.226', async () => {
    client.write(canonicalize(hello()) + '\n');
    client.write(canonicalize(get_peers()) + '\n');
 })
 client.on('data', (data) => {  // receive data from server
    console.log(`Server sent: ${data}`);
 });
