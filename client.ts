import net from 'net';
import delay from 'delay';  // for demonstration

const SERVER_HOST = '0.0.0.0';   // replace with IP of boostrapping nodes
const SERVER_PORT = 18018;

const client = new net.Socket();
client.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log('Connected to server');
    await delay(3000);
    // messages delimited with \n
    // const obj = {
    //     "type": "error",
    //     "version": "0.9.0",
    //     "agent": "Marabu-Core Client 0.9"
    // }
    // console.log(JSON.stringify(obj));
    // client.write(JSON.stringify(obj));
    client.write(`{"type":"hel`);
    delay(3000);
    client.write(`lo","version":"0.9.0","agent":"Marabu-Core Client 0.9"}\n`);
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