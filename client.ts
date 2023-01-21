import net from 'net';
import delay from 'delay';  // for demonstration
import { canonicalize } from 'json-canonicalize';

// '140.82.49.235'
const SERVER_HOST = '0.0.0.0';   // replace with IP of boostrapping nodes
const SERVER_PORT = 18018;

const BOOTSTRAPS = ['[2001:db8::1]:8080'];

const client = new net.Socket();
client.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log('Connected to server');
    // await delay(3000);
    // messages delimited with \n
    const hello = {
         "type": "hello",
         "version": "0.9.0",
         "agent": "Marabu-Core Client 0.9"
    }
    console.log(JSON.stringify(hello) + '\n');
    client.write(canonicalize(hello) + '\n');
    await delay(1000);

    const obj = {
        "type": "object",
        "object": {
          "type": "block",
          "txids": [
            "740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"
          ],
          "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
          "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
          "created": "1622825642",
          "T": "003a000000000000000000000000000000000000000000000000000000000000"
        }
      }

    console.log(JSON.stringify(obj) + '\n');
    client.write(canonicalize(obj) + '\n');
    await delay(1000);
    client.write(canonicalize(obj))

    await delay(1000);
    const get_obj = {
      "type": "getobject",
      "objectid": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8"
    }
    client.write(canonicalize(get_obj) + '\n')


    // //client.write(`{"type": "getpeers"}` + '\n');
    // await delay(100);
    // client.write(`{"type": "get`);
    // await delay(100);
    // client.write(`peers"}` + '\n');
    // client.write(canonicalize({
    //                          "type": "peers",
    //                          "peers": BOOTSTRAPS
    //                      }) + "\n");
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

