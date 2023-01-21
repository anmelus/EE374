import { isIP, isIPv6 } from 'net';

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

          break;

        case "transaction":
          



        case "getmempool":
          // code for the "getmempool" case
          break;
        case "mempool":
          if (!dataJson.hasOwnProperty("txids")) {
            return false;
          }
          // code for the "mempool" case
          break;
        case "getchaintip":
          // code for the "getchaintip" case
          break;
        case "chaintip":
          if (!dataJson.hasOwnProperty("blockid")) {
            return false;
          }
          // code for the "chaintip" case
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


export function blake_object(object: string): string {
  /* Takes the canoncalized version of object.object (including key) and returns the blake2s hashed value */
  var blake2 = require('blake2')
  var objectid = blake2.createHash('blake2s')
  objectid.update(Buffer.from(object));
  return objectid.digest("hex")
}
