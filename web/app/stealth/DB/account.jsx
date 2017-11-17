import {PrivateKey, key} from "agorise-bitsharesjs/es";
import Blind_Receipt from "./blind_receipt";
import CJS from "crypto-js";
class Stealth_Account
{
    constructor()
    {
        this.label = "";
        this.brainkey = "";
        this.privatekey = "";
        this.publickey = "";
        this.account = "";
        this.sent_receipts = [];
        this.received_receipts = [];
        this.blind_balance = 0;
    }
    removeat(acc)
    {
        let result = "";
        if(acc[0] !== "@")
        {return acc;}
        for(let i=1;i<acc.length;i++)
        {
            result+=acc[i];
        }
        return result;
    }
    load_account(label, brainkey,publickey,privatekey,account,sent_receipts,received_receipts,balance)
    {
        this.label = label;
        this.brainkey = brainkey;
        this.privatekey = privatekey;
        this.publickey = publickey;
        this.account = account;
        this.sent_receipts = sent_receipts;
        this.received_receipts = received_receipts;
        this.blind_balance = balance;
    }
    new_account(label, account)
    {
        if(label, account)
        {
            let dictionary = require("json-loader!common/dictionary_en.json");
            this.label = this.removeat(label);
            let nbrainkey = key.suggest_brain_key(dictionary.en);
            this.brainkey = nbrainkey;
            let proc = PrivateKey.fromSeed( key.normalize_brainKey(this.brainkey) );
            this.publickey = proc.toPublicKey().toString();
            this.privatekey = proc.toWif();
            this.account = account;
            this.sent_receipts = [];
            this.received_receipts = [];
            this.blind_balance = 0;
        }
        else
        {
            throw new Error("Stealth_Account - new_account: Bad Input");
        }
    }
    send_receipt(R)
    {
        this.sent_receipts.push(R);
    }
    search_bcommit(c)
    {
        for(let i=0;i<this.received_receipts.length;i++)
        {
            if(this.received_receipts[i].commitment == c)
            {
                return i;
            }
        }
        return false;
    }
    mark_spent(c)
    {
        let found = this.search_bcommit(c);
        if(found!==false)
        {
            this.received_receipts[found].spent = true;
            return true;
        }
        return false;
    }
    update_blind_balance()
    {
        let result = null;
        for(let i=0;i<this.received_receipts.length;i++)
        {
            if(!this.received_receipts[i].spent)
            {
                result += parseFloat(this.received_receipts[i].value);
            }
        }
        result /= 100000;
        this.blind_balance = result;
    }
    get_funds()
    {
        let result = [];
        for(let i=0;i<this.received_receipts.length;i++)
        {
            let tmp = [this.received_receipts[i].asset_id,this.received_receipts[i].value];
            result.push(tmp);
        }
        return result;
    }
    receive_receipt(R)
    {
        if(R === undefined || R === null){return false;}
        if(this.received_receipts === null || this.received_receipts === undefined){this.received_receipts = [];}
        this.received_receipts.push(R);
        this.update_blind_balance();
        return true;
    }
    isLocked()
    {
        if(this.privatekey[0] !== null)
        {
            if(this.privatekey.length < 70)
            {
                console.log("is not locked!");
                return false;
            }
            if(this.privatekey.length > 70)
            {
                console.log("is locked!");
                return true;
            }
        }
    }
    lock(p)
    {
        if(this.isLocked()){return;}
        this.privatekey = CJS.AES.encrypt(this.privatekey,p).toString();
        this.brainkey = CJS.AES.encrypt(this.brainkey,p).toString();
        for(let i=0;i<this.received_receipts.length;i++)
        {
            this.received_receipts[i].auth_privkey = CJS.AES.encrypt(this.received_receipts[i].auth_privkey,p).toString();
            this.received_receipts[i].blinding_factor = CJS.AES.encrypt(this.received_receipts[i].blinding_factor,p).toString();
            this.received_receipts[i].commitment = CJS.AES.encrypt(this.received_receipts[i].commitment,p).toString();
        }
        for(let i=0;i<this.sent_receipts.length; i++)
        {
            this.sent_receipts[i].receipt = CJS.AES.encrypt(this.sent_receipts[i].receipt,p).toString();
        }
    }
    unlock(p)
    {
        if(!this.isLocked()){return;}
        this.privatekey = CJS.AES.decrypt(this.privatekey,p).toString(CJS.enc.Utf8);
        this.brainkey = CJS.AES.decrypt(this.brainkey,p).toString(CJS.enc.Utf8);
        for(let i=0;i<this.received_receipts.length;i++)
        {
            this.received_receipts[i].auth_privkey = CJS.AES.decrypt(this.received_receipts[i].auth_privkey,p).toString(CJS.enc.Utf8);
            this.received_receipts[i].blinding_factor = CJS.AES.decrypt(this.received_receipts[i].blinding_factor,p).toString(CJS.enc.Utf8);
            this.received_receipts[i].commitment = CJS.AES.decrypt(this.received_receipts[i].commitment,p).toString(CJS.enc.Utf8);
        }
        for(let i=0;i<this.sent_receipts.length; i++)
        {
            this.sent_receipts[i].receipt = CJS.AES.decrypt(this.sent_receipts[i].receipt,p).toString(CJS.enc.Utf8);
        }
    }
}
export default Stealth_Account;