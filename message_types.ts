export function hello() {
    return {
        "type": "hello",
        "version": "0.9.0",
        "agent": "Marabu-Core Client 0.9"
    }
}

export function error(name: string) {
    let error = {
        "type": "error",
        "name": name,
        "message": ""
    }

    switch (name) {
    case "INVALID_FORMAT":
        error.message = "The format of the received message is invalid.";
        break;
    case "UNKNOWN_OBJECT":
        error.message = "The object requested is unknown to that specific node.";
        break;
    case "UNFINDABLE_OBJECT":
        error.message = "The object requested could not be found in the node's network.";
        break;
    case "INVALID_HANDSHAKE":
        error.message = "The peer sent other validly formatted messages before sending a valid hello message.";
        break;
    case "INVALID_TX_OUTPOINT":
        error.message = "The transaction outpoint is invalid.";
        break;
    case "INVALID_TX_SIGNATURE":
        error.message = "The transaction signature is invalid.";
        break;
    case "INVALID_TX_CONSERVATION":
        error.message = "The transaction does not satisfy the weak law of conservation.";
        break;
    case "INVALID_BLOCK_COINBASE":
        error.message = "The block coinbase transaction is invalid.";
        break;
    case "INVALID_BLOCK_TIMESTAMP":
        error.message = "The block timestamp is invalid.";
        break;
    case "INVALID_BLOCK_POW":
        error.message = "The block proof-of-work is invalid.";
        break;
    case "INVALID_GENESIS":
        error.message = "The block has a previd of null but it isn't genesis.";
        break;
    default:
        error.name = "INTERNAL_ERROR";
        error.message = "Something unexpected happened.";
  }
  return error;
}

export function get_peers() {
    return {"type": "getpeers"}
}

export function peers(peers: Array<string>) {
    return {
        "type": "peers",
        "peers": peers
    }
}

export function get_object(objectid: string) {
    return {
        "type": "getobject",
        "objectid": objectid
    }
}

export function i_have_object(objectid: string) {
    return {
        "type": "ihaveobject",
        "objectid": objectid
    }
}

export function object(ob: Object) {
    return {
        "type": "object",
        "object": ob
    }
}

export function get_mem_pool() {
    return { "type": "getmempool" }
}

export function mempool(txids: Array<string>) {
    return {
        "type": "mempool",
        "objectid": txids
    }
}

export function get_chain_tip() {
    return { "type": "getchaintip" }
}

export function chaintip(blockid: string) {
    return {
        "type": "chaintip",
        "blockid": blockid
    }
}