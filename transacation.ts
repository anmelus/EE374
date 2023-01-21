

export function blake_object(object: string): string {
    /* Takes the canoncalized version of object.object (including key) and returns the blake2s hashed value */
    var blake2 = require('blake2')
    var objectid = blake2.createHash('blake2s')
    objectid.update(Buffer.from(object));
    return objectid.digest("hex")
  }
  