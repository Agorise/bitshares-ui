import Stealth_Account from "./account";
import Stealth_Contact from "./contact";
import Blind_Receipt from "./blind_receipt";
import Dexie from "dexie";
import AccountStore from "stores/AccountStore";
import {ChainConfig} from "bitsharesjs-ws";
import CJS from "crypto-js";//remove from here.
import {bin2hex,hex2str} from "stealth/utility";
/* Standards:
 * Capital letters represent Objects.
 * Lowercase letters represent strings.
 * !!! USAGE: 
        let DB = new Stealth_DB()
        DB.Initialize().then(()=>
        {
            do something with it
        })
*/
class Stealth_DB
{
    constructor()
    {
        this.initialized = false;
        this.tempy = null;
        this.IDB = new Dexie("Stealth_Wallet");
        this.accounts = [];
        this.contacts = [];
        this.sent_pbreceipts = [];
        this.associated_account = "";
        this.label = "";
        this.pubkey = "";
        this.IDB.version(1).stores({
            stealth_accounts: "id++,label,brain_key,public_key,private_key,associated_account,sent_receipts, received_receipts, blind_balance",
            stealth_contacts: "id++,label,public_key",
            sent_pbreceipts: "id++,from,to,receipt,value",
            settings: "id++,name,setting"
        });
        this.cjs = CJS;
    }
    Load_Accounts()
    {
        this.accounts = [];
        let Accounts = this.IDB.stealth_accounts;
        return Accounts.each(a=>{
            if(!this.get_account(a.label))
            {
                let SACC = new Stealth_Account();
                SACC.load_account(a.label, a.brain_key, a.public_key, a.private_key, a.associated_account,a.sent_receipts,a.received_receipts,a.blind_balance);
                this.accounts.push(SACC);
            }
        });
    }
    Load_Contacts()
    {
        this.contacts = [];
        let Contacts = this.IDB.stealth_contacts;
        return Contacts.each(c=>{
            if(!this.get_contact(c.label))
            {
                let SCTC = new Stealth_Contact(c.label,c.public_key);
                this.contacts.push(SCTC);
            }
        });
    }
    Load_Sent_PBReceipts()
    {
        this.sent_pbreceipts = [];
        let Receipts = this.IDB.sent_pbreceipts;
        return Receipts.each(r=>{
            let RCPT = [r.from, new Blind_Receipt(r.to,r.receipt,r.value)];
            this.sent_pbreceipts.push(RCPT);
        });
    }

    get_account(a)
    {
        for(var i=0;i<this.accounts.length;i++)
        {
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
    Get_Raw_Balance_List(a)
    {
        if(typeof(a) !== "string"){return false;}
        let A = this.get_account(a);
        if(A === false){return A;}
        let x = A.get_funds();
        let result = [];
        for(let i=0;i<x.length;i++)
        {
            if(!(x[i].spent))
            {
                let coin = {asset_id: x[i].asset_id,value: x[i].value};
                result.push(coin);
            }
        }
        //console.log("RAW:");
        //console.log(result);
        return result;
    }
    Get_Balance_List(a)
    {
        let processing = this.Get_Raw_Balance_List(a);
        let discovered_coin_name  = [];
        let discovered_coin_value = [];
        for(let i=0;i<processing.length;i++)
        {
            let tmp = discovered_coin_name;
            let position = tmp.indexOf(processing[i].asset_id);
            if(position !== -1)
            {
                discovered_coin_value[position] = (parseFloat(discovered_coin_value[position])+(parseFloat(processing[i].value)/100000)).toString();
            }
            else
            {
                discovered_coin_name.push(processing[i].asset_id);
                discovered_coin_value.push((parseFloat(processing[i].value)/100000));
            }
        }
        let result = [];
        for(let x=0;x<discovered_coin_name.length;x++)
        {
            let coin = {asset_id: discovered_coin_name[x],value: discovered_coin_value[x]};
            result.push(coin);
        }
        return result;
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
            sent_receipts: A.sent_receipts,
            received_receipts: A.received_receipts,
            blind_balance: A.blind_balance
        }).then(()=>{this.accounts.push(A);this.Update_Blind_Balance(A);});
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
            this.IDB.stealth_accounts.where("label").equals(A.label).modify({[what]:to}).then(()=>{
                this.Load_Accounts();
            });
        }
        return false;
    }
    delete_account(c)
    {
        let X = this.get_account(c);
        if(X !== false)
        {
            this.IDB.stealth_accounts.where("label").equals(c).delete();
            this.Load_Accounts();
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
            this.Load_Contacts();
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
            if(x[0] === "@")
            {
                let result = "";
                for(var i=1;i<x.length;i++)
                {
                    result+=x[i];
                }
                return result;
            }
        }
        return x;
    }
    update_account(A)
    {
        this.modify_account(A, "label", A.label);
        this.modify_account(A, "public_key", A.publickey);
        this.modify_account(A, "private_key", A.privatekey);
        this.modify_account(A, "brain_key", A.brainkey);
        this.modify_account(A, "blind_balance", A.blind_balance);
        this.modify_account(A, "sent_receipts", A.sent_receipts);
        this.modify_account(A, "received_receipts", A.received_receipts);
    }
    Is_Locked()
    {
        if(this.accounts.length > 0)
        {
            if(this.accounts[0].isLocked()){return true;}
            else{return false;}
        }
    }
    Lock()
    {
        this.tempy = this.IDB.settings.where("name").equals("pkey").each(p =>{this.tempy = p.setting;}).then(()=>{
            if(this.tempy === undefined){return;}
            if(!this.Is_Locked())
            {
                length = this.accounts.length;
                for(let i = 0; i < length ;i++)
                {
                    this.accounts[i].lock(this.tempy);
                }
                for(let i=0;i<length;i++){this.update_account(this.accounts[i]);}
                this.tempy = null;
            }
            this.IDB.settings.where("name").equals("pkey").delete();
        });
    }
    Unlock(password)
    {
        this.IDB.settings.where("name").equals("pkey").delete();
        this.tempy = CJS.HmacSHA3(password,password).toString();

        if(this.Is_Locked())
        {
            for(let i=0;i<this.accounts.length;i++)
            {
                this.accounts[i].unlock(this.tempy);
                this.update_account(this.accounts[i]);
            }
        }
        let tempty = this.tempy;
        this.IDB.settings.put({name: "pkey", setting: tempty});
        this.tempy = null;
    }
    check_existing_receipts(R)
    {
        for(let i=0;i<this.accounts.length;i++)
        {
            for(let x = 0;x<this.accounts[i].received_receipts.length;x++)
            {
                if(this.accounts[i].received_receipts[x].commitment === R.commitment)
                {
                    return true;
                }
            }
        }
        return false;
    }
    /*Initialize()
     * First function to be called, It loads the database and returns a promise. Use the callback method to execute whatever you need with it.
     * Usage Example: 
        let
        DB.Initialize().then(()=>
        {
            do something with it
        })
    */
    Initialize()
    {
        return Promise.all([this.Load_Accounts(),this.Load_Contacts(),this.Load_Sent_PBReceipts()]);
    }

    /*@Create_Account(label,associated_account)
     * @label: The account name desired.
     * @associated_account: the public account it's associated to.
    */
    Create_Account(label,associated_account)
    {
        let ACC = new Stealth_Account;
        ACC.new_account(label,associated_account);
        if(this.create_account(ACC)){console.log("Stealth Account created successfully!");}
        else{console.log("Something went wrong in creating Stealth Account!");}
    }

    /*@Add_Contact(label,address)
     * @label: The contact name you wish to associate with a publickey.
     * @address: The public key you wish to label.
    */ 
    Add_Contact(label,address)
    {
        let CTC = new Stealth_Contact(label,address);
        if(CTC.validate_contact())
        {
            if(this.create_contact(CTC)){console.log("Stealth Contact added successfully!"); return true;}
            else{console.log("Error in creating contact!");return false;}
        }
    }
    /* get_index(What, key)
     * Searches the database for an account or contact, using the passed key, and returns that object.
     * @what: "account" or "contact"
     * @key: label, public, privatkey string.
     * returns the account index in this DB accounts or contacts array.(not indexeddb.)
    */
    get_index(What, key)
    {
        let what = What.toLowerCase();
        let searchee = null;
        //Searching for contact
        if(what === "contact")
        {
            searchee = this.contacts;
            for(let i=0;i<searchee.length;i++)
            {
                if(searchee[i].label === key || searchee[i].publickey === key)
                {
                    return i;
                }
            }
        }
        //Searching for account
        if(what === "account")
        {
            searchee = this.accounts;
            for(let i=0;i<searchee.length;i++)
            {
                if(searchee[i].label === key || searchee[i].publickey === key || searchee[i].privatekey === key)
                {
                    return i;
                }
            }
        }
        return false;
    }

    check_valid_publickey(key)
    {
        let prefix = ChainConfig.address_prefix;
        if(key.length > prefix.length)
        {
            for(let i=0;i<prefix.length;i++)
            {
                if(key[i] !== prefix[i])
                {
                    return false;
                }

            }
            return true;
        }
        return false;
    }
    check_valid_privatekey(key)
    {
        if(key.length === 51 && key[0] === "5"){return true;}
        return false;
    }
    /*@Get(what, label_or_publickey)
     * Description: Searches for account or contact with label or publickey, returns the account object.
     * @what: expects either "account" or "contact" to know what to search for.
     * @key: contact/account contents you're using to search with.
     * @return: the account or contact object, if none found, returns false.
     * 
     * Example: Stealth_DB.Get("Account","MyAccountName") or Stealth_DB.Get("Contact","BTSaddresshere")
    */
    Get(What, Key)
    {
        let key = this.stripat(Key);
        let pubkey = this.check_valid_publickey(key);
        let privkey = this.check_valid_privatekey(key);
        if(!pubkey && !privkey){key = key.toLowerCase();}
        let what = What.toLowerCase();
        let searchee = null;
        //Searching for contact
        if(what === "contact")
        {
            searchee = this.contacts;
            for(let i=0;i<searchee.length;i++)
            {
                if(searchee[i].label === key || searchee[i].publickey === key)
                {
                    return searchee[i];
                }
            }
        }
        //Searching for account
        if(what === "account")
        {
            searchee = this.accounts;
            for(let i=0;i<searchee.length;i++)
            {
                if(searchee[i].label === key || searchee[i].publickey === key || searchee[i].privatekey === key)
                {
                    return searchee[i];
                }
            }
        }
        return false;
    }
    /* Update_Blind_Balance(A)
     * Updates the balance of the account object passed in the object, then using the object, in the DB.
     * @A: Stealth_Account object.
     */
    Update_Blind_Balance(A)
    {
        A.update_blind_balance();
        this.modify_account(A,"blind_balance",A.blind_balance);
    }
    /* PrivKeyFinder(publickey)
     * @publickey: Public key of the account you are searching for. (String, E.g: "BTSxyz.....")
     * @Return: privatekey (String) or false.
     */
    PrivKeyFinder(publickey)
    {
        let found = this.Get("account", publickey).privatekey;
        if(found !== false){return found;}
        return false;
    }
    /* @Log_Sent_Receipt(a,c,r)
     * @a: account label with or without @ it doesn't matter.
     * @c: contact label with or without @ it doesn't matter.
     * @r: the receipt to send
    */
    Log_Sent_Receipt(a, c, r, v)
    {
        if(a === null){ return new Error("You haven't specified the account name you sent to."); }
        if(a[0] === "@"){ a = this.stripat(a); }
        if(c === null){return new Error("You haven't specified the contact you sent to.");}
        if(c[0] === "@"){ c = this.stripat(c); }
        let A = null; let Apublic = false;
        let C = null; let Cpublic = false;
        if(this.Is_Public(a)){Apublic = true; A=a;}else{A = this.get_account(a);}
        if((c[0] !== "B" && c[1] !== "T" && c[2] !== "S") || (c[0] !== "T" && C[1] !== "E" && c[2] !== "S" && c[3] !== "T")){
            if(this.Is_Public(c)){Cpublic = true;C=c;}
            else{C = this.get_contact(c);if(C === false){ C = this.get_account(c);if(C === false){console.log("Error, recipient doesn't exist!");return;}}}}
        else{C = c;}
        if(Apublic && !Cpublic){this.create_sent_pbreceipt(a,new Blind_Receipt(C,r,v)); this.Update_Blind_Balance(C);}//Public To Stealth
        if(Apublic && Cpublic){A.send_receipt(new Blind_Receipt(C,r,v)); this.modify_account(A,"sent_receipts",A.sent_receipts); this.Update_Blind_Balance(A);} //Stealth To Stealth
    }
    /* Stash(Receipt)
     * @BC: Blind_Coin object holding condensed information
     * @To_Account: Publickey of the BC's owner.
     * @Return: true/false
    */
    Stash(BC, To_Account)
    {
        if(this.check_existing_receipts(BC)){return false;};
        this.accounts[this.get_index("account", To_Account)].receive_receipt(BC);
        let A = this.accounts[this.get_index("account", To_Account)];
        if(A !== false)
        {
            this.modify_account(A,"received_receipts",A.received_receipts);
            this.Update_Blind_Balance(A);
            return true;
        }
        return false;
    }
    /*ProcessSpending(sacc_label, commit_arr, newcoin_arr)
     * Description: Processes spending, sets used coins as spent, and updates with new coins.
     * @sacc_label: label of the account we're working on.
     * @commit_arr: commitment array to set used coins as spent.
     * @newcoin_arr: new coins (if any) to update the account with the remainder from the transaction.
     * Returns true or false based on success.
     */
    ProcessSpending(sacc_label, commit_arr,newcoin_arr)
    {
        for(let i=0;i<commit_arr.length;i++)
        {
            if(!(this.accounts[this.get_index("account", sacc_label)].mark_spent(commit_arr[i]))){return false; console.log("ERROR! Process Spending/Acc.mark_spent: No such coin!");};
        }
        for(let x=0;x<newcoin_arr.length;x++)
        {
            if(!(this.accounts[this.get_index("account", sacc_label)].receive_receipt(newcoin_arr[x]))){return false;}
        }
        let A = this.accounts[this.get_index("account", sacc_label)];
        this.modify_account(A,"received_receipts",A.received_receipts);
        this.Update_Blind_Balance(A);
        return true;
    }
    /* GetUnspentCoins(sacc_identifier)
     * Description: Returns the unspent coins of the account found using the passed identifier which can be a label, public, or private key.
     * @sacc_identifier: label, privatekey, publickey (string)
     * returns an array of unspent BC database objects.
    */
    GetUnspentCoins(sacc_identifier)
    {
        let unspent = [];
        let A = this.Get("account", sacc_identifier);
        if(A === false){return A;}
        for(let i=0;i<A.received_receipts.length;i++)
        {
            if(!(A.received_receipts[i].spent))
            {
                unspent.push(A.received_receipts[i]);
            }
        }
        return unspent;
    }
    /*Get_Account_List()
     * Description: Returns an array of stealth account names/labels present in the DB.
     */
    Get_Account_List()
    {
        let result = [];
        for(let i=0;i<this.accounts.length;i++)
        {
            result.push("@"+this.accounts[i].label);
        }
        return result;
    }
    /*Get_Account_List()
     * Description: Returns an array of stealth contact names/labels present in the DB.
     */
    Get_Contact_List()
    {
        let result = [];
        for(let i=0;i<this.contacts.length;i++)
        {
            result.push("@"+this.contacts[i].label);
        }
        return result;
    }

    /* !!!
     *Do not use what's under this yet!
     * !!!
    */

    /* Export_Account(sacc_identifier)
     * Description: returns an json string of the locked account you want.
     * @sacc_identifier: label/publickey/privatekey string
     * returns account object as json string.
     */
    Export_Account(sacc_identifier)
    {
        if(this.tempy !== null){this.Lock();}
        let A = this.Get("account", sacc_identifier);
        if(A === false){return false;}
        return JSON.stringify(A);
    }
    /* Export_Contact(sctc_identifier)
     * Description: returns an json string of the locked contact you want.
     * @sctc_identifier: label/publickey/privatekey string
     * returns contact object as json string.
     */
    Export_Contact(sctc_identifier)
    {
        if(this.tempy !== null){this.Lock();}
        let C = this.Get("contact", sctc_identifier);
        if(C === false){return false;}
        return JSON.stringify(C);
    }
    /* Export_DB()
     * Description: returns an array of locked accounts & contacts for further processing
     */
    Export_DB()
    {
        let accs = [];
        let ctcs = [];
        let result = [];
        for(let i=0;i<this.accounts.length;i++)
        {
            accs.push(this.Export_Account(this.accounts[i].label));
        }
        for(let i=0;i<this.contacts.length;i++)
        {
            ctcs.push(this.Export_Contact(this.contacts[i].label));
        }
        result.push(accs);
        result.push(ctcs);
        return result;
    }
    Import_Account(backup)
    {
        if(backup === null){console.log("Null input passed to Import_DB!");}
        let o = backup;
        let A = new Stealth_Account();
        A.load_account(o.label, o.brainkey,o.publickey,o.privatekey,o.account,o.sent_receipts,o.received_receipts,o.balance);
        if(!this.get_account(A.label))
        {
            this.create_account(A);
        }
    }
    Import_Contact(backup)
    {
        if(backup === null){console.log("Null input passed to Import_DB!");}
        let o = null;
        if(backup.constructor === Uint8Array){o = JSON.parse(hex2str((bin2hex(backup))));}
        else{ o = backup; }
        let C = new Stealth_Contact();
        C.set_contact(o.label, o.public_key);
        this.create_contact(C);
    }
    Import_DB(backup)
    {
        if(backup === null){console.log("Null input passed to Import_DB!");}
        let O = backup;
        let ACCS = O[0];
        let CTCS = O[1];
        for(let i=0;i<O[0].length;i++)
        {
            this.Import_Account(JSON.parse(ACCS[i]));
        }
        for(let i=0;i<O[1].length;i++)
        {
            this.Import_Contact(JSON.parse(CTCS[i]));
        }
        return true;
    }
    Check_Import_Type(I_OBJ)
    {
        if(I_OBJ === null){return false;}
        if(I_OBJ.privatekey !== undefined){return "account";} //Account 
        if(I_OBJ.label !== undefined && I_OBJ.privatekey !== undefined){return "contact";} //Contact
        if(I_OBJ[0] !== null){return "full_backup";} //Full Backup
    };
    Import(backup)
    {
        let x = JSON.parse(hex2str((bin2hex(backup))));
        let type = this.Check_Import_Type(x);
        if(type === "account"){this.Import_Account(x);}
        if(type === "contact"){this.Import_Contact(x);}
        if(type === "full_backup"){this.Import_DB(x);}
    }
}
export default Stealth_DB;