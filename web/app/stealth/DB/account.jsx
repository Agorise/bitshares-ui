import {PrivateKey, key} from "agorise-bitsharesjs/es";
import Blind_Receipt from "./blind_receipt";
import AES from "crypto-js";
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
    receive_receipt(R)
    {
        if(R === undefined || R === null){return false;}
        if(this.received_receipts === null || this.received_receipts === undefined){this.received_receipts = [];}
        this.received_receipts.push(R);
        this.update_blind_balance();
        return true;
    }
    lock(p)
    {
        this.privatekey = AES.encrypt(this.privatekey,p);
        this.brainkey = AES.encrypt(this.brainkey,p);
        for(let i=0;i<this.received_receipts.length;i++)
        {
            this.received_receipts[i].auth_privkey = AES.encrypt(this.received_receipts[i].auth_privkey,p);
            this.received_receipts[i].blinding_factor = AES.encrypt(this.received_receipts[i].blinding_factor,p);
            this.received_receipts[i].commitment = AES.encrypt(this.received_receipts[i].commitment,p);
        }
        for(let i=0;i<this.sent_receipts.length; i++)
        {
            this.sent_receipts[i].receipt = AES.encrypt(this.sent_receipts[i].receipt,p);
        }
    }
    unlock(p)
    {
        this.privatekey = AES.decrypt(this.privatekey,p);
        this.brainkey = AES.decrypt(this.brainkey,p);
        for(let i=0;i<this.received_receipts.length;i++)
        {
            this.received_receipts[i].auth_privkey = AES.decrypt(this.received_receipts[i].auth_privkey,p);
            this.received_receipts[i].blinding_factor = AES.decrypt(this.received_receipts[i].blinding_factor,p);
            this.received_receipts[i].commitment = AES.decrypt(this.received_receipts[i].commitment,p);
        }
        for(let i=0;i<this.sent_receipts.length; i++)
        {
            this.sent_receipts[i].receipt = AES.decrypt(this.sent_receipts[i].receipt,p);
        }
    }
}
export default Stealth_Account;