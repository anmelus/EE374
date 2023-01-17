import { isIP, isIPv6 } from 'net';
const PORT = 18018;

export function verify(dataJson: any): boolean {
    /*
    Verifies that the data received is formatted correctly. This would include type-checking of all parts of the dict and 
    making sure the rest of the fields are correct.
    */

    let keys = Object.keys(dataJson);
    
    switch (dataJson.type) {
        // Check that all keys and values are strings
        case "hello":
          // code for the "hello" case
          // check version is 0.9.x, the only parts are type, version, agent
            if (keys.length !== 3) return false;
            if(keys.indexOf("type") === -1 || dataJson['type'] !== "hello") return false;
            if(keys.indexOf("version") === -1 || typeof dataJson['version'] !== 'string') return false;
            if(keys.indexOf("agent") === -1 || typeof dataJson['agent'] !== 'string') return false;

            if (!checkVersion(dataJson.version)) return false;

        break;
        case "error":
          // code for the "error" case
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
          // code for the "getpeers" case
          // Probably don't need anything here?
        break;
        case "peers":
          // code for the "peers" case
          // Check for IP and Port being given

            for (let item of dataJson.peers) {
                if(check_valid_IP(item)) continue;
            }
        break;


        // Not needed currently
        case "getobject":
          // code for the "getobject" case
          break;
        case "ihaveobject":
          // code for the "ihaveobject" case
          break;
        case "object":
          // code for the "object" case
          break;
        case "getmempool":
          // code for the "getmempool" case
          break;
        case "mempool":
          // code for the "mempool" case
          break;
        case "getchaintip":
          // code for the "getchaintip" case
          break;
        case "chaintip":
          // code for the "chaintip" case
          break;
        default:
          // code for any other cases not specified
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

  if (isIPv6(parts.slice(0, parts.length-1).join(':'))) {            // is ipv6
    const parsedPort = parseInt(parts[parts.length-1], 16);
    return !isNaN(parsedPort) && parsedPort >= 0 && parsedPort <= 65535;
  }

  else if (isIP(parts[0])) { // works for ipv4
    // Checks to make sure there are no characters in the port. Note this means ipv4 will only take decimal numbers.
    const PORT_REGEX = /^\d+$/;
    if (!PORT_REGEX.test(parts[parts.length-1])) return false;

    // Checking port number
    const parsedPort = parseInt(parts[parts.length-1]); 
    console.log(parsedPort);
    return !isNaN(parsedPort) && parsedPort >= 0 && parsedPort <= 65535;
  }

  else if (isValidDomain(parts[0], {subdomain: true})) {
    const parsedPort = parseInt(parts[parts.length-1], 16);
    return !isNaN(parsedPort) && parsedPort >= 0 && parsedPort <= 65535;
  }

  // Not a valid IP
  else return false;

}