import {PrivateKey, key} from "agorise-bitsharesjs/es";
class Stealth_Account
{
    constructor()
    {
        this.label = "";
        this.brainkey = "";
        this.privatekey = "";
        this.publickey = "";
        this.account = "";
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
    load_account(label, brainkey,publickey,privatekey,account)
    {
        this.label = label;
        this.brainkey = brainkey;
        this.privatekey = privatekey;
        this.publickey = publickey;
        this.account = account;
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

        }
        else
        {
            throw new Error("Stealth_Account - new_account: Bad Input");
        }
    }
}
export default Stealth_Account;