import net from 'net';
import delay from 'delay';  // for demonstration
import { canonicalize } from 'json-canonicalize';
import { blakeObject } from './verify_format';

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

    client.write(JSON.stringify({"type": "getpeers"}) + "\n");
    await delay(1000);

    const obj1 = {"object":{"height":0,"outputs":[{"pubkey":"25dc545b3e42b773505868a83a5cf221ef4925c5eeb1470de22eb6a85b53fcc3","value":50000000000}],"type":"transaction"},"type":"object"}
    client.write(canonicalize(obj1) + '\n');

    const obj2 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"0e0ac61d37a2e36ba6e987c40e0d912c9e833090fa7755e9bd3703c776ad60ff"},"sig":"cc3dd0092e2b151c2b32d67748de1591933d76ad636831b630de7f9bf38f6050d5c2726c7448d8b6477160f2eb2d81178197cbafe1ec5c215c3754843f322e02"}],"outputs":[{"pubkey":"25dc545b3e42b773505868a83a5cf221ef4925c5eeb1470de22eb6a85b53fcc3","value":10}],"type":"transaction"},"type":"object"}
    client.write(canonicalize(obj2) + '\n');

    const obj3 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"9de12bc2542f86ca6bc65c032ac629c8cf52a62d324a6ec1b233a676d39aa6cc"},"sig":"ebd0883250cd10c741899d5679ecd421d55ea41d1de7253f0447b082b0d45a47811cc61a8da8014869a37a9c1dd36334064877bf94d429ed20435fa9ef513b0e"}],"outputs":[{"pubkey":"25dc545b3e42b773505868a83a5cf221ef4925c5eeb1470de22eb6a85b53fcc3"}],"type":"transaction"},"type":"object"}
    client.write(canonicalize(obj3) + '\n')
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

/* code below this line is old test code for client.ts*/

    // await delay(1000);
    // client.write(canonicalize(obj))

    // await delay(1000);
    // const get_obj = {
    //   "type": "getobject",
    //   "objectid": "4e726b06abb55d899c25ee41f6a41a6baac37a8841978108d1623dda86695529"
    // }
    // client.write(canonicalize(get_obj) + '\n')
    // await delay(1000);
    // let genesis = {
    //   "type": "object",
    //   "object" : {
    //     "T": "00000000abc00000000000000000000000000000000000000000000000000000",
    //     "created": 1671062400,
    //     "miner": "Marabu",
    //     "nonce": "000000000000000000000000000000000000000000000000000000021bea03ed",
    //     "note": "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
    //     "previd": null,
    //     "txids": [],
    //     "type":"block"
    //   }
    // } // GENESIS
    // client.write(canonicalize(genesis) + '\n');

    // await delay(1000);
    /*const trans = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"},
    "sig":"060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"}],
    "outputs":[{"pubkey":"958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0","value":10}],"type":"transaction"},"type":"object"} // NEXT BLOCK
    
    client.write(canonicalize(trans) + '\n');*/
    // await delay(1000);
    // console.log('')
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