/** confidential.js
 *
 *  Classes and structs to represent components of confidential
 *  (blind, stealth) transactions on Graphene based chains.
 *
 *  Mostly tranliterated from various sources within bitshares-core.
 *
 */
import {PublicKey} from "agorise-bitsharesjs/es";
import utils from "common/utils";

/**
 *  Records the one-time-key, to-key, and memo_data (encrypted) that, upon
 *  being packed and base58 encoded, becomes the TX receipt.
 *
 *  NOTE: The OTK and ToPubKey are NOT encrypted, only the memo_data. Thus,
 *  a receipt, if transmitted insecurely, identifies the Asking Address of
 *  the recipient.  If the receipt can be separately correlated with either
 *  the receiving address or the sender, then a lot of metadata is revealed.
 *
 *  from: confidential.hpp
 *    in: bitshares-core/libraries/chain/include/graphene/chain/protocol/
 */
class stealth_confirmation
{
    constructor()
    {
        this.one_time_key = "TEST";   // public_key_type (new PublicKey;?)
        this.to = null;             // public_key_type 
        this.encryptedmemo = "";    // vector<char>
    }
    // TODO:
    // Needs methods to pack and unpack as base58 string
    //
    toBase58() {return "abcdefghijjkmnop";} // TEMP TODO
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
        this.amount = null;         // asset (bitshares-core/.../asset.hpp)
        this.blinding_factor = "";  // fc::sha256
        this.commitment = "";       // fc::ecc::commitment_type
        this.check = 0;             // uint32
    }
}


/**
 *  Metadata surrounding a blind output, for internal retention/use by
 *  wallet.  (See also blind_output)
 *
 *  Contains the transaction Receipt which the sender must communicate to
 *  the recipient, and metadata to aid correlating receipt to recipient.
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
        this.auth = {};       // authority (bitshares-core/.../authority.hpp)
                              // Not needed for public-to-blind
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
        this.output_meta = new blind_output_meta;  // actually a vector of these
        this.trx;   // signed trx
    }
}


/**
 *  Represents a blind output (somewhat like a Bitcoin UTXO).  A blind
 *  transaction will contain one or more of these blind outputs.
 *
 *  On the p2p network, outputs are indexed by the commitment
 *  data and are retrievable with API call
 *  database_api::get_blinded_balances(confirmation)
 *
 *  from: confidential.hpp
 *    in: bitshares-core/libraries/chain/include/graphene/chain/protocol/
 */
class blind_output
{
    constructor()
    {
        this.commitment="";    // fc::ecc::commitment_type  (33 bytes)
        this.range_proof="";   // range_proof_type (Only needed if >1
                            // output in a TX)
        this.owner=null;         // authority
        this.stealth_memo=new stealth_confirmation;  // (optional) stealth_confirmation. Note: CLI
                            // Wallet does not include these in the outputs
                            // it produces. This is probably smart as they
                            // leak the blind Asking Address.
    }
}


/**
 *  Represents a transfer_to_blind operation (Op-code 39), suitable be
 *  included in a transaction for broadcast.
 *
 *  from: confidential.hpp
 *    in: bitshares-core/libraries/chain/include/graphene/chain/protocol/
 */
class transfer_to_blind_op
{
    constructor()
    {
        this.fee = null;            // asset type
        this.amount = null;         // asset type
        this.from = null;           // account_id_type
        this.blinding_factor = null;// blind_factor_type
        this.outputs = [];          // vector<blind_output>
    }

    fee_payer() {/* return this.from; */}
    validate(){} //TODO
    calculate_fee(/*TODO*/){/*TODO*/} // returns share_type 

}

/**
 *  Unused, as far as I can tell.
 *
 *  from: confidential.hpp
 *    in: bitshares-core/libraries/chain/include/graphene/chain/protocol/
 */
class blind_memo
{
    constructor()
    {
        this.from;        // account_id_type
        this.ammount;     // share_type
        this.message;     // string
        this.check = 0;   // uint32
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

export {
    stealth_confirmation,
    stealth_cx_memo_data,
    blind_output_meta,
    blind_confirmation,
    blind_memo,
    blind_input,
    blind_output,
    transfer_to_blind_op,
};
