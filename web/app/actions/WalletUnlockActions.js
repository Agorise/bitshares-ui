import alt from "alt-instance";
import Stealth_DB from "stealth/DB/db";
class WalletUnlockActions {

    /** If you get resolved then the wallet is or was just unlocked.  If you get
        rejected then the wallet is still locked.

        @return nothing .. Just test for resolve() or reject()
    */
    unlock() {
        return (dispatch) => {
            return new Promise( (resolve, reject) => {
                dispatch({resolve, reject});
            }).then( was_unlocked => {
                if(was_unlocked) WrappedWalletUnlockActions.change();
            });
        };

    }

    lock() {
        return (dispatch) => {
            return new Promise( resolve => {
                dispatch({resolve});
            }).then( was_unlocked => {
                if(was_unlocked)
                {
                    WrappedWalletUnlockActions.change();
                }
                else
                {
                    let SDB = new Stealth_DB();
                    SDB.Initialize().then(()=>{
                        SDB.Lock();
                    });
                }
            });
        };
    }

    cancel() {
        return true;
    }

    change() {
        return true;
    }

    checkLock() {
        return true;
    }

}

var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions);
export default WrappedWalletUnlockActions;
