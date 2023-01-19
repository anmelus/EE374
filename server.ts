import net from 'net';
import { appendFileSync, writeFileSync, readFileSync } from 'fs';

import { canonicalize } from 'json-canonicalize';

import { hello, error, get_peers, peers, get_object, i_have_object, object, get_mem_pool, mempool, get_chain_tip, chaintip } from "./message_types"
import { verify, check_valid_IP } from "./verify_format"

const BOOTSTRAPS = ['45.63.84.226:18018', '45.63.89.228:18018', '144.202.122.8:18018'];

const HOST_PORT = 18018;
const HOST = '0.0.0.0';

const msgTypes = ["transaction", "block", "hello", "error", "getpeers", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];
let shakenHands = new Map<string, boolean>();

let nodes: Array<string> = new Array(); // didn't work with set, don't know why

// Read in the local file, if that fails then the nodes will only contain Bootstraps. It will only fail it peers.txt is empty/does not exist.
try {
    let file_content = readFileSync('peers.txt', 'utf8'); // Comes in as single string
    nodes = file_content.split(/\r?\n/); // Refresh file in case of restart
    for (let item of BOOTSTRAPS) {
        if (!nodes.includes(item)) {
            nodes.push(item);
        }
    }
} catch(e) {
    nodes = BOOTSTRAPS;
}

// takes a listener which itself takes a socket as argument and void return
const server = net.createServer((socket) => {
    const address = `${socket.remoteAddress}:`;
    const port = `${socket.remotePort}`;
    console.log(`Client connected: ${address}:${port}`);
    shakenHands.set(address, false);

    writeFileSync('peers.txt', nodes.join('\n')); // Refresh file just in case

    /* It's important to note that the writeFileSync() method will overwrite the entire file, 
    so if you want to append new data to the file instead of overwriting it (to save time), we should use the appendFileSync() method instead. */

    if (!nodes.includes(`${address}:${port}`)) {
        nodes.push(`${address}:${port}`);
        appendFileSync('peers.txt', '\n' + `${address}:${port}`); // Add peer to local file
    }

    //console.log(nodes);

    let buffer = '';

    socket.write(canonicalize(hello())+ '\n');
    socket.write(canonicalize(get_peers())+ '\n');
    let timeoutId: NodeJS.Timeout | null = null;

    let timeout_hello = setTimeout(() => {
        console.log("Hello not received in time");
        socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n');
        socket.end();
    }, 30000);

    socket.on('data', async (data) => {  // listen for data written by client
        //set timer here where server receives message
        if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                console.log("timing out");
                socket.write(canonicalize(error("INVALID_FORMAT"))+ '\n');
                socket.end();
            }, 10000);
        }
        let dataString = data.toString();;
        //console.log(dataString);
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
                            } else {
                                socket.write(canonicalize(error("INVALID_HANDSHAKE")) + '\n');
                                socket.end();
                            }
                        } else if (msgType === "getpeers") {
                            socket.write(canonicalize(peers(nodes)) + '\n');
                        } else if (msgType === "peers") {
                            for (let item of dataJson.peers) {
                                //console.log(item);
                                if (!nodes.includes(item) && check_valid_IP(item)) {
                                    nodes.push(item);
                                    appendFileSync('peers.txt', '\n' + item); // Add nodes to local file
                                }
                            }
                        }
                    }
                }
            }
            buffer = messages[messages.length - 1];
        }
    });
    

    // error checking. Only need to check for data, error, and closed connection.
    socket.on('error', (error) => {
        console.error(`Client ${address} error: ${error}`);
    });
    socket.on('close', () => {
        console.log(`Client ${address} disconnected`);
    });
});

server.listen(HOST_PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${HOST_PORT}`);
});
/*
// connect to one peer
 const client = new net.Socket();
 let nodeAddress;
 let nodePort;
 console.log("!!!!!!!!!");
 if (nodes[0].includes('::')) {
     nodeAddress = nodes[0].split('::')[0];
     nodePort = nodes[0].split('::')[1];
 } else {
     nodeAddress = nodes[0].split(':')[0];
     nodePort = nodes[0].split(':')[1];
 }
 console.log("@@@@@@@@");
 console.log(Number(nodePort), nodeAddress);
 client.connect(Number(nodePort), nodeAddress, async () => {
     const obj = {
        "type": "hello",
         "version": "0.9.0",
        "agent": "Marabu-Core Client 0.9"
     }
     client.write(canonicalize(obj) + '\n');
     await delay(5);
     client.write(`{"type": "getpeers"}` + '\n');
 })
 console.log("#########");
 client.on('data', (data) => {  // receive data from server
    console.log("%%%%%%%%%");
     console.log(`Server sent: ${data}`);
     console.log("$$$$$$$$$");
 });
 */