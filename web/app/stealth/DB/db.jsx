import Stealth_Account from "./account";
import Stealth_Contact from "./contact";
import Blind_Receipt from "./blind_receipt";
import Dexie from "dexie";

/* Standards:
 * Capital letters represent Objects.
 * Lowercase letters represent strings.
 */
class Stealth_DB
{
    constructor()
    {
        this.initialized = false;
        this.IDB = new Dexie("Stealth_Wallet");
        this.accounts = [];
        this.contacts = [];
        this.blind_receipts = [];
        this.associated_account = "";
        this.label = "";
        this.pubkey = "";
        this.IDB.version(1).stores({
            stealth_accounts: "id++,label,brain_key,public_key,private_key,associated_account,sent_receipts",
            stealth_contacts: "id++,label,public_key",
            blind_receipts: "id++,account,receipt"
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

    Initialize()
    {
        return Promise.all([this.Load_Accounts(),this.Load_Contacts(),this.Load_Blind_Receipts()]);
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
        }).then(()=>{this.contacts.push(C);});
        return true;
    }

    modify_account(A,what,to)
    {
        if(A !== false)
        {
            this.IDB.stealth_accounts.where("label").equals(A.label).modify({what: to});
            return true;
        }
        return false;
    }

    delete_account(c)
    {
        let X = this.get_account(c);
        if(X !== false)
        {
            this.IDB.stealth_accounts.where("label").equals(c).delete();
            return true;
        }
        return false;
    }

    delete_contact(c)
    {
        let X = this.get_contact(c);
        if(X !== false)
        {
            this.IDB.stealth_contacts.where("label").equals(c).delete();
            return true;
        }
        return false;
    }
    
    delete_receipt(r)//r = receipt string
    {
        let X = this.get_receipt(r);
        if(X !== false)
        {
            this.IDB.blind_receipts.where("receipt").equals(r).delete();
            return true;
        }
        return false;
    }
    /* @Log_Sent_Receipt(a,c,r)
     * @a: account label with or without @ it doesn't matter.
     * @c: contact label with or without @ it doesn't matter.
     * @r: the receipt to send
    */
    Log_Sent_Receipt(a, c, r)
    {
        let stripat = (x) => { // To be converted to utility.
            if(x !== null)
            {
                let result = "";
                for(var i=1;i<x.length();i++)
                {
                    result+=x[i];
                }
                return result;
            }
        };
        if(a === null){ return new Error("You haven't specified the account name you sent to."); }
        if(a[0] === "@"){ a = stripat(a); }
        if(c === null){return new Error("You haven't specified the contact you sent to.");}
        if(c[0] === "@"){ c = stripat(c); }
        let A = this.get_account(a);
        let C = null;
        if(A!==false)
        {
            if(c !== null && c !== 0)
            {
                if(c.length > 20)
                {
                    if((c[0] !== "B" && c[1] !== "T" && c[2] !== "S") || (c[0] !== "T" && C[1] !== "E" && c[2] !== "S" && c[3] !== "T"))
                    {
                        C = get_contact(c);
                        if(C === false)
                        {
                            return new Error("ERROR SENDING RECEIPT, the contact you have specified doesn't exist, perhaps you should create it first?");
                        }
                    }
                }
            }
            A.sent_receipts.push(new Blind_Receipt(C,r));
            modify_account(A,"sent_receipts",A.sent_receipts);
        }
    }
}
/*USAGE: 
        let DB = new Stealth_DB()
        DB.Initialize().then(()=>{
            do something with it
        })
*/
export default Stealth_DB;