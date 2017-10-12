import Stealth_Account from "./account";
import Stealth_Contact from "./contact";
import Blind_Receipt from "./blind_receipt";
import Dexie from "dexie";
import AccountStore from "stores/AccountStore";
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
        this.sent_pbreceipts = [];
        this.associated_account = "";
        this.label = "";
        this.pubkey = "";
        this.IDB.version(1).stores({
            stealth_accounts: "id++,label,brain_key,public_key,private_key,associated_account,sent_receipts, received_receipts",
            stealth_contacts: "id++,label,public_key",
            sent_pbreceipts: "id++,from,to,receipt,value"
        });
    }
    Load_Accounts()
    {
        let Accounts = this.IDB.stealth_accounts;
        return Accounts.each(a=>{
            let SACC = new Stealth_Account();
            SACC.load_account(a.label, a.brain_key, a.public_key, a.private_key, a.associated_account,a.sent_receipts,a.received_receipts);
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
    Load_Sent_PBReceipts()
    {
        let Receipts = this.IDB.sent_pbreceipts;
        return Receipts.each(r=>{
            let RCPT = [r.from, new Blind_Receipt(r.to,r.receipt,r.value)];
            this.sent_pbreceipts.push(RCPT);
        });
    }
    Initialize()
    {
        return Promise.all([this.Load_Accounts(),this.Load_Contacts(),this.Load_Sent_PBReceipts()]);
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
            associated_account: A.account,
            sent_receipts: []
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
    create_sent_pbreceipt(a,R)
    {
        this.IDB.sent_pbreceipts
        .put({
            from: a,
            to: R.associated,
            receipt: R.receipt,
            value: R.value
        }).then(()=>{this.sent_pbreceipts.push([a,R]);});
        return true;
    }
    modify_account(A,what,to)
    {
        if(A !== false && A!==null)
        {
            this.IDB.stealth_accounts.where("label").equals(A.label).modify({what: to});
            this.Load_Accounts();
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
    Is_Public(a)
    {
        let accs = AccountStore.getMyAccounts();
        for(var i=0;i<accs.length;i++)
        {
            if(a == accs[i]) return accs[i];
        }
        return false;
    }
    stripat(x)
    {
        if(x !== null)
        {
            let result = "";
            for(var i=1;i<x.length;i++)
            {
                result+=x[i];
            }
            return result;
        }
        return false;
    }
    /* @Log_Sent_Receipt(a,c,r)
     * @a: account label with or without @ it doesn't matter.
     * @c: contact label with or without @ it doesn't matter.
     * @r: the receipt to send
    */
    Log_Sent_Receipt(a, c, r, v)
    {
        console.log("LOGGING SENT RECEIPT A:"+a+" c:"+c+" r:"+r+" v:"+v);
        if(a === null){ return new Error("You haven't specified the account name you sent to."); }
        if(a[0] === "@"){ a = this.stripat(a); }
        if(c === null){return new Error("You haven't specified the contact you sent to.");}
        if(c[0] === "@"){ c = this.stripat(c); }
        let A = null; let Apublic = false;
        let C = null; let Cpublic = false;
        if(this.Is_Public(a)){Apublic = true; A=a;}else{A = this.get_account(a);}
        if((c[0] !== "B" && c[1] !== "T" && c[2] !== "S") || (c[0] !== "T" && C[1] !== "E" && c[2] !== "S" && c[3] !== "T"))
        {if(this.Is_Public(c)){Cpublic = true;C=c;}else{C = this.get_contact(c);}}else{C = c;}
        if(Apublic && !Cpublic){this.create_sent_pbreceipt(a,new Blind_Receipt(C,r,v));}//Public To Stealth
        if(Apublic && Cpublic){A.send_receipt(new Blind_Receipt(C,r,v)); modify_account(A,"sent_receipts",A.sent_receipts);} //Stealth To Stealth
    }
    /* Log_Received_Receipt(a,c,r,v)
     * @a: Account you wish to receive receipt for.
     * @c: Contact/Address/null==unknown
     * @r: Receipt TEXT in itself.
     * @v: value/received ammount.
    */
    Log_Received_Receipt(a, c, r, v)
    {
        console.log("Logging Received receipt: A-"+a+" R:"+r+" V-"+v);
        if(r === null || v === null || a === null){ console.log("Error in logging receipt, either no account, value or receipt was passed."); return false;}
        if(c === null){c = "UNKNOWN";}
        let A = this.get_account(a);
        if(!A){console.log("No such stealth account!"); return false;}
        let R = new Blind_Receipt(c,r,v);
        A.receive_receipt(R);
        if(modify_account(A,"sent_receipts",A.sent_receipts)){return true;}
    }
}
/*USAGE: 
        let DB = new Stealth_DB()
        DB.Initialize().then(()=>
        {
            do something with it
        })
*/
export default Stealth_DB;