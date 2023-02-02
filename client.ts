import net from 'net';
import delay from 'delay';  // for demonstration
import { canonicalize } from 'json-canonicalize';
import { blakeObject } from './verify_format';
import { deflate } from 'zlib';
import { get_object } from './message_types';

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
    await delay(300);

    client.write(JSON.stringify({"type": "getpeers"}) + "\n");
    await delay(300);

    //  hash: "ca31d7dd08ce8b02ed9fcb8f3e6b3186df427b707fcb02b96a8b73313b145e23"
    const coinbase1 = {"object":{"height":0,"outputs":[{"pubkey":"43e51dd8b63039194698ef83a98ca4b50af05fef3e61f0e6466b02d3dbb7bde8","value":50000000000}],"type":"transaction"},"type":"object"}
    // client.write(canonicalize(obj1) + '\n');
    // await delay(300);

    // hash: "2fea2abaae3b3881d621dc7122dfee81ddf893ae5a088d345d04de1b12c54f86"
    const obj2 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"ca31d7dd08ce8b02ed9fcb8f3e6b3186df427b707fcb02b96a8b73313b145e23"},"sig":"9563919e22b7afa448811e7dc2dd09c9fff070968037d003cb245e3378ede404e079c20b94ae4f0adcac2ec80ec57e57facae2f9f013cbb9f43907ec3d29bc09"}],"outputs":[{"pubkey":"43e51dd8b63039194698ef83a98ca4b50af05fef3e61f0e6466b02d3dbb7bde8","value":10}],"type":"transaction"},"type":"object"}
    // client.write(canonicalize(obj2) + '\n');
    // await delay(300);

    // hash: "7e79725c9bb6eb85b550e06de356bcfc34621a96611e2b02360f874c0f4301ae"
    const obj3 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"2fea2abaae3b3881d621dc7122dfee81ddf893ae5a088d345d04de1b12c54f86"},"sig":"8eea8953d0ededf39fdd9ec72275534764d8a1aaba131976604f893a1564f4bc797e16dc3275a0266a9f9bd77a233bf11a8974a7f2916b3c619451f510a46f0a"}],"outputs":[{"pubkey":"43e51dd8b63039194698ef83a98ca4b50af05fef3e61f0e6466b02d3dbb7bde8","value":10}],"type":"transaction"},"type":"object"}
    // client.write(canonicalize(obj3) + '\n')
    // await delay(300);

    // const obj4 = {
    //     "type": "object",
    //     "object": {
    //       "T": "00000000abc00000000000000000000000000000000000000000000000000000",
    //       "created": 1671062400,
    //       "miner": "Marabu",
    //       "nonce": "000000000000000000000000000000000000000000000000000000021bea03ed",
    //       "note": "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
    //       "previd": null,
    //       "txids": [
    //         "ca31d7dd08ce8b02ed9fcb8f3e6b3186df427b707fcb02b96a8b73313b145e23",
    //         // "2fea2abaae3b3881d621dc7122dfee81ddf893ae5a088d345d04de1b12c54f86", uncomment this to test double spend
    //         "7e79725c9bb6eb85b550e06de356bcfc34621a96611e2b02360f874c0f4301ae"
    //     ],
    //       "type": "block"
    //     }
    //   }
    
      // client.write(canonicalize(obj54) + '\n');

    // const genesis = {
    //   "type": "object",
    //   "object": {
    //     "T": "00000000abc00000000000000000000000000000000000000000000000000000",
    //     "created": 1671148800,
    //     "miner": "Marabu Bounty Hunter",
    //     "nonce": "15551b5116783ace79cf19d95cca707a94f48e4cc69f3db32f41081dab3e6641",
    //     "note": "First block on genesis, 50 bu reward",
    //     "previd": "0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2",
    //     "txids": [
    //     "8265faf623dfbcb17528fcd2e67fdf78de791ed4c7c60480e8cd21c6cdc8bcd4"
    //     ],
    //     "type": "block"
    //   }
    // }
    // client.write(canonicalize(genesis) + '\n')
    // await delay(300);


    // const coinbase = {
    //   "type": "object",
    //   "object": {
    //     "type": "transaction",
    //     "height": 1,
    //     "outputs": [
    //       {
    //         "pubkey": "daa520a25ccde0adad74134f2be50e6b55b526b1a4de42d8032abf7649d14bfc",
    //         "value": 50000000000000
    //       }
    //     ]
    //   }
    // }
    // client.write(canonicalize(coinbase) + '\n')

  // const block1 = {"object":{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1671062400,"miner":"Marabu","nonce":"000000000000000000000000000000000000000000000000000000021bea03ed","note":"The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers","previd":null,"txids":[],"type":"block"},"type":"object"};
  // client.write(canonicalize(block1) + '\n');
  // await delay(1000);

  // const getobject1 = {"objectid":"0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2","type":"getobject"};

  // TODO: ask if we need to check that a block with id prev id exists
  const block2 = {"object":{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1671148800,"miner":"grader","nonce":"1000000000000000000000000000000000000000000000000000000001aaf999","note":"This block has a coinbase transaction","previd":"0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2","txids":["ca31d7dd08ce8b02ed9fcb8f3e6b3186df427b707fcb02b96a8b73313b145e23"],"type":"block"},"type":"object"};
  client.write(canonicalize(block2) + '\n');
  await delay(3000);

  client.write(canonicalize(coinbase1) + '\n');

  const block3 = {"object":{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1671280061,"miner":"grader","nonce":"200000000000000000000000000000000000000000000000000000000b2c14c5","note":"This block has another coinbase and spends earlier coinbase","previd":"0000000093a2820d67495ac01ad38f74eabd8966517ab15c1cb3f2df1c71eea6","txids":["80ab1400a407896062f991e8a4dfd5109ce483cdca7503d8077fd538581d0e17","9acc4b44ead97cf85e517561d664390f78b7f75f60e786426a3e875c19a6a182"],"type":"block"},"type":"object"};
  client.write(canonicalize(block3) + '\n');
  await delay(1000);

  const coinbase2  = {"object":{"height":1,"outputs":[{"pubkey":"43e51dd8b63039194698ef83a98ca4b50af05fef3e61f0e6466b02d3dbb7bde8","value":50000000000}],"type":"transaction"},"type":"object"}
  client.write(canonicalize(coinbase2) + '\n');

  // original hash: "2fea2abaae3b3881d621dc7122dfee81ddf893ae5a088d345d04de1b12c54f86"
  // hash with value 5000000001: "20814973bdb8efc81f2731783d13075d449ef40821849a4228ca39e564d961d3"
  const tx1 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"ca31d7dd08ce8b02ed9fcb8f3e6b3186df427b707fcb02b96a8b73313b145e23"},"sig":"9563919e22b7afa448811e7dc2dd09c9fff070968037d003cb245e3378ede404e079c20b94ae4f0adcac2ec80ec57e57facae2f9f013cbb9f43907ec3d29bc09"}],"outputs":[{"pubkey":"43e51dd8b63039194698ef83a98ca4b50af05fef3e61f0e6466b02d3dbb7bde8","value":50000000001}],"type":"transaction"},"type":"object"};
  client.write(canonicalize(tx1) + '\n');

  // await delay(10000);
  // client.write(canonicalize(get_object("33e7db74505961856484452d35bd969e8116871e94c5dd309543578e222b8e51")) + '\n')

  // client.write(canonicalize({"object":{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1671356958,"miner":"grader","nonce":"00000000000000000000000000000000000000000000000000000000012baaaa","note":"Block with invalid PoW","previd":"0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2","txids":[],"type":"block"},"type":"object"}) + '\n');
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