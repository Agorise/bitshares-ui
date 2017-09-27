let SECP256K1_SCALAR_CONST = (d7, d6, d5, d4, d3, d2, d1, d0) =>
{
    return [((uint64_t)(d1)) << 32 | (d0), ((uint64_t)(d3)) << 32 | (d2), ((uint64_t)(d5)) << 32 | (d4), ((uint64_t)(d7)) << 32 | (d6)];
}
class secp256k1_scalar_t
{
    constructor()
    {
        this.d = Array(4);
    }
}
export {secp256k1_scalar_t,SECP256K1_SCALAR_CONST}