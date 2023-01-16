import net from 'net';
//import { canonicalize } from 'json-canonicalize'; // TODO

import { hello, error, get_peers, peers, get_object, i_have_object, object, get_mem_pool, mempool, get_chain_tip, chaintip } from "./message_types"
import { verify } from "./verify_format"


const HOST_PORT = 18018;
const HOST = '0.0.0.0';

const msgTypes = ["transaction", "block", "hello", "error", "getpeers", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];
let msgCount = new Map<string, number>();

let nodes: Array<string> = new Array(); // didn't work with set, don't know why

// takes a listener which itself takes a socket as argument and void return
const server = net.createServer((socket) => {
    const address = `${socket.remoteAddress}:`;
    const port = `${socket.remotePort}`;
    console.log(`Client connected: ${address}:${port}`);
    msgCount.set(address, 0);

    if (!nodes.includes(`${address}:${port}`)) {
        nodes.push(`${address}:${port}`);
    }

    console.log(nodes);
    
    let buffer = '';
    socket.on('data', async (data) => {  // listen for data written by client
        let dataString = data.toString();
        let dataJson;
        buffer += dataString;
        const messages = buffer.split('\n');
        console.log(messages.length);
        console.log(messages);

        // TODO: Check if message is typed correctly, make a message_verification function

        if (messages.length > 1) {  // blank character after \n is split off as its own list
            console.log(buffer);
            let isJSON = true;
            try {
                dataJson = JSON.parse(buffer);
            } catch(e) {
                console.log("Not a JSON");
                socket.write(JSON.stringify(error("INVALID_FORMAT")));
                isJSON = false;
            }
            if (isJSON) {
                if (!msgTypes.includes(dataJson.type)) {
                    console.log("Type Error");
                    socket.write(JSON.stringify(error("INVALID_FORMAT")));
                } else {
                    let msgType = dataJson.type;
                    console.log(msgType)
                    
                    /*try { 
                        verify(dataJson)
                        } catch(e) {
                            console.log("Data formatted incorrectly.");
                            socket.write(JSON.stringify(error("INVALID_FORMAT")));
                        }
                    }*/

                    if (msgCount.get(address) === 0) {
                        if (msgType === "hello") {                     
                            // TODO : Verify version is 0.9.x always
                            // Take version as string and split by '.' then compare the first 2 numbers
                            // Can do this in the function to check if the message is sent in correct format according to its type
                            msgCount.set(address, 1);
                            socket.write(JSON.stringify(hello()));
                        } else {
                            socket.write(JSON.stringify(error("INVALID_HANDSHAKE")));
                            socket.end();
                        }
                    } else if (msgType === "getpeers") {
                        socket.write(JSON.stringify(peers(nodes)));
                    } else if (msgType === "peers") {
                        for (let item of dataJson.peers) {
                            if (!nodes.includes(item)) {
                                nodes.push(item);
                            }
                        }
                        console.log(nodes);
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