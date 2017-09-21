import {PublicKey} from "agorise-bitsharesjs/es";
import utils from "common/utils";
/*Since js classes are more like C structs in ways, why not have them presented like this for ease of unerstanding?*/
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
class stealth_confirmation
{
    constructor()
    {
        this.memo_data = new memo_data;
        this.one_time_key = new PublicKey;
        this.to = null;//pubkeytype?
        this.encryptedmemo = ""; //char vector
    }
}
class blind_output
{
    constructor()
    {
        this.label = "";
        this.pub_key =  null; //publickeyduh
        this.decrypted_memo = new memo_data;
        this.confirmation = new stealth_confirmation; //stealth_confirmation
        this.auth = null; // auths lel 
        this.confirmation_receipt = null;
    }
}
class blind_confirmation
{
    constructor()
    {
        this.output = new blind_output;
        this.trx;
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