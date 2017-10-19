import {PrivateKey, key} from "agorise-bitsharesjs/es";
import Blind_Receipt from "./blind_receipt";
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
    update_blind_balance()
    {
        let result = null;
        for(let i=0;i<this.received_receipts.length;i++)
        {
            result += parseFloat(this.received_receipts[i].value);
        }
        for(let i=0;i<this.sent_receipts.length;i++)
        {
            result -= parseFloat(this.sent_receipts[i].value);
        }
        result /= 100000;
        this.blind_balance = result;
    }
    receive_receipt(R)
    {
        if(this.received_receipts === null || this.received_receipts === undefined){this.received_receipts = [];}
        this.received_receipts.push(R);
        this.update_blind_balance();
    }
}
export default Stealth_Account;