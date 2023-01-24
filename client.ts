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

    // const obj = {
    //     "type": "object",
    //     "object": {
    //       "type": "block",
    //       "txids": [
    //         "740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"
    //       ],
    //       "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
    //       "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
    //       "created": "1622825642",
    //       "T": "003a000000000000000000000000000000000000000000000000000000000000"
    //     }
    //   }

    // console.log(JSON.stringify(obj) + '\n');
    // client.write(canonicalize(obj) + '\n');
    // await delay(1000);
    // client.write(canonicalize(obj))

    // await delay(1000);
    // const get_obj = {
    //   "type": "getobject",
    //   "objectid": "36496e13e8ad98f75321264b0a7980bfe25d4f1226ad1f8da1d8cdb82d8119ec"
    // }
    // client.write(canonicalize(get_obj) + '\n')
    await delay(1000);

    const trans = {"inputs":[{"outpoint":{"index":0,"txid":"740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"}, // MODIFIED
    "sig":"060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"}],
    "outputs":[{"pubkey":"958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0","value":10}],"type":"transaction"}
    
    client.write(canonicalize(trans) + '\n');
    await delay(1000);
    console.log('')
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

