import { isIP, isIPv6 } from 'net';
import level from 'level-ts';
import { object } from './message_types';
import { type } from 'os';

export function verify(dataJson: any): boolean {
    /*
    Verifies that the data received is formatted correctly. 
    */

    let keys = Object.keys(dataJson);
    
    switch (dataJson.type) {
        case "hello":
            if (keys.length !== 3) return false;
            if(keys.indexOf("type") === -1 || dataJson['type'] !== "hello") return false;
            if(keys.indexOf("version") === -1 || typeof dataJson['version'] !== 'string') return false;
            if(keys.indexOf("agent") === -1 || typeof dataJson['agent'] !== 'string') return false;

            if (!checkVersion(dataJson.version)) return false;

        break;

        case "error":
            if (keys.length !== 3) return false;
            if(keys.indexOf("type") === -1 || dataJson['type'] !== "error") return false;
            if(keys.indexOf("name") === -1 || typeof dataJson['name'] !== 'string') return false;
            if(keys.indexOf("message") === -1 || typeof dataJson['message'] !== 'string') return false; 

            const ERROR_MESSAGES = [
              'INTERNAL_ERROR',
              'INVALID_FORMAT',
              'UNKNOWN_OBJECT',
              'UNFINDABLE_OBJECT',
              'INVALID_HANDSHAKE',
              'INVALID_TX_OUTPOINT',
              'INVALID_TX_SIGNATURE',
              'INVALID_TX_CONSERVATION',
              'INVALID_BLOCK_COINBASE',
              'INVALID_BLOCK_TIMESTAMP',
              'INVALID_BLOCK_POW',
              'INVALID_GENESIS'
            ];
          
            if (ERROR_MESSAGES.indexOf(dataJson['name']) === -1) return false;
        break;

        case "getpeers":
        break;

        case "peers":
          if (!dataJson.hasOwnProperty("peers")) {
            return false;
          }

            for (let item of dataJson.peers) {
                if(check_valid_IP(item)) continue;
            }
        break;

        case "getobject":
          if (!dataJson.hasOwnProperty("objectid")) {
            return false;
          }

          break;
        case "ihaveobject":
          if (!dataJson.hasOwnProperty("objectid")) {
            return false;
          }

          break;
        case "object":
          if (!dataJson.hasOwnProperty("object")) {
            return false;
          }
          if (dataJson.object.type === "transaction" && !isValidTXFormat(dataJson)) { 
            return false;
          } 
          // for debugging
          if (dataJson.object.type === "transaction") {
            if (isValidTXFormat(dataJson)) {console.log("Valid format.")}
            else {console.log("invalid format.")}
          } 
          
          if (dataJson.object.type === "block" && !isValidBlockFormat(dataJson)) {
            return false;
          }

          break;
        case "getmempool":
          break;
        case "mempool":
          if (!dataJson.hasOwnProperty("txids")) {
            return false;
          }
          break;
        case "getchaintip":
          break;
        case "chaintip":
          if (!dataJson.hasOwnProperty("blockid")) {
            return false;
          }
          break;

        default:
          return false;
    }

    return true;
}

function checkVersion(num: string): boolean {
    return /^0\.9\.[0-9]+$/.test(num);
}

export function check_valid_IP(IP: string): boolean {
  const isValidDomain = require('is-valid-domain');

  let parts = IP.split(':');
  let ipv6_no_brackets = parts.slice(0, parts.length-1).join(':')
  ipv6_no_brackets = ipv6_no_brackets.replace(/[\[\]']+/g, '');

  if (isIPv6(parts.slice(0, parts.length-1).join(':')) || isIPv6(ipv6_no_brackets)) { 
    const parsedPort = parseInt(parts[parts.length-1], 16);
    return !isNaN(parsedPort) && parsedPort >= 0 && parsedPort <= 65535;
  }

  else if (isIP(parts[0])) {
    const PORT_REGEX = /^\d+$/;
    if (!PORT_REGEX.test(parts[parts.length-1])) return false;

    const parsedPort = parseInt(parts[parts.length-1]); 
    console.log(parsedPort);
    return !isNaN(parsedPort) && parsedPort >= 0 && parsedPort <= 65535;
  }

  else if (isValidDomain(parts[0], {subdomain: true})) {
    const parsedPort = parseInt(parts[parts.length-1], 16);
    return !isNaN(parsedPort) && parsedPort >= 0 && parsedPort <= 65535;
  }

  else return false;
}


export function blakeObject(object: string): string {
  /* Takes the canoncalized version of object.object (including key) and returns the blake2s hashed value */
  var blake2 = require('blake2')
  var objectid = blake2.createHash('blake2s')
  objectid.update(Buffer.from(object));
  return objectid.digest("hex")
}

export function isValidOutput(output: any): boolean {
   if (!output.hasOwnProperty("pubkey") || !output.hasOwnProperty("value")) {
    return false;
  }
  if (output['value'] < 0 || !Number.isInteger(parseInt(output['value']))) {
    return false;
  }
  return true;
}

/* check block object contains all required fields */
function isValidBlockFormat(dataJson : any) {
  if (!dataJson.object.hasOwnProperty("txids") 
      || !dataJson.object.hasOwnProperty("nonce")
      || !dataJson.object.hasOwnProperty("previd") 
      || (!dataJson.object.hasOwnProperty("created") && typeof dataJson.object.created == "number")
      || !dataJson.object.hasOwnProperty("T")
      || dataJson.object.T != "00000000abc00000000000000000000000000000000000000000000000000000") {
      return false;
  }
  return true;
}

/* check transaction object contains all required fields */
function isValidTXFormat(dataJson : any) {
  if ((!dataJson.object.hasOwnProperty("inputs") && !dataJson.object.hasOwnProperty("height"))  // transactions contains outputs and either inputs or height
      || !dataJson.object.hasOwnProperty("outputs")) {
        return false;
  }
  for (let output of dataJson.object.outputs) {
    if (!isValidOutput(output)) {  // each output must contain a public key and a value
      return false;
    }
  }
  if (dataJson.object.hasOwnProperty("height")) {  // coin base transaction has no inputs property to check so format verification is complete
    return true;
  }
  for (let input of dataJson.object.inputs) {  // each input must contain a signature and an outpoint containing a txid and index
    if (!input.hasOwnProperty("sig") || !input.hasOwnProperty("outpoint")
        || !input.outpoint.hasOwnProperty("txid") || !input.outpoint.hasOwnProperty("index")) {
          return false;
    }
  }
  return true;
}