import Stealth_Account from "stealth/account";
import Stealth_Contact from "stealth/contact";
class Stealth_DB
{
    constructor()
    {
        this.name = "Stealth_Wallet";
        this.accounts = [];
        this.contacts = []; 
        this.associated_account = "";
        this.label = "";
    }
    load_accounts()
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
    load_contacts()
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
                        let spublickey = results.rows.item(i).pubkey;
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
    Initialize()
    {
        return new Promise( (resolve, reject) => 
        {
            Promise.all([this.load_accounts(),this.load_contacts()]).then(function(results){
                this.accounts = results[0];
                this.contacts = results[1];
                resolve();
            }.bind(this));
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
        return false;//No such account
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
        return false;//No such contact
    }
    create_account(ACC)
    {
        return new Promise( (resolve, reject) => 
        {
            var db = openDatabase("Stealth_Wallet", "1.0", "Stealth Keys", 2 * 1024 * 1024);
            if(ACC.label !== "" && ACC.label !== null && ACC.brainkey !== null && ACC.brainkey !== "")
            {
                if(this.get_account(ACC.label) === false)
                {
                    db.transaction(function (tx) 
                    {
                        tx.executeSql("INSERT INTO stealth_accounts (label, bkey, publickey, privatekey, account) VALUES (?, ?, ?, ?, ?)",[ACC.label,ACC.brainkey,ACC.publickey,ACC.privatekey,ACC.account]);
                    });
                    resolve(true);
                }
                else
                {
                    reject(new Error("Stealth Account Already Exists!"));
                }
            }
            else
            {
                reject(new Error("Invalid Input!"));
            }
        });
    }
    add_contact(CTC)
    {
        return new Promise( (resolve, reject) => 
        {
            var db = openDatabase("Stealth_Wallet", "1.0", "Stealth Keys", 2 * 1024 * 1024);
            if(CTC.label !== "" && CTC.label !== null && ACC.publickey !== null && ACC.publickey !== "")
            {
                if(this.get_contact(CTC.label) === false)
                {
                    db.transaction(function (tx) 
                    {
                        tx.executeSql("INSERT INTO stealth_labels (label, publickey) VALUES (?, ?)",[CTC.label,CTC.publickey]);
                    });
                    resolve(true);
                }
                else
                {
                    reject(new Error("Stealth Contact Already Exists!"));
                }
            }
            else
            {
                reject(new Error("Invalid Input!"));
            }
        });
    }
    delete_account(name)
    {
        if(name == "" || name == undefined || name == null)
        {
            return false;
        }
        var db = openDatabase("Stealth_Wallet", "1.0", "Stealth Keys", 2 * 1024 * 1024);
        if(get_contact(name)!=false)
        {
            db.transaction(function (tx) 
            {
                tx.executeSql("DELETE FROM stealth_accounts WHERE label = ?",[name]);
            });
        }
    }
    delete_contact(name)
    {
        if(name == undefined || name == "" || name == null)
        {
            return false;
        }
        var db = openDatabase("Stealth_Wallet", "1.0", "Stealth Keys", 2 * 1024 * 1024);
        if(get_contact(name)!=false)
        {
            db.transaction(function (tx) 
            {
                tx.executeSql("DELETE FROM stealth_labels WHERE label = ?",[name]);
            });
            return true;
        }
        else
        {
            return new Error("Invalid Input!");
        }
    }
}
/*USAGE: 
        Loading up database;
        let DB = new SDB;
        DB.Load_Accounts().then(function(result)
        {
            if(result != false)
            {
                DB.accounts = result;
                let acc = DB.get_account("bla-01");
                console.log("WOOT FOUND:"+acc.publickey);
            }
            else
            {
                throw new Error("Stealth->DB->load_accounts Failed");
            }
        });
        DB.Load_Contacts().then(function(result)
        {
            if(result != false)
            {
                DB.contacts = result;
            }
            else
            {
                throw new Error("Stealth->DB->load_contacts Failed");
            }
        });
*/
export default Stealth_DB;