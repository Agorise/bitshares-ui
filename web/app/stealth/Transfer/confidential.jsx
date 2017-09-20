/** confidential.js
 *
 *  Classes and structs to represent components of confidential
 *  (blind, stealth) transactions on Graphene based chains.
 *
 *  Mostly tranliterated from various sources within bitshares-core.
 *
 */
import {PublicKey} from "bitsharesjs/es";
import utils from "common/utils";

/**
 *  Records the one_time_key and memo_data (encrypted) that, upon being
 *  packed and base58 encoded, becomes the TX receipt.
 *
 *  from: confidential.hpp
 *    in: bitshares-core/libraries/chain/include/graphene/chain/protocol/
 */
class stealth_confirmation
{
    constructor()
    {
        this.one_time_key = null;   // public_key_type (new PublicKey;?)
        this.to = null;             // public_key_type 
        this.encryptedmemo = "";    // vector<char>
    }
    // TODO:
    // Needs methods to pack and unpack as base58 string
    //

    // Hmmm... kinda looks like this doesn't get encrypted, only encoded,
    // when turned into receipt.  So, receipts leak Asking Address and OTK
    // info... which seems bad to me...
    //
}

/**
 *  Data the recipient needs in order to spend an output that they have
 *  reveived. (Encrypted form gets stored inside stealth_confirmation.)
 *
 *  from: confidential.hpp (as stealth_confirmation::memo_data)
 *    in: bitshares-core/libraries/chain/include/graphene/chain/protocol/
 */
class stealth_cx_memo_data
{
    constructor()
    {
        this.from = null;           // (optional) public_key_type
        this.ammount = null;        // asset (bitshares-core/.../asset.hpp)
        this.blinding_factor = "";  // fc::sha256
        this.commitment = "";       // fc::ecc::commitment_type
        check = 0;                  // uint32
    }
}


/**
 *  Metadata surrounding a blind output.  (See also blind_output)
 *
 *  Contains the transaction Receipt which the sender must communicate to
 *  the recipient, and metadata to aid correlating receipt to recipient.
 *
 *  On the blockchain, outputs are contained within blind-operation
 *  transactions, and function similar to Bitcoin's UTXOs.  On the p2p
 *  network, outputs are indexed by the confirmation data and retrievable
 *  with API call database_api::get_blinded_balances(confirmation)
 *
 *  from: wallet.hpp (as blind_confirmation::output)
 *    in: bitshares-core/libraries/wallet/include/graphene/wallet/wallet.hpp
 */
class blind_output_meta
{
    constructor()
    {
        this.label = "";
        this.pub_key =  null; // public_key_type
        this.decrypted_memo = new stealth_cx_memo_data;
        this.confirmation = new stealth_confirmation;
        this.auth = null;     // authority (bitshares-core/.../authority.hpp)
        this.confirmation_receipt = "";  // base58 string I think...
                              // ...packed and encoded from this.confirmation
    }
}


/**
 *  Contains the final signed transaction and a vector of output metadata,
 *  including the "receipt" that the sender must give the receiver.
 *
 *  from: wallet.hpp
 *    in: bitshares-core/libraries/wallet/include/graphene/wallet/wallet.hpp
 */
class blind_confirmation
{
    constructor()
    {
        this.output_meta = new blind_output_meta;
        this.trx;
    }
}



class blind_memo
{
    constructor()
    {
        this.from = []; //account_id_type
        this.ammount = []; //share_type
        this.message = []; //String
        this.check = 0; //int
    }
}
class blind_input
{
    constructor()
    {
        this.commitment = []; //commitment type fcc/ecc
        this.owner = []; //authority
    }
}
class memo_data
{
    constructor()
    {
        this.from = null;
        this.ammount = null;
        this.blinding_factor = "";
        this.commitment = "";
        check = 0;
    }
}
class blind_output_op
{
    constructor()
    {
        this.commitment = [];//Commitment type
        this.range_proof = []; //Range proof type Only needed if range proof is higher than 1
                            //For example for blind to blind ops
        this.owner = [];
        this.authority = [];
    }
}
class transfer_to_blind_op
{
    constructor(asset, bop, blind_factor)
    {
        let precision = utils.get_asset_precision(asset.get("precision"));
        this.fee_parameters.type = {
            fee: 5*precision,
            price_per_output: 5*precision
        };
        this.fee = fee;
        this.ammount = ammount;
        this.from = from;
        this.blind_output = bop;
        this.blinding_factor = blind_factor;
        this.fee_payer = from;
    }
}
export {blind_output,blind_output_op,blind_memo,blind_input,blind_confirmation,memo_data,stealth_confirmation,transfer_to_blind_op};
