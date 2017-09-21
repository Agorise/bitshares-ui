import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletDb from "stores/WalletDb";
import {Aes, TransactionBuilder, TransactionHelper, FetchChain} from "agorise-bitsharesjs/es";
class StealthOps 
{
//TO STEALTH
    to_stealth({ // OBJECT: { ... }
        from_account,
        to_account,
        amount,
        asset,
        memo,
        broadcast = true,
        encrypt_memo = true,
        optional_nonce = null,
        propose_account = null,
        fee_asset_id = "1.3.0"
    }) {
        let memo_sender = propose_account || from_account;

        let unlock_promise = WalletUnlockActions.unlock();

        return Promise.all([
            FetchChain("getAccount", from_account),
            FetchChain("getAccount", to_account),
            FetchChain("getAccount", memo_sender),
            FetchChain("getAccount", propose_account),
            FetchChain("getAsset", asset),
            FetchChain("getAsset", fee_asset_id),
            unlock_promise
        ]).then((res)=> {

            let [
                chain_from, chain_to, chain_memo_sender, chain_propose_account,
                chain_asset, chain_fee_asset
            ] = res;

            let memo_from_public, memo_to_public;
            if( memo && encrypt_memo  ) 
            {

                memo_from_public = chain_memo_sender.getIn(["options","memo_key"]);

                // The 1s are base58 for all zeros (null)
                if( /111111111111111111111/.test(memo_from_public)) 
                {
                    memo_from_public = null;
                }

                memo_to_public = chain_to.getIn(["options","memo_key"]);
                if( /111111111111111111111/.test(memo_to_public)) 
                {
                    memo_to_public = null;
                }
            }

            let propose_acount_id = propose_account ? chain_propose_account.get("id") : null;

            let memo_from_privkey;
            if(encrypt_memo && memo ) {
                memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);

                if(! memo_from_privkey) {
                    throw new Error("Missing private memo key for sender: " + memo_sender);
                }
            }

            let memo_object;
            if(memo && memo_to_public && memo_from_public) {
                let nonce = optional_nonce == null ?
                            TransactionHelper.unique_nonce_uint64() :
                            optional_nonce;

                memo_object = {
                    from: memo_from_public,
                    to: memo_to_public,
                    nonce,
                    message: (encrypt_memo) ?
                        Aes.encrypt_with_checksum(
                            memo_from_privkey,
                            memo_to_public,
                            nonce,
                            memo
                        ) :
                        Buffer.isBuffer(memo) ? memo.toString("utf-8") : memo
                };
            }
            // Allow user to choose asset with which to pay fees #356
            let fee_asset = chain_fee_asset.toJS();

            // Default to CORE in case of faulty core_exchange_rate
            if( fee_asset.options.core_exchange_rate.base.asset_id === "1.3.0" &&
                fee_asset.options.core_exchange_rate.quote.asset_id === "1.3.0" ) {
                fee_asset_id = "1.3.0";
            }

            let tr = new TransactionBuilder();
            let transfer_op = tr.get_type_operation("transfer", {
                fee: {
                    amount: 0,
                    asset_id: fee_asset_id
                },
                from: chain_from.get("id"),
                to: chain_to.get("id"),
                amount: { amount, asset_id: chain_asset.get("id") },
                memo: memo_object
            });

            return tr.update_head_block().then(() => {
                if( propose_account ) {
                    tr.add_type_operation("proposal_create", {
                        proposed_ops: [{ op: transfer_op }],
                        fee_paying_account: propose_acount_id
                    });
                } else {
                    tr.add_operation( transfer_op );
                }

                return WalletDb.process_transaction(
                    tr,
                    null, //signer_private_keys,
                    broadcast
                );
            });
        });
    }
    
}

export default StealthOps;