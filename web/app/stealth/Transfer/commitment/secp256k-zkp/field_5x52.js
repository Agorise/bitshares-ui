/* @secp256k1_fe_t
 * USAGE:
 * let x = new secp256k1_fe_t
 * x.Set(d7, d6, d5, d4, d3, d2, d1, d0) // Synonim of SECP256K1_FE_CONST_INNER from secp256k1-zkp
 */
class secp256k1_fe_t
{
    constructor()
    {
        this.n = Array(5);
    }
    /* Unpacks a constant into a overlapping multi-limbed FE element. */
    Set = (d7, d6, d5, d4, d3, d2, d1, d0) => {
        this.n = [
            BigInt(d0.toString()).or(BigInt(d1)).shiftLeft(32),
            BigInt(BigInt(d1.toString()).shiftRight(20).toString()).or(BigInt(d2.toString()).shiftLeft(12)).or(BigInt(BigInt(d3.toString()).and(BigInt.fromHex("FF")).toString()).shiftLeft(44)),
            BigInt(d3.toString()).shiftRight(8).or(BigInt(d4.toString()).and(BigInt.fromHex("0FFFFFFF")).shiftLeft(24)).toString(),
            BigInt(d4.toString()).shiftRight(28).or(BigInt(d5.toString()).shiftLeft(4).or(BigInt(d6.toString()).and(BigInt.fromHex("FFFF")).shiftLeft(36))).toString(),
            BigInt(d6.toString()).shiftRight(16).or(BigInt(d7.toString()).shiftLeft(16)).toString()
        ];
    }
}
/* @secp256k1_fe_storage_t
 * USAGE:
 * let x = new secp256k1_fe_storage_t
 * x.Set(d7, d6, d5, d4, d3, d2, d1, d0) // Synonim of SECP256K1_FE_STORAGE_CONST from secp256k1-zkp
 */ 
class secp256k1_fe_storage_t
{
    constructor()
    {
        this.n = new Array(4);
    }
    Set = (d7, d6, d5, d4, d3, d2, d1, d0)=>{
        this.n = [
            BigInt(d0.toString()).or(BigInt(d1.toString()).shiftLeft(32)),
            BigInt(d2.toString()).or(BigInt(d3.toString()).shiftLeft(32)),
            BigInt(d4.toString()).or(BigInt(d5.toString()).shiftLeft(32)),
            BigInt(d6.toString()).or(BigInt(d7.toString()).shiftLeft(32))
        ];
    }
}
export default {secp256k1_fe_t,secp256k1_fe_storage_t};