export function verify(dataJson: any) {
    /*
    Verifies that the data received is formatted correctly. This would include type-checking of all parts of the dict and 
    making sure the rest of the fields are correct.
    */
    
    switch (dataJson.type) {
        // Check that all keys and values are strings
        case "hello":
          // code for the "hello" case
          // check version is 0.9.x, the only parts are type, version, agent
          break;
        case "error":
          // code for the "error" case
          // Probably don't need anything here?
          break;
        case "getpeers":
          // code for the "getpeers" case
          // Probably don't need anything here?
          break;
        case "peers":
          // code for the "peers" case
          // Check for IP and Port being given
          break;
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
    }
}