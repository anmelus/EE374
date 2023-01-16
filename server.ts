import net from 'net';
import { canonicalize } from 'json-canonicalize';

const PORT = 18018;
const HOST = '0.0.0.0';

const msgTypes = ["transaction", "block", "hello", "error", "peers", "getobject", "ihaveobject", "object", "getmempool", "mempool", "getchaintip", "chaintip"];
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
        if (messages.length > 1) {  // blank character after \n is split off as its own list
            // for (const message of messages.slice(0, -1)) {  // for all messages but last
            //     console.log(message); 
            // } 
            console.log(buffer);
            try {
                dataJson = JSON.parse(buffer);
            } catch(e) {
                socket.write(JSON.stringify(
                    {"type": "error",
                    "name": "INVALID_FORMAT",
                    "message": "Not a JSON object"})
                    ); 
            }
            if (!msgTypes.includes(dataJson.type)) {
                socket.write(JSON.stringify(
                    {"type": "error",
                    "name": "INVALID_FORMAT",
                    "message": "Not a valid message type"})
                    );  
            }
            if (msgCount.get(address) === 0) {
                msgCount.set(address, 1);
                if (dataJson.type === "hello") {
                    socket.write(JSON.stringify(
                        {"type": "hello",
                        "version": '0.9.0',
                        "agent": "Marabu-Core Client 0.9"})
                    );
                }
                else {
                    socket.write(JSON.stringify(
                        {"type": "error",
                        "version": 'INVALID_HANDSHAKE',
                        "message": 'First message was not hello'
                        })
                    );
                    socket.end();
                    // close(socket)
                }
            }
        }
        
        buffer = messages[messages.length - 1];  // put last message fragment back in buffer
        
        // console.log(`Client ${address} sent: ${data}`);
        // await delay(3000);
        // socket.write('Hello, client! Love, Server.'); // write data back to socket/client
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