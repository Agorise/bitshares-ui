import Stealth_Account from "./account";
import Stealth_Contact from "./contact";
import Dexie from "dexie";
class Stealth_DB
{
    constructor()
    {
        this.initialized = false;
        this.IDB = new Dexie("Stealth_Wallet");
        this.accounts = [];
        this.contacts = [];
        this.receipts = [];
        this.associated_account = "";
        this.label = "";
        this.pubkey = "";
        this.IDB.version(1).stores({
            stealth_accounts: "id++,label,brain_key,public_key,private_key,associated_account",
            stealth_contacts: "id++,label,public_key",
            receipts: "id++,account,receipt"
        });
    }
    Load_Accounts()
    {
        let Accounts = this.IDB.stealth_accounts;
        return Accounts.each(a=>{
            let SACC = new Stealth_Account();
            SACC.load_account(a.label, a.brain_key, a.public_key, a.private_key, a.associated_account);
            this.accounts.push(SACC);
        });
    }
    Load_Contacts()
    {
        let Contacts = this.IDB.stealth_contacts;
        return Contacts.each(c=>{
            let SCTC = new Stealth_Contact(c.label,c.public_key);
            this.contacts.push(SCTC);
        });
    }
    Load_Receipts()
    {
        let Receipts = this.IDB.receipts;
        Receipts.each(r=>{
            let RCPT = new Stealth_Receipt(r.account,r.receipt);
            this.receipts.push(RCPT);
        });
    }
    Initialize()
    {
        return Promise.all([this.Load_Accounts(),this.Load_Contacts(),this.Load_Receipts()]);
    }
    get_account(a)
    {
        for(var i=0;i<this.accounts.length;i++)
        {
            console.log("SEARCHING: "+this.accounts[i].label);
            if(this.accounts[i].label===a)
            {
                return this.accounts[i];
            }
        }
        return false;
    }
    get_contact(c)
    {
        for(var i=0;i<this.contacts.length;i++)
        {
            if(this.contacts[i].label===c)
            {
                return this.contacts[i];
            }
        }
        return false;
    }
    create_account(A)
    {
        if(this.get_account(A.label) !== false){return false;}
        this.IDB.stealth_accounts
        .put({
            label: A.label,
            brain_key: A.brainkey,
            private_key: A.privatekey,
            public_key: A.publickey,
            associated_account: A.account
        }).then(()=>{this.accounts.push(A);});
        return true;
    }
    create_contact(C)
    {
        if(this.get_contact(C.label) !== false){return false;}
        this.IDB.stealth_contacts
        .put({
            label: C.label,
            public_key: C.publickey
        });
        return true;
    }
    delete_account(A)
    {
        let X = this.get_account(A);
        if(X !== false)
        {
            this.IDB.stealth_accounts.where("label").equals(A).delete();
            return true;
        }
        return false;
    }
    delete_contact(C)
    {
        let X = this.get_contact(C);
        if(X !== false)
        {
            this.IDB.stealth_contacts.where("label").equals(C).delete();
            return true;
        }
        return false;
    }
}
/*USAGE: 
        let DB = new Stealth_DB()
        DB.Initialize().then(()=>{
            do something with it
        })
*/
export default Stealth_DB;