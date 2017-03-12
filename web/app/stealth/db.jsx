import Stealth_Account from "stealth/account";
import Stealth_Contact from "stealth/contacts";
class Stealth_DB
{
    constructor()
    {
        this.name = "Stealth_Wallet";
        this.contacts = [];
        this.accounts = [];
    }
    LACC()
    {
        return new Promise( (resolve, reject) => 
        {
            let stealth_accounts = [];
            let db = openDatabase(this.name, "1.0", "Stealth Keys", 2 * 1024 * 1024);
            db.transaction(function (tx) 
            {
                tx.executeSql("SELECT * FROM stealth_accounts", [], function(tx, results) 
                {
                    for(var i=0;i<results.rows.length;i++)
                    {
                        let slabel= results.rows.item(i).label;
                        let sbrainkey = results.rows.item(i).bkey;
                        let spublickey = results.rows.item(i).publickey;
                        let sprivatekey = results.rows.item(i).privatekey;
                        let saccount = results.rows.item(i).account;
                        let account = new Stealth_Account();
                        account.load_account(slabel,sbrainkey,spublickey,sprivatekey,saccount);
                        stealth_accounts.push(account);
                    }
                    if(results.rows.length>0)
                    {
                        resolve(stealth_accounts);
                    }
                    else
                    {
                        reject(false);
                    }
                });
            });
        });
    }
    LCTC()
    {
        return new Promise( (resolve, reject) => 
        {
            let stealth_contacts = [];
            let db = openDatabase(this.name, "1.0", "Stealth Keys", 2 * 1024 * 1024);
            db.transaction(function (tx) 
            {
                tx.executeSql("SELECT * FROM stealth_labels", [], function(tx, results) 
                {
                    for(var i=0;i<results.rows.length;i++)
                    {
                        let slabel= results.rows.item(i).label;
                        let spublickey = results.rows.item(i).publickey;
                        let contact = new Stealth_Contact();
                        contact.new_contact(slabel,spublickey);
                        stealth_contacts.push(contact);
                    }
                    if(results.rows.length>0)
                    {
                        resolve(stealth_contacts);
                    }
                    else
                    {
                        reject(false);
                    }
                });
            });
        });
    }
    get_account(name)
    {
        for(let i=0;i<this.accounts.length;i++)
        {
            if(this.accounts[i].label == name)
            {
                return this.accounts[i];
            }
        }
    }
    get_contact(name)
    {
        for(let i=0;i<this.contacts.length;i++)
        {
            if(this.contacts[i].label == name)
            {
                return this.contacts[i];
            }
        }
    }
}
export default Stealth_DB;