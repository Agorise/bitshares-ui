import assert from "assert";
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
import StealthZK from "stealth/Transfer/stealthzk.js";
import * as Serializer from "agorise-bitsharesjs/es/serializer/src/operations.js";
import {Long} from "bytebuffer";

const DEBUG = true;


/**
 *  This class is a wrapper class around account/contact classes of
 *  heterogeneous type. It provides uniform access no matter if we are
 *  wrapping a REGULAR account, or a STEALTH ACCOUNT (for which we have a
 *  private key) or a CONTACT (for which we do NOT have a private key).
 *
 *  Provides two finder functions that search either in ChainStore (for
 *  regular accounts) or in Stealth_DB for account labels marked with an
 *  "@".  The two finder functions differentiate on whether we are looking
 *  for a CREDENTIALED account (one we can spend FROM) or ANY
 *  account/contact (one we can spend TO).
 */
class StealthID {

    /**
     * Don't call directly.  Use the finder functions.
     *
     * @arg label_or_account - if a string, assume stealth account or
     *          contact, and subsequent args will/may be set.  If not string,
     *          then assume a ChainStore Account object for a PUBLIC account.
     */
    constructor(label_or_account, pubkeyobj, privkeyobj=null) {
        if (typeof label_or_account === "string") {
            this.label = label_or_account;
            this.markedlabel = "@"+this.label;
            this.pubkey = (privkeyobj) ? privkeyobj.toPublicKey() : pubkeyobj;
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

    /**
     * Accepts a variety of input forms and uses them to set the BlindCoin
     * list of a StealthID.
     */
    setCoins(input) {
        this.coins = input; // TODO: check form of input and convert accordingly.
    }

    /**
     * Find a credentialed ACCOUNT (Regular or Stealth) that I can
     * spend FROM, and return as StealthID object. Label is presumed to
     * be "marked" if a stealth label.
     */
    static findCredentialed(label, stealth_DB) {
        if (StealthID.isStealthLabel(label)) {
            // Find Stealth ACCOUNT by name:
            // TODO Rely on functions already in Stealth_DB
            let accounts = stealth_DB.accounts;
            let namelabel = StealthID.stripStealthMarker(label);
            for(let i=0;i<accounts.length;i++) {
                if(accounts[i].label == namelabel) {
                    return new StealthID(
                        namelabel,
                        PublicKey.fromStringOrThrow(accounts[i].publickey),
                        PrivateKey.fromWif(accounts[i].privatekey));}
            }
            throw "Could not find name in stealth accounts";
        } else {
            // Find regular account from MY accounts:
            let accounts = AccountStore.getMyAccounts();
            for(let i=0;i<accounts.length;i++) {
                if(accounts[i] == label) {
                    return new StealthID(ChainStore.getAccount(accounts[i]));}
            }
            throw "Could not find name in regular accounts";
        }
    }

    /**
     * Find any account OR contact info (whether regular or Stealth)
     * that I can spend TO, and return as StealthID object. Label is
     * presumed to be "marked" if a stealth label.
     */
    static findAny(label, stealth_DB) {
        try {
            return StealthID.findCredentialed(label, stealth_DB);
        }
        catch(e) {
            if (StealthID.isStealthLabel(label)) {
                // Find Stealth CONTACT by name:
                // TODO Rely on functions already in Stealth_DB
                let contacts = stealth_DB.contacts;
                let namelabel = StealthID.stripStealthMarker(label);
                for(let i=0;i<contacts.length;i++) {
                    if(contacts[i].label == namelabel) {
                        return new StealthID(
                            namelabel,
                            PublicKey.fromStringOrThrow(contacts[i].publickey));}
                }
                throw new Error("Stealth contact not found");
            } else {
                // Find regular account from ANY accounts:
                return new StealthID(ChainStore.getAccount(label));
            }
        }
    }

}

/**
 *  Wraps up a stealth transfer in a convenient class.
 */
class Stealth_Transfer
{

    /**
     * @FromID and @ToID must be StealthID objects.
     */
    constructor(FromID,ToID,asset,amount,transaction_type)
    {
        this.from = FromID;     // StealthID objects
        this.to = ToID;         //   ''
        this.asset = asset;     // object, use .get("id"), eg, to get "1.3.0"
        this.amount = amount;   // in base units (ie 1.0 BTS = 100000)
        this.transaction_type = transaction_type;

        console.log("Initializing a Stealth Transfer of " + this.amount
                    + " from " + this.from.markedlabel
                    + " to " + this.to.markedlabel
                    + " with up to " + this.from.coins.length
                    + " possible Coin inputs" /*, this */);
        DEBUG && console.log("WSCAT: Suggested rpc tests follow.\n"
                             + "WSCAT: Connect with: "
                             + "wscat -c wss://node.testnet.bitshares.eu/");
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
        let blinding_factors = []; //(Defined but never used, why?)
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
                return blindconf;});
        }//END SHUNT - Normal behavior follows...
        return WalletDb.process_transaction(tr,null,true)
            .then(()=>{blindconf.trx = tr; return blindconf;})
            .catch((err)=>{
                return new Error("To_Stealth: WalletDb.process_transaction error: ",
                                 JSON.stringify(err));
            });
    }

    /**
     *  Blind to Blind transfer.
     *
     *  If @to_temp_acct==true, then "to" authority is anonymous, and
     *  we don't .process_transaction().  This is because a second
     *  operation still needs to be added to the TX to "claim" the
     *  temp balance to a public account.  See Blind_to_Public().
     *
     *  TEMP CODE: At present, we spend ENTIRE receipt to single
     *  output.  This will be fixed when we have range proofs.
     */
    Blind_to_Blind(to_temp_acct=false) {

        let bop = new blind_transfer_op;        // The "op" that we will build
        let blindconf = new blind_confirmation; // This will be return object
                                                // if no errors.

        let feebase = 100;      // Base fee      (TODO: Need to get from chain)
        let feeper = 500000;    // Per-input fee (TODO: Need to get from chain)

        let CoinsIn = BlindCoin.getCoinsSatisfyingAmount(
                        this.from.coins, (this.amount + feebase), feeper);
        /***/ console.log("Selected " + CoinsIn.length
                          + " Coins as input to Blind2Blind transaction.");
        assert(CoinsIn.length > 0, "Insufficient spendable coins");
        blindconf.consumed_commits.push(...CoinsIn.map(a=>a.commitmentHex()));

        let totalfee = feebase + feeper * CoinsIn.length;
        let feeamountasset
            = {"amount":totalfee, "asset_id":this.asset.get("id")};
        bop.fee = feeamountasset;
        let changeamount = BlindCoin.valueSum(CoinsIn) - this.amount - totalfee;

        /***/ console.log ("Change amount: " + changeamount);

        let Recipients = [this.to];
        Recipients[0].amountdue
            = {"amount":this.amount, "asset_id":this.asset.get("id")};
        if (changeamount > 0) {
            Recipients.push(this.from); // Change recipient is sender
            Recipients[1].amountdue = {"amount":changeamount,
                                       "asset_id":this.asset.get("id")};
        }

        let blind_factors_in = CoinsIn.map(a => a.blinding_factor);
        let blind_factors_out = [];
        let inputs = BlindCoin.getBlindInputsFromCoins(CoinsIn);
        bop.inputs = inputs;

        for (let i = 0; i < Recipients.length; i++) {   // For each Recipient:

            let needrangeproof = (Recipients.length > 1);
            let needblindsum = (i == Recipients.length-1);
            let Recipient = Recipients[i];

            let one_time_key = key.get_random_key();
            let to_key = Recipient.pubkey;
            let secret = one_time_key.get_shared_secret(to_key);  // 512-bits
            let child = hash.sha256(secret);        // 256-bit pub/priv key offset
            let nonce = one_time_key.toBuffer();    // 256-bits, (d in Q=d*G)
            let blind_factor = hash.sha256(child);  // (unless blindsum needed)

            if (needblindsum) {
                blind_factor = StealthZK.BlindSum(blind_factors_in,
                                                  blind_factors_out);
            } else {
                blind_factors_out.push(blind_factor);
            }

            let amount = Recipient.amountdue.amount;
            let amountasset = {"amount":amount, "asset_id":this.asset.get("id")};
            /***/ console.log("Output " + (1+i) + " of " + Recipients.length
                              + " to " + Recipient.markedlabel
                              + "; amount = " + amount);

            let out = new blind_output;             // One output per recipient
            out.owner = {"weight_threshold":to_temp_acct?0:1,
                         "account_auths":[],
                         "key_auths":to_temp_acct?[]:[[to_key.child(child),1]],
                         "address_auths":[]};
            out.commitment = StealthZK.BlindCommit(blind_factor,amount);
            out.range_proof = needrangeproof ?
                new Uint8Array(0) :             // TODO: needs to be range proof
                new Uint8Array(0);              // (Not needed for 1 output)

            let meta = new blind_output_meta;       // Metadata for each output, to
            meta.label = Recipient.label;           // be kept in blindconf for our
            meta.auth = out.owner;                  // history/records.
            meta.SetKeys(one_time_key, to_key);
            meta.SetMemoData(amountasset, blind_factor, out.commitment);
            meta.ComputeReceipt(secret);            // secret used as AES key/iv

            out.stealth_memo = meta.confirmation;   // Omit??? (Serializer spits)
            blindconf.output_meta.push(meta);
            bop.outputs.push(out);

            /***/ console.log("Receipt:  ", meta.confirmation_receipt);
        } // End loop over Recipients

        let tr = new TransactionBuilder();
        tr.add_type_operation("blind_transfer",{
            fee: bop.fee,
            inputs: bop.inputs,
            outputs: bop.outputs
        });
        tr.set_required_fees();         // Async.  Promise?
        tr.update_head_block();         // Async.  Promise?
        CoinsIn.forEach(coin => {tr.add_signer(coin.auth_privkey);});
        blindconf.trx=tr;
        /***/ console.log("Blindconf is currently:", blindconf);
        /***/ console.log("Built inital B2B TX:", tr);

        if (!to_temp_acct) {
            // Then process TX now
            return WalletDb.process_transaction(tr,null,true)
                .then(()=> {/*blindconf.trx = tr;*/ return blindconf;})
                .catch((err)=>{
                    return new Error("B2B WalletDb.process_transaction error: ",
                                 JSON.stringify(err));
                });
        } else {
            // Else pass to next stage
            blindconf.trx = tr;
            return blindconf;
        }
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
        // Get first-stage operation:
        let whoto = this.to; this.to = this.from; // Gonna send to self, sorta
        let stage1 = this.Blind_to_Blind(true);   // get tx with temp acct
        this.to = whoto;  // (Not sure if needed/wanted)
        /***/ console.log("B2PUB: Stage 1 was", stage1);

        let bop = new transfer_from_blind_op;

        let feeamount = 100;            // TEMP need to get from chain
        let feeamountasset = {"amount":feeamount, "asset_id":this.asset.get("id")};
        bop.fee = feeamountasset;

        let input_memo = stage1.output_meta[0].decrypted_memo;
        let input_auth = stage1.output_meta[0].auth;
              //^^ Need to search rather than assume position zero.

        let amount = input_memo.amount.amount - feeamount;
        let amountasset = {"amount":amount, "asset_id":this.asset.get("id")};
        bop.amount = amountasset;

        bop.to = this.to.id;
        bop.blinding_factor = input_memo.blinding_factor;
        bop.inputs = [{"commitment":input_memo.commitment,
                       "owner":input_auth}];

        /**/ console.log("BOP", bop);

        let tr = stage1.trx;
        tr.add_type_operation("transfer_from_blind",{
            fee: bop.fee,
            amount: bop.amount,
            to: bop.to,
            blinding_factor: bop.blinding_factor,
            inputs: bop.inputs
        });
        /***/ console.log("Built inital B2P TX:", tr);
        return WalletDb.process_transaction(tr,null,true/*true*/)
            .then(()=>{blindconf.trx = tr; return blindconf;})
            .catch((err)=>{
                return new Error("To_Stealth: WalletDb.process_transaction error: ",
                                 JSON.stringify(err));
            });

    }

}


/**
 * A "blind coin" is the information needed to spend a particular blind
 * commitment deposited in the blockchain.
 *
 * RETREIVE and STORE from RECIPT:
 *
 * let pkeyfind = (addr)=>{return "5xxxxx";} // (must return WIF from addr)
 * let bc = BlindCoin.fromReceipt(rcpt_txt, pkeyfind);
 * DB.Stash(bc.toDBObject(),bc.ask_address());
 *
 * The ask_address() method returns the address that was used to request
 * blind funds.  This can be used to associate the coin with the blind
 * account containing the address when storing in the database.  The address
 * itself does not need to be explicitly stored.
 *
 * The toDBObject() method returns a "lightweight" representation of the
 * BlindCoin object for storage/retreival.  There is a corresponding static
 * fromDBOject() to generate a BlindCoin object after DB retreival.
 */
class BlindCoin {

    /**
     * Generally shouldn't be called directly.  New coin objects should
     * either be generated with fromReceipt() or fromDBObject() (which in
     * turn call this).
     */
    constructor(auth_privkey,           // PrivetKey object or WIF; Spend key
                value,                  // Long; Amount in atomic units
                asset_id,               // ID of asset as "1.3.x" or integer x
                blinding_factor,        // Assuming Buffer 32 bytes 
                commitment,             // Assuming Buffer 33 bytes
                spent,                  // true/false
                asking_pubkey = null    // (Optional)
               ) {
        this.auth_privkey = (typeof auth_privkey === "string")
            ? PrivateKey.fromWif(auth_privkey)
            : auth_privkey;
        this.value = (typeof value === "string")
            ? Long.fromString(value)
            : value;
        this.asset_id = (typeof asset_id === "string")
            ? asset_id
            : "1.3."+asset_id;
        this.blinding_factor = blinding_factor;
        this.commitment = commitment;
        this.spent = spent;
        this.asking_pubkey = (typeof asking_pubkey === "string")
            ? PublicKey.fromStringOrThrow(asking_pubkey)
            : asking_pubkey;
    }

    /**
     * Returns the "asking address" which was used to request the funds
     * contained by the coin.  String value, eg, "BTSxxxx..."
     */
    ask_address() {return this.asking_pubkey.toString();}
    valueString() {return this.value.toString();}
    commitmentHex() {return this.commitment.toString("hex");}
    blindingFactorHex() {return this.blinding_factor.toString("hex");}

    /**
     * Gets a "blind coin" from a base58-encoded receipt if a private key
     * needed to decode the receipt can be found.  See also fromReceipts()
     * for a version that returns an array from a comma-separated list of
     * receipts.
     *
     * @arg rcpt_txt      - Receipt as base58 text
     * @arg DB - Stealth DB
     *
     * returns: false || new BlindCoin(...)
     *
     * returns false if wallet contains no private key that can decode the
     *         receipt, or else a BlindCoin object if receipt is
     *         successfully decoded.
     *
     * NOTE: This does NOT check whether the commitment is in fact present
     * and unspent in the blockchain, but only returns the info from the
     * receipt.  Checking for spendability should only be done when updating
     * balance displayed to the user and before contructing a blind spend
     * operation in order to avoid unnecessarily revealing our "interest" in
     * the particular commitment to the p2p network.
     */
    static fromReceipt(receipt_txt, DB) {

        let confirmation = new stealth_confirmation();
        confirmation.ReadBase58(receipt_txt);

        let askingwif = DB.PrivKeyFinder(confirmation.to.toString());
        let whoto = new StealthID("unknown@",null,PrivateKey.fromWif(askingwif));
        let secret = whoto.privkey.get_shared_secret(
            confirmation.one_time_key);   // 512-bits for aes key/iv
        let child = hash.sha256(secret);  // 256-bit pub/priv key offset
        let child_priv_key = whoto.privkey.child(child); // Sender can't know

        let memo = new stealth_cx_memo_data;
        memo.Decrypt(confirmation.encrypted_memo, secret);

        // TODO confirm amount matches commitment and other checks
        let result = new BlindCoin(child_priv_key,
                                   memo.amount.amount,
                                   memo.amount.asset_id,
                                   memo.blinding_factor,
                                   memo.commitment,
                                   false,
                                   whoto.pubkey
                                  );

        /***/ console.log("Blind Coin read from Receipt: "
                          + result.valueString()
                          + " at: " + result.commitmentHex());
        DEBUG && console.log("WSCAT: Test for commitment in blockchain with:\n"
                             + 'WSCAT: {"method": "call", "params":'
                             + '[0, "get_blinded_balances", [["'
                             + Buffer.from(result.commitment).toString("hex")
                             + '"]]], "id": 3}');
        return result;

    }

    /**
     * This one returns an ARRAY of BlindCoins from a comma and/or
     * whitespace separated list of receipts.
     */
    static fromReceipts(rcpts, DB) {
        if (typeof rcpts === "string") {  // Assume CSV base58 receipts

            let nonempty = function(entry){return entry.length>0};
            let rcpt_arr = rcpts.split(/\s*,\s*/).filter(nonempty);
            let bc_arr = [];
            for (let i = 0; i < rcpt_arr.length; i++) {
                bc_arr.push(BlindCoin.fromReceipt(rcpt_arr[i],DB));
            }

            return bc_arr;

        } else {

            throw new Error("Could not interpret receipts list input");

        }
    }


    /**
     * Determines a minimum subset of @coins totaling @amount considering a
     * cost of @feeper per each coin used. Returns the subset or [] if total
     * cannot be met.
     *
     * By default does NOT check the 'spent' member of the coin (assumes
     * list has already been properly filtered/verified) but can set
     * flags.onlyunspent to filter coins if desired (this does not check the
     * blockchain, only the coins[i].spent).
     *
     * TODO: This is not asset-aware. Does not check that coins have
     * compatible asset-ID, and assumes amounts are in core asset.  Will
     * break if used for other assets. TODO
     */
    static getCoinsSatisfyingAmount(coins, amount, feeper,
                                    flags = {onlyunspent:false,
                                             spenddust:false}) {

        let tally = Long.fromInt(0);
        let fee = 0;
        let included = [];

        // TODO (maybe) sort coins so that biggest checked first, this will
        // make "minimum" subset. (Otherwise, it's just a subset.)

        for (let i = 0; i < coins.length; i++) {
            let canspend = !(coins.onlyunspent && coins[i].spent);
            let shouldspend = (coins[i].value > feeper) || flags.spenddust;
            if (canspend && shouldspend) {
                tally = tally.add(coins[i].value);
                fee += feeper;
                included.push(coins[i]);
            }
            if (tally >= amount + fee) break;

        }
        return (tally >= amount + fee) ? included : [];

    }

    /**
     * Convert a list of BlindCoins into "inputs" for a blind operation.
     */
    static getBlindInputsFromCoins(coins) {
        let inputs = [];
        for (let i = 0; i < coins.length; i++) {
            let input = new blind_input;
            input.commitment = coins[i].commitment;
            input.owner = {"weight_threshold":1,"account_auths":[],
                           "key_auths":[[coins[i].auth_privkey.toPublicKey(),1]],
                           "address_auths":[]};
            inputs.push(input);
        }
        return inputs;
    }

    /**
     * Gives the summed value of an array of BlindCoin objects.
     * NOTE: Returns a Long.
     */
    static valueSum(coins) {
        let sum = Long.fromInt(0);
        for (let i = 0; i < coins.length; i++) {
            sum = sum.add(coins[i].value);
        }
        return sum;
    }

    /**
     * Returns a clean, flat form suitable for storage/retreival in a
     * databse of some sort.  Flattens most fields to strings.  Includes a
     * version field in case of changes.
     */
    toDBObject() {
        return {
            ver: "bc01",
            auth_privkey:     this.auth_privkey.toWif(),
            value:            this.valueString(),
            asset_id:         this.asset_id,
            blinding_factor:  this.blindingFactorHex(),
            commitment:       this.commitmentHex(),
            spent:            this.spent
        };
    }

    /**
     * Returns a new BlindCoin object interpreted from the lightweight form
     * used for storage/retreival.
     */
    static fromDBObject(DBObj) {
        /***/ console.log("WhatisDBObj", DBObj);
        return new BlindCoin(DBObj.auth_privkey,
                             DBObj.value,
                             DBObj.asset_id,
                             Buffer.from(DBObj.blinding_factor, "hex"),
                             Buffer.from(DBObj.commitment, "hex"),
                             DBObj.spent
                            );
    }

}
export {Stealth_Transfer, BlindCoin, StealthID};
