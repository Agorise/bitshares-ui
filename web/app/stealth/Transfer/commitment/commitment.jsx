var BigInt = require("bigi");
class secp256k1_scalar_t
{
    constructor()
    {
        this.d = [];
        for(var i=0;i<4;i++)
        {
            d[i] = new BigInt(4,16);
        }
    }    
}
class secp256k1_gej_t
{
    constructor()
    {
        
    }
}
class secp256k1_fe_storage_t
{
    constructor()
    {
        this.n = new Array(8);
    }
}
class secp256k1_ge_storage_t
{
    constructor()
    {
        this.x = new secp256k1_fe_storage_t;
        this.y = new secp256k1_fe_storage_t;
    }
}

class secp256k1_ecmult_context_t
{
    
    constructor()
    {
        this.pre_g = new secp256k1_ge_storage_t;
    }
}

class secp256k1_ecmult_gen_context_t
{
    /* For accelerating the computation of a*G:
     * To harden against timing attacks, use the following mechanism:
     * * Break up the multiplicand into groups of 4 bits, called n_0, n_1, n_2, ..., n_63.
     * * Compute sum(n_i * 16^i * G + U_i, i=0..63), where:
     *   * U_i = U * 2^i (for i=0..62)
     *   * U_i = U * (1-2^63) (for i=63)
     *   where U is a point with no known corresponding scalar. Note that sum(U_i, i=0..63) = 0.
     * For each i, and each of the 16 possible values of n_i, (n_i * 16^i * G + U_i) is
     * precomputed (call it prec(i, n_i)). The formula now becomes sum(prec(i, n_i), i=0..63).
     * None of the resulting prec group elements have a known scalar, and neither do any of
     * the intermediate sums while computing a*G.
     */
    /*
    secp256k1_ge_storage_t (*prec)[64][16]; // prec[j][i] = 16^j * i * G + U_i 
    secp256k1_scalar_t blind;
    secp256k1_gej_t initial;
    */
    constructor()
    {
        this.prec = []; /* prec[j][i] = 16^j * i * G + U_i */
        for(var i=0;i<64;i++)
        {
            for(var y=0;y<16;y++)
            {
                prec[i][y] = new secp256k1_ge_storage_t;
            }
        }
        this.blind = new secp256k1_scalar_t;
        this.initial = new secp256k1_gej_t;
    }
}
class secp256k1_ecmult_gen2_context_t
{
    //todo
}
class secp256k1_context_t
{
    constructor()
    {
        this.ecmult_gen_ctx = new secp256k1_ecmult_context_t;
        this.ecmult_ctx = new secp256k1_ecmult_gen_context_t;
        this.ecmult_gen2_ctx = new secp256k1_ecmult_gen2_context_t;
        this.ecmult_rangeproof_ctx = new secp256k1_rangeproof_context_t;
    }
}
let SECP256k1_CONTEXT_VERIFY = (1 << 0);
let SECP256k1_CONTEXT_SIGN = (1 << 1);
let SECP256k1_CONTEXT_COMMIT = (1 << 7);
let SECP256k1_CONTEXT_RANGEPROOF = (1 << 8);
let secp256k1_context_create = function(flags)
{
    let ret = new secp256k1_context_t;

    ret.ecmult_ctx = secp256k1_ecmult_context_init();
    ret.ecmult_gen_ctx = secp256k1_ecmult_gen_context_init();
    ret.ecmult_gen2_ctx = secp256k1_ecmult_gen2_context_init();
    ret.ecmult_rangeproof_ctx = secp256k1_rangeproof_context_init();

    if(flags & SECP256k1_CONTEXT_SIGN)
    {
        ret.ecmult_gen_ctx = secp256k1_ecmult_gen_context_build();
    }
    if(flags & SECP256k1_CONTEXT_VERIFY)
    {
        ret.ecmult_ctx = secp256k1_ecmult_context_build();
    }
    if(flags & SECP256k1_CONTEXT_COMMIT)
    {
        ret.ecmult_gen2_ctx = secp256k1_ecmult_gen2_context_build();
    }
    if(flags & SECP256K1)
    {
        ret.ecmult_gen2_ctx = secp256k1_ecmult_gen2_context_build();
    }
    return true;
};     
let secp256k1_pedersen_commit = function(blind,ammount)
{
    return true;
};
let ECC_BLIND = function(blinding_factor,ammount)
{
    let context = secp256k1_context_create(SECP256k1_CONTEXT_VERIFY|SECP256k1_CONTEXT_SIGN|SECP256k1_CONTEXT_COMMIT|SECP256k1_CONTEXT_RANGEPROOF);
    let result = secp256k1_pedersen_commit(context,blind,ammount);
    return result;
};
export {ECC_BLIND};
