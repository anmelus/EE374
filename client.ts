import net from 'net';
import delay from 'delay';  // for demonstration

const SERVER_HOST = '0.0.0.0';   // replace with IP of boostrapping nodes
const SERVER_PORT = 18018;

const BOOTSTRAPS = ['45.63.84.226:18018', '45.63.89.228:18018', 'dionyziz.com:18018', '2001:db8::1:8080'];

const client = new net.Socket();
client.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log('Connected to server');
    // await delay(3000);
    // messages delimited with \n
    const obj = {
         "type": "hello",
         "version": "9.0",
         "agent": "Marabu-Core Client 0.9"
    }
    // console.log(JSON.stringify(obj) + '\n');
    client.write(JSON.stringify(obj) + "\n");
    // client.write(`{"type":"hel`);
    await delay(1000);
    client.write(`{"type": "ge`);
    await delay(20000);
    client.write(`tpeers"}` + "\n");
    await delay(1000);
    client.write(JSON.stringify({
                            "type": "peers",
                            "peers": BOOTSTRAPS
                        }) + "\n");
    // TODO: It still acts strangely if you send multiple messages at the same time without delay, try removing the delay and see how it fails

    // client.write("Wbgygvf7rgtyv7tfbgy{{{" + "\n");
    // client.write(`lo","version":"0.9.0","agent":"Marabu-Core Client 0.9"}` + '\n');
    //client.write(JSON.stringify({"type": "getpeers"}) + "\n");

});

client.on('data', (data) => {  // receive data from server
    console.log(`Server sent: ${data}`);
});

client.on('error', (error) => {
    console.error(`Server error: ${error}`);
});

client.on('close', () => {
    console.log('Server disconnected');
});