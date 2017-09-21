import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import Stealth_Account from "stealth/DB/account";
import Stealth_Contact from "stealth/DB/contact";
import SDB from "stealth/DB/db";
import {PrivateKey, key, hash} from "bitsharesjs/es";
import {Aes} from "bitsharesjs/es/ecc";
import {blind_output, blind_memo,blind_input,blind_confirmation,memo_data,stealth_confirmation,transfer_to_blind_op} from "stealth/Transfer/confidential";
import {BLIND_ECC} from "stealth/Transfer/commitment/commitment";
class Stealth_Transfer
{
    constructor(stealth_DB,from,to,asset,ammount,transaction_type)
    {
        this.from = from;
        this.to = to;
        this.asset = asset;
        this.ammount = ammount;
        this.transaction_type = transaction_type;
        this.saccs = stealth_DB.accounts;
        this.sctc = stealth_DB.contacts;
    }
    check_acc(name)
    {
        let accounts = AccountStore.getMyAccounts();
        for(let i=0;i<accounts.length;i++)
        {
            if(accounts[i] == name)
            {
                return accounts[i];
            }
        }
        return "NOT_FOUND";// No such acc
    }
    check_sacc(name)
    {
        let accounts = this.saccs;
        for(let i=0;i<accounts.length;i++)
        {
            if(accounts[i] == name)
            {
                return accounts[i];
            }
        }
        return "NOT_FOUND"; // No such acc
    }
    strip_symbol(name)
    {
        if(name[0] == "@")
        {
            let result = "";
            for(let i=1;i<name.length();i++)
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
    */    Public_To_Blind(FromAccount,        ///< Registered Account Object, such as
                                        ///  returned by ChainStore.getAccount()
                    AskingAddress,      ///< Asking Address as BTSbase58 string
                    AssetString,
                    Amount              ///< Amount of asset, numeric I think
                   ) {
        // TODO: Asserts on validity of inputs, maybe

        let blindconf = new blind_confirmation; // will be return object
                                                // if not error

        //XX account_object from_account = my->get_account(from_account_id_or_name);
        //XX fc::optional<asset_object> asset_obj = get_asset(asset_symbol);
        //XX FC_ASSERT(asset_obj, "Could not find asset matching ${asset}",
        //             ("asset", asset_symbol));

        let bop = new transfer_to_blind_op;
        bop.from = FromAccount.get("id");
        
        let one_time_key = key.get_random_key();
        let to_key = PublicKey.fromPublicKeyString(AskingAddress);
        let secret = one_time_key.get_shared_secret(to_key);
        let child = hash.sha256(secret);
        let nonce = one_time_key.get_secret();//get_secret()? wtf
        let blind_factor = hash.sha256(child);
        let out = new blind_output;
        out.from = from.get("id");
        out.commitment = ECC_BLIND(blind_factor, this.ammount);
        out.ammount = this.ammount;
        // no range proof needed as it's only ONE transfer for now.
        let conf_output = new blind_output;
        conf_output.label = this.ammount;
        conf_output.pub_key = to_key;
        conf_output.decrypted_memo.ammount = ammount;
        conf_output.decrypted_memo.blinding_factor = blind_factor;
        conf_output.decrypted_memo.check = secret._hash[0];
        conf_output.confirmation.one_time_key = one_time_key.get_public_key();
        conf_output.confirmation.to = to_key;
        conf_output.confirmation.encrypted_memo = {};//AESENCRYPT(secret,
                                                     //conf_output.decrypted_memo);
        conf.output.confirmation_receipt = conf_output.confirmation;
        bop.outputs.push(conf_output);
        let tr = new TransactionBuilder();
        tr.add_type_operation("transfer_to_blind",{
            fee: {
                ammount: 0,
                asset_id: this.asset.get("id")
            },
            ammount: {
                ammount: this.ammount,
                asset_id: this.asset.get("id")
            },
            from: from.get("id"),
            blinding_factor: blind_factor,
            outputs: [bop]
        });
        tr.set_required_fees().then(() => {
            tr.add_signer(pKey, pKey.toPublicKey().toPublicKeyString());
            console.log("serialized transaction:", tr.serialize());
            //tr.broadcast();
        });
        // TODO: devolve responsibility to broadcast
        
        return blindconf;
        
    }

    
   /**
    *
    */
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
