import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import WalletDb from "stores/WalletDb";
import { Asset } from "common/MarketClasses";
import Stealth_Account from "stealth/DB/account";
import Stealth_Contact from "stealth/DB/contact";
import Stealth_DB from "stealth/DB/db";
import {ChainStore, TransactionBuilder} from "agorise-bitsharesjs/es";
import {PrivateKey, PublicKey, Aes, key, hash} from "agorise-bitsharesjs/es/ecc";
import {blind_output,blind_memo,blind_input,blind_output_meta,
        blind_confirmation,stealth_cx_memo_data,stealth_confirmation,
        transfer_to_blind_op} from "stealth/Transfer/confidential";
import {BLIND_ECC} from "stealth/Transfer/commitment/commitment";
import StealthZK from "stealth/Transfer/stealthzk.js";
import * as Serializer from "agorise-bitsharesjs/es/serializer/src/operations.js";

/**
 *  Class encapsulates the credentials of an ACCOUNT, (stealth OR non-stealth)
 *  that are needs to participate (as either sender OR receiver) in a stealth
 *  transaction. This class adds some uniformity to the various account and
 *  contact stores for all combinations of public/blind/stealth senders and
 *  recipients.
 */
class Stealth_ID {

    /**
     *
     */
    constructor(account_text) {
    }

}

/**
 *  Wraps up a stealth transfer in a convenient class. 
 */
class Stealth_Transfer
{

    /*
     *
     */
    constructor(stealth_DB,from,to,asset,amount,transaction_type)
    {
        this.from = from;
        this.to = to;
        this.asset = asset;     // object, use .get("id"), eg, to get "1.3.0"
        this.amount = amount;   // in base units (ie 1.0 BTS = 100000)
        this.transaction_type = transaction_type;
        this.saccs = stealth_DB.accounts;
        this.sctc = stealth_DB.contacts;
        console.log("Constructor", this);
    }
    check_acc(name)
    {
        let accounts = AccountStore.getMyAccounts();
        /**/ console.log("Check_acc",accounts);
        for(let i=0;i<accounts.length;i++)
        {
            if(accounts[i] == name)
            {
                return ChainStore.getAccount(accounts[i]);
                // returns a ChainStore account object
                // (e.g., can use .get("id") to get id property, etc.)
            }
        }
        return "NOT_FOUND"; // No such acc
    }

    check_sacc(name)  // using as a check_sctc for now. 
    {
        let accounts = this.sctc; // Was: saccs;  Contact checking tho shld search
        for(let i=0;i<accounts.length;i++)     // both acct and contact pool TODO
        {
            if(accounts[i].label == this.strip_symbol(name))
            {
                return accounts[i];
                // returns an stealth_DB account object
            }
        }
        return "NOT_FOUND"; // No such acc
    }
    strip_symbol(name)
    {
        if(name[0] == "@")
        {
            let result = "";
            for(let i=1;i<name.length;i++)
            {
                result += name[i];
            }
            return result;
        }
        else
        {
            throw new Error("Stealth/Transfer: Problem at stripping symbol, no symbol to strip or null value passed");
            return false;
        }
    }

   /**
    *  Construct transaction to transfer a PUBLIC balance to BLIND
    *  balance.
    *
    *  @return a blind_confirmation containing metadata about outputs and
    *  the signed transaction ready-to-broadcast.
    *
    *  Patterned after wallet_api::transfer_to_blind() in wallet.cpp
    *
    *  Note: the function in wallet.cpp assumes responsibility of
    *  transmitting. I prefer to separate that. In final form, this
    *  function will NOT transmit. The caller will receive a signed TX and
    *  assume responsibility for transmitting.
    *
    */
    To_Stealth()
    {
        // Morph 'from' and 'to' from strings into objects:
        // (Perhaps this should be done in constructor)
        this.from = this.check_acc(this.from);  // ChainStore acct obj
        this.to = this.check_sacc(this.to);     // stealth_DB acct obj
        if(this.to == "NOT_FOUND" || this.from == "NOT_FOUND") {
            /**/ console.log("A contact was not found. Have you added it?");
            return false; // Something went wrong.
        }
        /**/ console.log("Hi There! Sending from Public to Blind!\n",
                         " from ", this.from.get("name"),
                         " to @", this.to.label, ".\nThis:", this);

        let blindconf = new blind_confirmation; // will be return object
                                                // if not error

        let bop = new transfer_to_blind_op;
        bop.from = this.from.get("id");

        let blinding_factors = [];
        let total_amount = 0;
        
        // Loop over recipients (right now only support one)
        let one_time_key = key.get_random_key();
        let to_key = PublicKey.fromPublicKeyString(this.to.publickey);
        let secret = one_time_key.get_shared_secret(to_key);  // 512-bits
        let child = hash.sha256(secret);
        let nonce = one_time_key.toBuffer();    // 256-bits, (d in Q=d*G)
        let blind_factor = hash.sha256(child);
        let check32 = (new Uint32Array(secret.slice(0,4).buffer,0,1))[0];
                        // Leading 4 bytes of secret as 32bit check word.

        blinding_factors = [blind_factor];      // push_back when loop
        let amount = this.amount;
        let amountasset = {'amount':amount, 'asset_id':this.asset.get("id")};
        total_amount += amount;

        let out = new blind_output;
        out.owner = {"weight_threshold":1,"account_auths":[],
                     "key_auths":[[to_key.child(child),1]],
                     "address_auths":[]};
        out.commitment = StealthZK.BlindCommit(blind_factor,amount);
        out.range_proof = new Uint8Array(0);    // (Not needed for 1 output)


        let conf_out_meta = new blind_output_meta;
        conf_out_meta.label = this.to.label;
        conf_out_meta.pub_key = to_key;
        conf_out_meta.decrypted_memo.amount = amountasset;
        conf_out_meta.decrypted_memo.blinding_factor = blind_factor;
        conf_out_meta.decrypted_memo.commitment = out.commitment;
        conf_out_meta.decrypted_memo.check = check32;
        conf_out_meta.confirmation.one_time_key = one_time_key.toPublicKey();
        conf_out_meta.confirmation.to = to_key;
        let aescoder = Aes.fromSha512(secret.toString('hex'));
        let memo_data_flat = Serializer.
            stealth_memo_data.
            toBuffer(conf_out_meta.decrypted_memo);
        conf_out_meta.confirmation.encrypted_memo =
            aescoder.encrypt(memo_data_flat);
        let receipthex = Serializer.
            stealth_confirmation.
            toHex(conf_out_meta.confirmation);
        conf_out_meta.confirmation_receipt = receipthex;
        /***/ console.log("Receipt:  ", receipthex);

        blindconf.output_meta = [conf_out_meta];  // needs to be push_back()
        out.stealth_memo = conf_out_meta.confirmation;  // Omit???
        bop.outputs = [out];    // needs to be push_back()
        // Loop over recipients would end here

        bop.amount = total_amount;
        bop.blinding_factor = blind_factor;  // should be blind_sum but only one
        // TODO: bop.outputs needs to be sorted (if > 1)

        let tr = new TransactionBuilder();
        tr.add_type_operation("transfer_to_blind",{
            fee: {
                amount: 0,
                asset_id: "1.3.0"
            },
            amount: {
                amount: total_amount,
                asset_id: this.asset.get("id")
            },
            from: this.from.get("id"),
            blinding_factor: bop.blinding_factor,
            outputs: bop.outputs
        });

        let retval =  WalletDb.process_transaction(tr,null,true);
        return retval;

    }
    
    From_Stealth()
    {
        this.from = this.check_sacc(this.from);
        this.to = this.check_acc(this.to);
    }
    Stealth_Transfer()
    {
        this.from = this.check_sacc(this.from);
        this.to = this.check_sacc(this.to);
    }
    Execute()
    {
        let from_name = this.from;
        let to_name = this.to;
        let asset = this.asset;
        let ammount = this.ammount;
        if(from_name[0] != "@" && to_name[0] == "@")
        { 
            if(to_name == undefined || from_name == undefined  || ammount == 0 || ammount == undefined)
            {
                return false; //transfer didn't go through
            }
            let XTONAME = strip_symbol(to_name);
            if(XTONAME != false)
            {
                this.from = from_name;
                this.to = XTONAME;
                this.asset == AssetStore.getAsset(asset);
                this.ammount = ammount;
                return this.To_Stealth();
            }
            else
            {
                return false; //Transfer went wrong.
            }
        }
        else if(from_name[0] == "@" && to_name[0] != "@")
        {
            this.from = strip_symbol(from_name);
            this.to = to_name;
            this.From_Stealth();
        }
        else if(from_name[0] == "@" && to_name[0] == "@")
        {
            this.from = strip_symbol(from_name);
            this.to = strip_symbol(to_name);
            this.S_2_S();
        }
        else
        {
            if(from_name == null || to_name == null)
            {
                throw new Error("stealth/Transfer: Null value passed to stealth transfer");
            }
            else
            {
                throw new Error("stealth/Transfer: something went wrong, non-stealth values passed to stealth transfer");
            }
        }
    }
}
export default Stealth_Transfer;
