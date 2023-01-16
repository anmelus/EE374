import net from 'net';
//import { canonicalize } from 'json-canonicalize'; // TODO

import { hello, error, get_peers, peers, get_object, i_have_object, object, get_mem_pool, mempool, get_chain_tip, chaintip } from "./message_types"

const PORT = 18018;
const HOST = '0.0.0.0';

const msgTypes = ["transaction", "block", "hello", "error", "getpeers", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];
let msgCount = new Map<string, number>();

// takes a listener which itself takes a socket as argument and void return
const server = net.createServer((socket) => {
    const address = `${socket.remoteAddress}:`;
    console.log(`Client connected: ${address}`);
    msgCount.set(address, 0);
    
    let buffer = '';
    socket.on('data', async (data) => {  // listen for data written by client
        let dataString = data.toString();
        let dataJson;
        buffer += dataString;
        const messages = buffer.split('\n');
        console.log(messages.length);
        console.log(messages);
        if (messages.length > 1) {  // blank character after \n is split off as its own list
            console.log(buffer);
            let isJSON = true;
            try {
                dataJson = JSON.parse(buffer);
            } catch(e) {
                socket.write(JSON.stringify(error("INVALID_FORMAT")))
                isJSON = false;
            }
            if (isJSON) {
                if (!msgTypes.includes(dataJson.type)) {
                    socket.write(JSON.stringify(error("INVALID_FORMAT")))
                } else {
                    let msgType = dataJson.type;
                    console.log(msgType)
                    if (msgCount.get(address) === 0) {
                        if (msgType === "hello") {                     
                            // TODO : Verify version is 0.9.x always
                            // Take version as string and split by '.' then compare the first 2 numbers
                            msgCount.set(address, 1);
                            socket.write(JSON.stringify(hello()))
                        } else {
                            socket.write(JSON.stringify(error("INVALID_HANDSHAKE")))
                            socket.end();
                        }
                    } else if (msgType === "getpeers") {
                        socket.write(JSON.stringify({
                            "type": "peers",
                            "peers": [
                                "dionyziz.com:18018",
                                "138.197.191.170:18018",
                                "[fe80::f03c:91ff:fe2c:5a79]:18018"
                            ]
                        }));
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

server.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});