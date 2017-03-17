import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import SAccount from "stealth/account";
import SContact from "stealth/contact";
import SDB from "stealth/db";
import {PrivateKey, key, hash} from "bitsharesjs/es";
class Stealth_Transfer
{
    constructor(stealth_DB)
    {
        this.from = "";
        this.to = "";
        this.asset = "";
        this.ammount = 0;
        this.saccs = stealth_DB.accounts; // You need to pass the stealth db.
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
    To_Stealth()
    {
        this.from = this.check_acc(this.from);
        this.to = this.check_sacc(this.to);
        if(this.to != "NOT_FOUND" && this.from != "NOT_FOUND")
        {
            let dictionary = require("json-loader!common/dictionary_en.json");
            let seed = key.suggest_brain_key(dictionary); 
            let one_time_key = PrivateKey.fromSeed(seed);
            let to_key = this.to.public_key;
            let secret = one_time_key.get_shared_secret(to_key);
            let child = hash.sha256(secret);
            let nonce = hash.sha256(one_time_key);//get_secret()? wtf
            let blind_factor = hash.sha256(child);

        }
        return false;//Something went wrong.
    }
    From_Stealth()
    {
        this.from = this.check_sacc(this.from);
        this.to = this.check_acc(this.to);
    }
    S_2_S()
    {
        this.from = this.check_sacc(this.from);
        this.to = this.check_sacc(this.to);
    }
    Transfer(from_name, to_name, asset, ammount)
    {
        if(from_name[0] != "@" && to_name[0] == "@")
        { 
            if( symbol == undefined || to_name == undefined || from_name == undefined  || ammount == 0 || ammount == undefined)
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