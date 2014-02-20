
// Forked from github.com/mixu by Mikito Takada <mikito.takada@gmail.com>
// Calculates a distinct hash function for a given string. Each value of the
// integer d results in a different hash value.
function hash( d, str) {
  if(d == 0) { d = 0x811c9dc5; }
  for(var i = 0; i < str.length; i++) {
    // http://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
    // http://isthe.com/chongo/src/fnv/hash_32.c
    // multiply by the 32 bit FNV magic prime mod 2^32
    d += (d << 1) + (d << 4) + (d << 7) + (d << 8) + (d << 24);
    // xor the bottom with the current octet
    d ^= str.charCodeAt(i);
  }
  return d & 0x7fffffff;
}

exports.hash = hash;

// Computes a minimal perfect hash table using the given Javascript object hash. It
// returns a tuple (G, V). G and V are both arrays. G contains the intermediate
// table of values needed to compute the index of the value in V. V contains the
// values of the dictionary.

exports.create = function(dict) {
  var size = Object.keys(dict).length,
      buckets = [],
      G = new Array(size),
      values = new Array(size),
      i, b, bucket;

  // Place all of the keys into buckets
  Object.keys(dict).forEach(function(key) {
    var bkey = hash(0, key) % size;
    if(!buckets[bkey]) {
      buckets[bkey] = [];
    }
    buckets[bkey].push( key );
  });

  // Sort the buckets and process the ones with the most items first.
  buckets.sort(function(a, b) { return b.length - a.length; });

  for(b = 0; b < size; b++) {
    if(buckets[b].length <= 1) break;
    bucket = buckets[b];

    var d = 1, item = 0, slots = [], slot, used = {};

    // Repeatedly try different values of d until we find a hash function
    // that places all items in the bucket into free slots
    while(item < bucket.length) {
      slot = hash(d, bucket[item]) % size;
      if(values[slot] || used[slot]) {
        d++;
        item = 0;
        slots = [];
        used = {};
      } else {
        used[slot] = true;
        slots.push(slot);
        item++;
      }
    }

    G[hash(0, bucket[0]) % size] = d;
    for(i = 0; i < bucket.length; i++) {
      values[slots[i]] = dict[bucket[i]];
    }
  }

  // Only buckets with 1 item remain. Process them more quickly by directly
  // placing them into a free slot. Use a negative value of d to indicate
  // this.

  var freelist = [];
  for(i = 0; i < size; i++) {
    if(typeof values[i] == 'undefined' ) {
      freelist.push(i);
    }
  }

  for(; b < size; b++ ) {
    if (!buckets[b] || buckets[b].length == 0) break;
    bucket = buckets[b];
    slot = freelist.pop();

    // We subtract one to ensure it's negative even if the zeroeth slot was used.
    G[hash(0, bucket[0]) % size] = 0-slot-1;
    values[slot] = dict[bucket[0]];
  }

  return [ G, values ];
};


// Look up a value in the hash table, defined by G and V.
exports.lookup = function(G, V, key) {
  var d = G[ hash(0,key) % G.length ];
  if (d < 0) return V[ 0-d-1 ];
  return V[hash(d, key) % V.length];
};
