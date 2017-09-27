import secp256k1_context_create from "secp256k1";
let fc = {
    detail:{
        _get_context:()=>{
            return secp256k1_context_create(SECP256K1_CONTEXT_VERIFY | SECP256K1_CONTEXT_SIGN | SECP256K1_CONTEXT_RANGEPROOF | SECP256K1_CONTEXT_COMMIT );
        }
    }
}