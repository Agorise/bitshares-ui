/** confidential.js
 *
 *  Classes and structs to represent components of confidential
 *  (blind, stealth) transactions on Graphene based chains.
 *
 *  Mostly tranliterated from various sources within bitshares-core.
 *
 */
import {PublicKey} from "agorise-bitsharesjs/es";
import {Aes} from "agorise-bitsharesjs/es/ecc";
import utils from "common/utils";
import * as Serializer from "agorise-bitsharesjs/es/serializer/src/operations.js";
const bs58 = require('bs58')

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
        this.one_time_key = null;   // PublicKey object
        this.to = null;             // PublicKey object
        this.encrypted_memo = null; // Buffer
    }

    /**
     *  This sets the key fields.  Both should be public keys.
     */
    SetPubKeys(one_time, to_key) {
        this.one_time_key = one_time;
        this.to = to_key;
    }

    /**
     *  Serialize and express as base58 string.
     */
    Base58() {
        return bs58.encode(Serializer.stealth_confirmation.toBuffer(this));
    }

    ReadBase58(rcpt_txt) {
        let tmp = Serializer.stealth_confirmation.fromBuffer(bs58.decode(rcpt_txt));
        this.one_time_key = tmp.one_time_key;
        this.to = tmp.to;
        this.encrypted_memo = tmp.encrypted_memo;
    }
}

/**
 *  Data the recipient needs in order to spend an output that they have
 *  received. (Encrypted form gets stored inside stealth_confirmation.)
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
        this.blinding_factor = "";  // Buffer 32 bytes
        this.commitment = "";       // Buffer 33 bytes
        this.check = 0;             // uint32
    }

    /**
     *  Set all the required fields except the check word. If desired
     *  to set 'from' field, set it explicitly separately.  The check
     *  word should be set last, (typically by ComputeReceipt() in
     *  blind_output_meta object).
     */
    Set(amount, blind, commit) {
        this.amount = amount;
        this.blinding_factor = blind;
        this.commitment = commit;
    }

    /**
     *  Serializes and encrypts memo data, returning as a Buffer.
     *
     *  @param secret is a 512-bit secret as a Buffer object (I
     *         think), used to initialize key and iv of the aes
     *         encoder.
     */
    EncryptWithSecret( secret ) {
        let aescoder = Aes.fromSha512(secret.toString('hex'));
        let memo_data_flat = Serializer.stealth_memo_data.toBuffer(this);
        let retval = aescoder.encrypt(memo_data_flat);
        aescoder.clear();
        return retval;
    }

    Decrypt(encrypted, secret) {
        let aescoder = Aes.fromSha512(secret.toString('hex'));
        let memo_data_flat = aescoder.decrypt(encrypted);
        let memo = Serializer.stealth_memo_data.fromBuffer(memo_data_flat);
        this.from = memo.from;
        this.amount = memo.amount;
        this.blinding_factor = memo.blinding_factor;
        this.commitment = memo.commitment;
        this.check = memo.check;
        aescoder.clear();
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

    /**
     *  Sets the one-time and to PubliKeys in the appropriate
     *  locations in this struct and its member structs.  Both
     *  parameters should be PublicKeys but we tolerate if one_time is
     *  sent as PrivateKey.
     */
    SetKeys( one_time, to_key ) {
        if (one_time.constructor.name == "PrivateKey") {
            one_time = one_time.toPublicKey();} // (Drop private info)
        this.pub_key = to_key;
        this.confirmation.SetPubKeys(one_time, to_key);
    }
    
    /**
     *  Sets the primary fields on the decrypted_memo member. This is
     *  the info that gets encrypted in the receipt. Does not set the
     *  check-word; this gets set later by ComputeReceipt().
     */
    SetMemoData(amount, blind, commit) {
        this.decrypted_memo.Set(amount, blind, commit);
    }

    /**
     *  Using @a secret, we complete the memo data with a check word,
     *  then encrypt the memo data, then base58 the confirmation
     *  struct to compute confirmation_receipt.
     */
    ComputeReceipt(secret) {
        let check32 = (new Uint32Array(secret.slice(0,4).buffer,0,1))[0];
                        // Leading 4 bytes of secret as 32bit check word.
        this.decrypted_memo.check = check32;
        this.confirmation.encrypted_memo =
            this.decrypted_memo.EncryptWithSecret(secret);
        this.confirmation_receipt = this.confirmation.Base58();        
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
        this.output_meta = [];      // Array of blind_output_meta
        this.consumed_commits = []; // Array of commitments consumed as
                                    // inputs. (Array of hex strings)
        this.trx;                   // Signed transaction. (TransactionBuilder)
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

    //fee_payer() {/* return this.from; */}
    //validate(){} //TODO
    //calculate_fee(/*TODO*/){/*TODO*/} // returns share_type 

}

class transfer_from_blind_op
{
    constructor()
    {
        this.fee = null;            // asset type
        this.amount = null;         // asset type
        this.to = null;             // account_id_type
        this.blinding_factor = null;// blind_factor_type
        this.inputs = [];           // vector<blind_output>
    }

    //fee_payer() {/* return this.from; */}
    //validate(){} //TODO
    //calculate_fee(/*TODO*/){/*TODO*/} // returns share_type 

}

class blind_transfer_op
{
    constructor()
    {
        this.fee = null;            // asset type
        this.inputs = [];           // vector<blind_output>
        this.outputs = [];
    }

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
        this.commitment = [];   // 33 byte Buffer
        this.owner = [];        // authority
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
    transfer_from_blind_op,
    blind_transfer_op
};
