import React from "react";
import { connect } from "alt-react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import PasswordInput from "./../Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import {Link} from "react-router/es";
import AccountSelect from "../Forms/AccountSelect";
import WalletUnlockActions from "actions/WalletUnlockActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "../LoadingIndicator";
import WalletActions from "actions/WalletActions";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "bitsharesjs/es";
import {BackupCreate} from "../Wallet/Backup";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import {key} from "bitsharesjs/es";
import StealthCheckBox from "components/Forms/StealthCheckBox";
import Stealth_Account from "stealth/account";
import Stealth_Contact from "stealth/contact";
import STransfer from "stealth/transfer";

class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {
            add_stealth_contact: false,
            StealthChecked: false,
            createdstealth: false,
            validAccountName: false,
            accountName: "",
            validPassword: false,
            registrar_account: null,
            loading: false,
            hide_refcode: true,
            show_identicon: false,
            step: 1
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.accountNameInput = null;
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }
    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    isValid() {
        let firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) {
            valid = valid && this.state.validPassword;
        }
        if (!firstAccount) {
            valid = valid && this.state.registrar_account;
        }
        return valid;
    }

    onAccountNameChange(e) 
    {
        const state = {};
        if(e.valid !== undefined) state.validAccountName = e.valid;
        if(e.value !== undefined) state.accountName = e.value;
        if (!this.state.show_identicon) state.show_identicon = true;
        if(e.value !== undefined && e.value !== null)
        {
            this.setState(state);
            this.stealthcheck(e);
        }
        //let STX = new STransfer();
        //STX.To_Stealth();
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
    }

    onFinishConfirm(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName).then(() => {
                console.log("onFinishConfirm");
                this.props.router.push("/wallet/backup/create?newAccount=true");
            });
        }
    }

    createAccount(name) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        WalletUnlockActions.unlock().then(() => {
            this.setState({loading: true});
            AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account, 0, refcode).then(() => {
                // User registering his own account
                if(this.state.registrar_account) {
                    this.setState({loading: false});
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else { // Account registered by the faucet
                    // this.props.router.push(`/wallet/backup/create?newAccount=true`);
                    FetchChain("getAccount", name).then(() => {
                        this.setState({
                            step: 2
                        });
                    });
                    // this.props.router.push(`/account/${name}/overview`);

                }
            }).catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let error_msg = error.base && error.base.length && error.base.length > 0 ? error.base[0] : "unknown error";
                if (error.remote_ip) error_msg = error.remote_ip[0];
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${error_msg}`,
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({loading: false});
            });
        });
    }

    createWallet(password) {
        return WalletActions.setWallet(
            "default", //wallet name
            password
        ).then(()=> {
            console.log("Congratulations, your wallet was successfully created.");
        }).catch(err => {
            console.log("CreateWallet failed:", err);
            notify.addNotification({
                message: `Failed to create wallet: ${err}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }
    /*
    //Stealth STUFF STARTS HERE (BESIDES onSubmit)
    */
    //Moving it from here once stabilized
    removeat(e)
    {
        var xat = String(e.value);
        var wat;
        if(xat[0] == "@")
        {
            for(var i=0; i<xat.length+1; i++)
            {
                if(i==0)
                {
                    wat=xat[i+1];
                    continue;
                }
                if(xat[i+1]!==undefined)
                {
                    wat =wat + xat[i+1];
                }
            }
            this.setState({accountName: wat});
        }
    }
    Create_Stealth_Account(label)
    {
        if(!this.state.createdstealth)
        {
            this.setState({createdstealth: true});
            let ACC = new Stealth_Account();
            let associated_account = this.refs.selected_account.state.selected;
            ACC.new_account(label, associated_account);
            WalletDb.create_new_stealth_account(ACC);
        }
    }
    stealthcheck(e)
    {
        if(e.value !== undefined)
        {
            if(e.value[0]=="@"||this.accountNameInput.getVisualValue()[0] =="@")
            {
                //this.removeat(e);
                this.setState({add_stealth_contact: true});
                this.refs.stealthcheckinput.setState({checked: false});
                this.refs.stealthcheckinput.uncheckit();
                this.setState({StealthChecked: false});
            }
            else
            {
                this.setState({add_stealth_contact: false});
            }
        }
    }
    OnStealthCheckChange(){
        this.setState({StealthChecked: !this.refs.stealthcheckinput.getvalue()});
        if(this.state.StealthChecked !== true)
        {
            var currentname = this.accountNameInput.getVisualValue();
            var nosthname;
            if(currentname[0]=="@")
            {
                for(var i=0;i<currentname.length;i++)
                {
                    if(nosthname === undefined)
                    {
                        nosthname = currentname[i+1];
                        continue;
                    }
                    if(i==1)
                    {
                        continue;
                    }
                    nosthname =nosthname+currentname[i];
                }
                this.accountNameInput.setValue(nosthname);
                if(nosthname != null)
                {
                    this.accountNameInput.setVisual(nosthname);
                }
                else
                {
                    this.accountNameInput.setVisual("");
                }
                this.accountNameInput.setState({account_name: nosthname});
                this.setState({accountName: this.accountNameInput.getVisualValue()});
                this.setState({add_stealth_contact: false});
                
            // console.log("NonStealth now: "+nosthname);
            }
        }
        /*Being kept here in case of removal of contacts adding through this screen.
        else if(currentname[0]!="@" && this.state.stealthCheck == false)
        {
            nosthname = "@";
            nosthname=nosthname+currentname;
            console.log(nosthname);
            this.accountNameInput.setVisual(nosthname);
        }
        */

        /*To be moved to transfer screen
        WalletDb.get_my_stealth_accounts().then(function(result)
        {
            if(result != false)
            {
                //Todo
            }
            else
            {
                throw new Error("get_my_stealth_accounts Failed");
            }
        });
        */
    }
    //STEALTH STUFF ENDS HERE
    onSubmit(e) 
    {
        e.preventDefault();
        if (!this.isValid()) return;
        let account_name = this.accountNameInput.getValue();
        if(this.state.StealthChecked === true && this.state.add_stealth_contact === false)
        {
            this.Create_Stealth_Account(this.state.accountName);
            //this.props.router.push("/dashboard");
        }
        else if(this.state.StealthChecked === false && this.state.add_stealth_contact === true)
        {
            let accname = this.state.accountName;
            let key = this.accountNameInput.getPubkey();
            let contact = new Stealth_Contact();
            contact.new_contact(accname, key);
            WalletDb.add_stealth_contact(contact);
            //this.props.router.push("/dashboard");
        }
        else
        {
            if(this.state.StealthChecked === false && this.state.add_stealth_contact === false)
            {
                if (WalletDb.getWallet()) {
                    this.createAccount(account_name);
                } 
                else 
                {
                    let password = this.refs.password.value();
                    this.createWallet(password).then(() => this.createAccount(account_name));
                }
            }
            else
            {
                console.log("Error, something went wrong in Stealth label adding or in Stealth account creation");
            }
        }
    }

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    // showRefcodeInput(e) {
    //     e.preventDefault();
    //     this.setState({hide_refcode: false});
    // }

    _renderAccountCreateForm() {

        let {registrar_account} = this.state;

        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;
        let hasWallet = WalletDb.getWallet();
        let valid = this.isValid();
        let isLTM = false;
        let registrar = registrar_account ? ChainStore.getAccount(registrar_account) : null;
        if (registrar) {
            if( registrar.get( "lifetime_referrer" ) == registrar.get( "id" ) ) {
                isLTM = true;
            }
        }

        let buttonClass = classNames("button no-margin", {disabled: (!valid || (registrar_account && !isLTM))});

        return (
            <form
                style={{maxWidth: "40rem"}}
                onSubmit={this.onSubmit.bind(this)}
                noValidate
            >
                <AccountNameInput
                    ref={(ref) => {if (ref) {this.accountNameInput = ref.refs.nameInput;}}}
                    cheapNameOnly={firstAccount}
                    onChange={this.onAccountNameChange.bind(this)}
                    accountShouldNotExist={true}
                    placeholder="Account Name (Public)"
                    noLabel
                />
                {/*Only display stealth checkbox in case this is not the first account*/
                    firstAccount ? null :
                    (
                        <div style={{marginBottom: "10px", marginTop: "10px"}}>
                        <label>Create stealth account?</label>
                        <StealthCheckBox
                        id="stealthcheckbox"
                        ref="stealthcheckinput"
                        onChange={this.OnStealthCheckChange.bind(this)}
                        />
                        </div>
                    )
                }
                {/* Only ask for password if a wallet already exists */}
                {hasWallet ?
                    null :

                        <PasswordInput
                            ref="password"
                            confirmation={true}
                            onChange={this.onPasswordChange.bind(this)}
                            noLabel
                        />
                }

                {/* If this is not the first account, show dropdown for fee payment account */}
                {
                firstAccount ? null : (
                    <div className="full-width-content form-group no-overflow">
                        <label id="AS-LABEL"><Translate content="account.pay_from" /></label>
                        <AccountSelect
                            account_names={my_accounts}
                            onChange={this.onRegistrarAccountChange.bind(this)}
                            ref="selected_account"
                        />
                        {(registrar_account && !isLTM) ? <div style={{textAlign: "left"}} className="facolor-error"><Translate content="wallet.must_be_ltm" /></div> : null}
                    </div>)
                }

                {/* Submit button */}
                {this.state.loading ?  <LoadingIndicator type="three-bounce"/> : <button className={buttonClass}><Translate content="account.create_account" /></button>}

                {/* Backup restore option */}
                <div style={{paddingTop: 40}}>
                    <label style={{textTransform: "none"}}>
                        <Link to="/existing-account">
                            <Translate content="wallet.restore" />
                        </Link>
                    </label>

                    <label style={{textTransform: "none"}}>
                        <Link to="/create-wallet-brainkey">
                            <Translate content="settings.backup_brainkey" />
                        </Link>
                    </label>
                </div>

                {/* Skip to step 3 */}
                {(!hasWallet || firstAccount ) ? null :<div style={{paddingTop: 20}}>
                    <label style={{textTransform: "none"}}>
                        <a onClick={() => {this.setState({step: 3});}}><Translate content="wallet.go_get_started" /></a>
                    </label>
                </div>}
            </form>
        );
    }

    _renderAccountCreateText() {
        let hasWallet = WalletDb.getWallet();
        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;

        return (
            <div>
                <p style={{fontWeight: "bold"}}><Translate content="wallet.wallet_browser" /></p>

                <p>{!hasWallet ? <Translate content="wallet.has_wallet" /> : null}</p>

                <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text_stealth_accountasreq" />
                <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text" />
                {hasWallet ? <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text_stealth_priv" /> : null}
                {hasWallet ? <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text_stealth_extrainfo" /> : null}
                {hasWallet ? <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text_stealth_pub" /> : null}

                {firstAccount ? <Translate style={{textAlign: "left"}} component="p" content="wallet.first_account_paid" /> : null}

                {/* {this.state.hide_refcode ? null :
                    <div>
                        <RefcodeInput ref="refcode" label="refcode.refcode_optional" expandable={true}/>
                        <br/>
                    </div>
                } */}
            </div>
        );
    }

    _renderBackup() {
        return (
            <div>
                <BackupCreate noText downloadCb={this._onBackupDownload}/>
            </div>
        );
    }

    _onBackupDownload = () => {
        this.setState({
            step: 3
        });
    }

    _renderBackupText() {
        return (
            <div>
                <p style={{fontWeight: "bold"}}><Translate content="footer.backup" /></p>
                <p><Translate content="wallet.wallet_crucial" /></p>
                <p><Translate content="wallet.wallet_move" /></p>
                <p><Translate content="wallet.wallet_lose_warning" /></p>
            </div>
        );
    }

    _renderGetStarted() {

        return (
            <div>
                <table className="table">
                    <tbody>

                        <tr>
                            <td><Translate content="wallet.tips_dashboard" />:</td>
                            <td><Link to="dashboard"><Translate content="header.dashboard" /></Link></td>
                        </tr>

                        <tr>
                            <td><Translate content="wallet.tips_account" />:</td>
                            <td><Link to={`/account/${this.state.accountName}/overview`} ><Translate content="wallet.link_account" /></Link></td>
                        </tr>

                        <tr>
                            <td><Translate content="wallet.tips_deposit" />:</td>
                            <td><Link to="deposit-withdraw"><Translate content="wallet.link_deposit" /></Link></td>
                        </tr>



                        <tr>
                            <td><Translate content="wallet.tips_transfer" />:</td>
                            <td><Link to="transfer"><Translate content="wallet.link_transfer" /></Link></td>
                        </tr>

                        <tr>
                            <td><Translate content="wallet.tips_settings" />:</td>
                            <td><Link to="settings"><Translate content="header.settings" /></Link></td>
                        </tr>
                    </tbody>

                </table>
            </div>
        );
    }

    _renderGetStartedText() {

        return (
            <div>
                <p style={{fontWeight: "bold"}}><Translate content="wallet.congrat" /></p>

                <p><Translate content="wallet.tips_explore" /></p>

                <p><Translate content="wallet.tips_header" /></p>

                <p style={{fontWeight: "bold"}}><Translate content="wallet.tips_login" /></p>
            </div>
        );
    }

    render() {
        let {step} = this.state;

        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;

        return (
            <div className="grid-block vertical page-layout">
                <div className="grid-container shrink">
                    <div style={{textAlign: "center", paddingTop: 20}}>
                        <Translate content="wallet.wallet_new" component="h2" />

                        <h4 style={{paddingTop: 20}}>
                            {step === 1 ?
                                <span>{firstAccount ? <Translate content="wallet.create_w_a" />  : <Translate content="wallet.create_a" />}</span> :
                            step === 2 ? <Translate content="wallet.create_success" /> :
                            <Translate content="wallet.all_set" />
                        }
                        </h4>
                    </div>
                </div>
                <div className="grid-block main-content wrap" style={{marginTop: "2rem"}}>
                    <div className="grid-content small-12 medium-6" style={{paddingLeft: "15%"}}>
                        <p style={{fontWeight: "bold"}}>
                            <Translate content={"wallet.step_" + step} />
                        </p>

                        {step === 1 ? this._renderAccountCreateForm() : step === 2 ? this._renderBackup() :
                            this._renderGetStarted()
                        }
                    </div>

                    <div className="grid-content small-12 medium-6" style={{paddingRight: "15%"}}>
                        {step === 1 ? this._renderAccountCreateText() : step === 2 ? this._renderBackupText() :
                            this._renderGetStartedText()
                        }

                    </div>
                </div>
            </div>
        );
    }
}

export default connect(CreateAccount, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {};
    }
});
