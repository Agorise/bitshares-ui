import secp256k1_ge_storage_t from "group";
class secp256k1_ecmult_context_t
{
    
    constructor()
    {
        this.pre_g = new secp256k1_ge_storage_t;
    }
}
export default secp256k1_ecmult_context_t;