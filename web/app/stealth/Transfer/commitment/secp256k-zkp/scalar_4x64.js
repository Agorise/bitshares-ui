/* @secp256k1_scalar_t
 * USAGE:
 * let x = new secp256k1_scalar_t
 * x.Set(d7, d6, d5, d4, d3, d2, d1, d0) // Synonim of SECP256K1_SCALAR_CONST from secp256k1-zkp
 */ 
class secp256k1_scalar_t
{
    constructor()
    {
        this.d = Array(4);
    }
    Set = (d7, d6, d5, d4, d3, d2, d1, d0) => { //SECP256K1_SCALAR_CONST
        this.d = [ 
            (BigInt(d1.toString()).shiftLeft(32).or(BigInt(d0.toString()))), 
            (BigInt(d3.toString()).shiftLeft(32).or(BigInt(d2.toString()))), 
            (BigInt(d5.toString()).shiftLeft(32).or(BigInt(d4.toString()))), 
            (BigInt(d7.toString()).shiftLeft(32).or(BigInt(d6.toString()))),
        ];
    }
}
export default secp256k1_scalar_t;