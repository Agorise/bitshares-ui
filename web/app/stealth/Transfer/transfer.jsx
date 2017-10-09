import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import WalletDb from "stores/WalletDb";
import { Asset } from "common/MarketClasses";
import Stealth_Account from "stealth/DB/account";
import Stealth_Contact from "stealth/DB/contact";
import Stealth_DB from "stealth/DB/db";
import {ChainStore, TransactionBuilder} from "agorise-bitsharesjs/es";
import {PrivateKey, PublicKey, /*Aes,*/ key, hash} from "agorise-bitsharesjs/es/ecc";
import {blind_output,blind_memo,blind_input,blind_output_meta,
        blind_confirmation,stealth_cx_memo_data,stealth_confirmation,
        transfer_to_blind_op,transfer_from_blind_op,blind_transfer_op
       } from "stealth/Transfer/confidential";
import {BLIND_ECC} from "stealth/Transfer/commitment/commitment";
import StealthZK from "stealth/Transfer/stealthzk.js";
import * as Serializer from "agorise-bitsharesjs/es/serializer/src/operations.js";

const DEBUG = true;
/**
 *  Class encapsulates the credentials of an ACCOUNT, (stealth OR non-stealth)
 *  that are needs to participate (as either sender OR receiver) in a stealth
 *  transaction. This class adds some uniformity to the various account and
 *  contact stores for all combinations of public/blind/stealth senders and
 *  recipients.
 */
class StealthID {

    /**
     *  @arg label_or_account - if a string, assume stealth account or
     *           contact, and subsequent args will/may be set.  If not string,
     *           then assume a ChainStore Account object for a PUBLIC account.
     */
    constructor(label_or_account, pubkeyobj, privkeyobj) {
        if (typeof label_or_account === "string") {
            this.label = label_or_account;
            this.markedlabel = "@"+this.label;
            this.pubkey = pubkeyobj;
            this.privkey = privkeyobj;  // may be null or undefined
            this.isblind = true;
            // TODO Assert test that pubkey matches privkey?
        } else {
            this.account = label_or_account;
            this.label = this.account.get("name");
            this.markedlabel = this.label;
            this.id = this.account.get("id");
            this.isblind = false;
        }
    }

    static isStealthLabel(labelstring) {
        return (labelstring[0]==="@");
    }
    static stripStealthMarker(labelstring) {
        return (labelstring[0]==="@") ? labelstring.slice(1)
                                      : labelstring;
    }
    
}

/**
 *  Wraps up a stealth transfer in a convenient class. 
 */
class Stealth_Transfer
{

    /*
     */
    constructor(stealth_DB,from,to,asset,amount,transaction_type)
    {
        this.from = from;       // Taken as string but we promote below
        this.to = to;           //   ''
        this.asset = asset;     // object, use .get("id"), eg, to get "1.3.0"
        this.amount = amount;   // in base units (ie 1.0 BTS = 100000)
        this.transaction_type = transaction_type;
        this.saccs = stealth_DB.accounts;
        this.sctc = stealth_DB.contacts;
        this.messagetxt = "";   // The memo field; Generally ignored for
                                // stealth TX but gonna temporarily use it to
                                // pass receipt text.
        
        // Validate this.from: Needs to be spendable so must be either in
        // regular accounts or stealth accounts.
        if (StealthID.isStealthLabel(this.from)) {
            this.from = this.findStealthAccountByName(this.from);
        } else {
            this.from = this.findMyRegularAccountByName(this.from);
        }

        // Validate this.to: Can be from anywhere: regular accounts (my own or
        // someone else's), stealth accounts, or stealth contacts.  We
        // prioritize our own stealth account if a label is found in both
        // stealth accounts and contacts.
        if (StealthID.isStealthLabel(this.to)) {
            try      { this.to = this.findStealthAccountByName(this.to); }
            catch(e) { this.to = this.findStealthContactByName(this.to); }
        } else {
            this.to = this.findAnyRegularAccountByName(this.to);
        }

        DEBUG && console.log("WSCAT: Suggested rpc tests follow.\n"
                             + "WSCAT: Connect with: "
                             + "wscat -c wss://node.testnet.bitshares.eu/");
        console.log("STEALTHXFR: Constructor after interpretation", this);
    }

    // PROPOSE TO MOVE the following account-finding functions to StealthDB
    // class:
    
    findMyRegularAccountByName(name) {
        let accounts = AccountStore.getMyAccounts();
        for(let i=0;i<accounts.length;i++) {
            if(accounts[i] == name) {
                return new StealthID(ChainStore.getAccount(accounts[i]));}
        }
        throw "Could not find name in regular accounts";
    }
    findAnyRegularAccountByName(name) {
        return new StealthID(ChainStore.getAccount(name));
    }
    findStealthAccountByName(name) {
        let accounts = this.saccs;
        let namelabel = StealthID.stripStealthMarker(name);
        for(let i=0;i<accounts.length;i++) {
            if(accounts[i].label == namelabel) {
                return new StealthID(
                    namelabel,
                    PublicKey.fromStringOrThrow(accounts[i].publickey),
                    PrivateKey.fromWif(accounts[i].privatekey));}
        }
        throw "Could not find name in stealth accounts";
    }
    findStealthAccountMatchingPubkey(pubkey) {
        // TODO tolerate string or object arg; for now assume obj
        let pubkeystring = pubkey.toString();
        let accounts = this.saccs; 
        for(let i=0;i<accounts.length;i++) {
            if(accounts[i].publickey == pubkey.toString()) {
                let privkey = PrivateKey.fromWif(accounts[i].privatekey);
                // TODO assert privkey PubKey matches accounts[i] pubkey
                return new StealthID(accounts[i].label,
                                     privkey.toPublicKey(),
                                     privkey);}
        }
        throw new Error("No privkey for pubkey in saccs");
    }
    findStealthContactByName(name) {
        let contacts = this.sctc;
        let namelabel = StealthID.stripStealthMarker(name);
        for(let i=0;i<contacts.length;i++) {
            if(contacts[i].label == namelabel) {
                return new StealthID(
                    namelabel,
                    PublicKey.fromStringOrThrow(contacts[i].publickey));}
        }
        throw new Error("Stealth contact not found");
    }


    /**
     *  A mis-named dispatcher function (preserving call from
     *  components/Transfer). *TEMP*
     */
    To_Stealth() {
        return this.Transfer();
    }

    /**
     *  Stealth Transfer dispatcher function.  Decides which TX function to
     *  call based on TX direction {Blind,Stealth}<-->{Public,Blind,Stealth}.
     */
    Transfer() {
        if (this.from.isblind) {
            if (this.to.isblind) {
                return this.Blind_to_Blind();
            } else {
                return this.Blind_to_Public();
            }            
        } else {
            if (this.to.isblind) {
                return this.Public_to_Blind();
            } else {
                throw new Error("Public to Public not handled here");
            }
        }
    }
    
    /**
    *  Construct transaction to transfer a PUBLIC balance to BLIND
    *  balance.
    *
    *  @return a blind_confirmation containing metadata about outputs and
    *  the signed transaction ready-to-broadcast.
    *
    *  Patterned after wallet_api::transfer_to_blind() in wallet.cpp
    *
    *  Note: the function in wallet.cpp assumes responsibility of
    *  transmitting. I prefer to separate that. In final form, this
    *  function will NOT transmit. The caller will receive a signed TX and
    *  assume responsibility for transmitting.
    *
    */
    Public_to_Blind() {
        /**/ console.log("PUB2BLIND: Public to Blind: from:", this.from.label,
                         "to: ", this.to.markedlabel);
        let bop = new transfer_to_blind_op;     // The "op" that we will build
        let blindconf = new blind_confirmation; // This will be return object
                                                // if no errors.
        let blinding_factors = [];
        let total_amount = 0;
        
        // Loop over recipients (right now only support one)
        let one_time_key = key.get_random_key();
        let to_key = this.to.pubkey;
        let secret = one_time_key.get_shared_secret(to_key);  // 512-bits
        let child = hash.sha256(secret);        // 256-bit pub/priv key offset
        let nonce = one_time_key.toBuffer();    // 256-bits, (d in Q=d*G)
        let blind_factor = hash.sha256(child);

        let amount = this.amount;
        let amountasset = {"amount":amount, "asset_id":this.asset.get("id")};
        total_amount += amount;
        blinding_factors = [blind_factor];      // push_back when loop

        let out = new blind_output;             // One output per recipient
        out.owner = {"weight_threshold":1,"account_auths":[],
                     "key_auths":[[to_key.child(child),1]],
                     "address_auths":[]};
        out.commitment = StealthZK.BlindCommit(blind_factor,amount);
        out.range_proof = new Uint8Array(0);    // (Not needed for 1 output)

        let meta = new blind_output_meta;       // Metadata for each output, to
        meta.label = this.to.label;             // be kept in blindconf for our
        meta.SetKeys(one_time_key, to_key);     // history/records.
        meta.SetMemoData(amountasset, blind_factor, out.commitment);
        meta.ComputeReceipt(secret);            // secret used as AES key/iv

        out.stealth_memo = meta.confirmation;  // Omit???  (Serializer barfs...)
        blindconf.output_meta = [meta];        // needs to be push_back()
        bop.outputs = [out];                   // needs to be push_back()

        /***/ console.log("Receipt:  ", meta.confirmation_receipt);
        // Loop over recipients would end here

        bop.from = this.from.id;
        bop.amount = total_amount;
        bop.blinding_factor = blind_factor;  // should be blind_sum but only one
        // TODO: bop.outputs needs to be sorted (if > 1)

        let tr = new TransactionBuilder();
        tr.add_type_operation("transfer_to_blind",{
            fee: {
                amount: 0,
                asset_id: "1.3.0"
            },
            amount: {
                amount: bop.amount,
                asset_id: this.asset.get("id")
            },
            from: bop.from,
            blinding_factor: bop.blinding_factor,
            outputs: bop.outputs
        });
        if (false) { // TESING SHUNT BLOCK
            // Trying to manually generate TX so I can manually broadcast...
            // The ones I manually generate tho always fail with "Missing
            // Active Authority"
            return Promise.all([tr.set_required_fees(),tr.finalize()]).then(()=>{
                /***/ console.log ("Try'n catch a TX by the tail yo.");
                /***/ console.log(tr.expiration);
                tr.expiration+=600;
                /***/ console.log(tr.expiration);
                tr.add_signer(PrivateKey        // Try manually adding signing keys
                   .fromWif("5H***"));
                tr.sign();//
                blindconf.trx = tr;
                /***/ console.log(JSON.stringify(tr.serialize()));
                return blindconf;})
        }//END SHUNT - Normal behavior follows...
        return WalletDb.process_transaction(tr,null,true)
            .then(()=>{blindconf.trx = tr; return blindconf;})
            .catch((err)=>{
                return new Error("To_Stealth: WalletDb.process_transaction error: ",
                                 JSON.stringify(err));
            });
    }

    /**
     *  Patterned after wallet_api::receive_blind_transfer() in wallet.cpp.
     *
     *  This maybe should be static but stealth account references need to be
     *  moved to StealthDB class first.
     */
    Receive_Blind_Transfer (receipt_txt) {

        let confirmation = new stealth_confirmation();
        confirmation.ReadBase58(receipt_txt);

        let whoto = this.findStealthAccountMatchingPubkey(confirmation.to);
        let secret = whoto.privkey.get_shared_secret(
            confirmation.one_time_key);         // 512-bits for aes key/iv
        let child = hash.sha256(secret);        // 256-bit pub/priv key offset
        let child_priv_key = whoto.privkey.child(child); // Sender can't know
        let memo = new stealth_cx_memo_data;
        memo.Decrypt(confirmation.encrypted_memo, secret);

        let result = {};        // TODO define object class
        result.to_key = whoto.pubkey;   // Might want to use toString here
        result.to_label = "dummytest";
        result.amount = memo.amount;
        result.control_authority = {"weight_threshold":1,"account_auths":[],
                                    "key_auths":[[child_priv_key.toPublicKey(),1]],
                                    "address_auths":[]};;
        result.auth_priv_key = child_priv_key;  // temp; should be pushed to DB
        result.data = memo;
        
        // TODO confirm amount matches commitment and other checks
        // TODO pushing into DB
        
        /***/ console.log("ReceiveBT result:", result);
        DEBUG && console.log('WSCAT: Test for commitment in blockchain with:\n'
                             + 'WSCAT: {"method": "call", "params":'
                             + '[0, "get_blinded_balances", [["'
                             + Buffer.from(result.data.commitment).toString('hex')
                             + '"]]], "id": 3}');
        return result;
        
    }

    Blind_to_Blind() {
        /**/console.log("BLIND2BLIND: (TEMP CODE) This will transfer the entire "
                        + "balance of the RECEIPT provided on memo line to a "
                        + "blind account. Input receipt is:" + this.messagetxt
                        + "At present, this ALPHA code only handles one blind "
                        + "input and one bind output.");
        let blindconf = new blind_confirmation; // This will be return object
                                                // if no errors.
        let blinding_factors = [];
        let total_amount = 0;
        let bop = new blind_transfer_op;        // The "op" that we will build
        
        let feeamount = 500100;            // TEMP need to get from chain
        let feeamountasset = {"amount":feeamount, "asset_id":this.asset.get("id")};
        bop.feeamountasset;
        
        let in_rcpt = this.Receive_Blind_Transfer(this.messagetxt);

        let input = new blind_input;
        input.commitment = in_rcpt.data.commitment;
        input.owner = in_rcpt.control_authority;
        bop.inputs = [input];
        
        // Loop over recipients (right now only support one)
        let one_time_key = key.get_random_key();
        let to_key = this.to.pubkey;
        let secret = one_time_key.get_shared_secret(to_key);  // 512-bits
        let child = hash.sha256(secret);        // 256-bit pub/priv key offset
        let nonce = one_time_key.toBuffer();    // 256-bits, (d in Q=d*G)
        let blind_factor = hash.sha256(child);

        let amount = in_rcpt.amount.amount - feeamount;
        let amountasset = {"amount":amount, "asset_id":this.asset.get("id")};
        // Trying to make ouput amount = input amount less fees...
        // ...but we keep failing fc::ecc::verify_sum.
        /***/ console.log("feeamt,amt,tots", feeamountasset,amountasset,
                         feeamountasset.amount + amountasset.amount);
        total_amount += amount;
        blinding_factors = [blind_factor];      // push_back when loop

        let out = new blind_output;             // One output per recipient
        out.owner = {"weight_threshold":1,"account_auths":[],
                     "key_auths":[[to_key.child(child),1]],
                     "address_auths":[]};
        out.commitment = StealthZK.BlindCommit(blind_factor,amount);
        out.range_proof = new Uint8Array(0);    // (Not needed for 1 output)

        let meta = new blind_output_meta;       // Metadata for each output, to
        meta.label = this.to.label;             // be kept in blindconf for our
        meta.SetKeys(one_time_key, to_key);     // history/records.
        meta.SetMemoData(amountasset, blind_factor, out.commitment);
        meta.ComputeReceipt(secret);            // secret used as AES key/iv

        out.stealth_memo = meta.confirmation;  // Omit???
        blindconf.output_meta = [meta];        // needs to be push_back()
        bop.outputs = [out];                   // needs to be push_back()

        /***/ console.log("Receipt:  ", meta.confirmation_receipt);
        // Loop over recipients would end here

        let tr = new TransactionBuilder();
        tr.add_type_operation("blind_transfer",{
            fee: bop.fee,
            inputs: bop.inputs,
            outputs: bop.outputs
        });
        tr.set_required_fees();
        tr.update_head_block();
        //tr.finalize().then(()=>{
            tr.add_signer(in_rcpt.auth_priv_key);
            //tr.sign();
            /***/ console.log("Built inital TX:", tr);
        //});
        return WalletDb.process_transaction(tr,null,true)
            .then(()=>{blindconf.trx = tr; return blindconf;})
            .catch((err)=>{
                return new Error("To_Stealth: WalletDb.process_transaction error: ",
                                 JSON.stringify(err));
            });
        
    }

    /**
     * From Blind to Public:
     */
    Blind_to_Public() {
        /**/console.log("(TEMP CODE) This will transfer the entire balance of",
                        "the RECEIPT provided on memo line to a public account.",
                        "Input receipt is:",this.messagetxt,
                        "At present, this ALPHA code only handles one blind",
                        "input and one public output.");
        let bop = new transfer_from_blind_op;
        
        let amount = this.amount;
        let amountasset = {"amount":amount, "asset_id":this.asset.get("id")};

        let in_rcpt = this.Receive_Blind_Transfer(this.messagetxt);

        bop.amount = in_rcpt.amount.amount - amount;  // VERY TEMP !!!
        bop.to = this.to.id;
        bop.blinding_factor = in_rcpt.data.blinding_factor;
        bop.inputs = [{"commitment":in_rcpt.data.commitment,
                       "owner":in_rcpt.control_authority}];
        
        /***/ console.log("thisamt,rcptamt,bopamt", amount, in_rcpt.amount,bop.amount);
        // STUFF....

        let tr = new TransactionBuilder();
        tr.add_type_operation("transfer_from_blind",{
            fee: {
                amount: 0,
                asset_id: "1.3.0"
            },
            amount: {
                amount: bop.amount,
                asset_id: this.asset.get("id")
            },
            to: bop.to,
            blinding_factor: bop.blinding_factor,
            inputs: bop.inputs
        });
        tr.add_signer(in_rcpt.auth_priv_key);
        /***/ console.log("Built inital TX:", tr);
        return WalletDb.process_transaction(tr,null,true/*true*/)
            .then(()=>{blindconf.trx = tr; return blindconf;})
            .catch((err)=>{
                return new Error("To_Stealth: WalletDb.process_transaction error: ",
                                 JSON.stringify(err));
            });
        
    }

}
export default Stealth_Transfer;
