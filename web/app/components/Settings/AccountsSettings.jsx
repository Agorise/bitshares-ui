import React from "react";
import {Link} from "react-router/es";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import { connect } from "alt-react";
import utils from "common/utils";
import Translate from "react-translate-component";
import Stealth_DB from "stealth/DB/db";
import stealth_keys from "stealth/Visual_Components/stealth_keys";
class AccountsSettings extends React.Component {
    constructor()
    {
        super();
        this.state = {
            SDB: new Stealth_DB,
            Loaded: false
        };
        this.state.SDB.Initialize().then(()=>{this.state.SDB.initialized = true;});
    }
    shouldComponentUpdate(nextProps) {
        if(!this.state.Loaded)
        {
            this.state.Loaded=true;
            return true;
        }
        return (
            !utils.are_equal_shallow(nextProps.myAccounts, this.props.myAccounts) ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts
        );
    }

    onLinkAccount(account, e) {
        e.preventDefault();
        AccountActions.linkAccount(account);
    }

    onUnlinkAccount(account, e) {
        e.preventDefault();
        AccountActions.unlinkAccount(account);
    }
    Stealth_Accounts()
    {
        if(this.state.SDB.initialized)
        {
            if(this.state.SDB.Get_Account_List().length > 0)
            {
                return (
                <div>
                    <h3>Stealth Accounts</h3>
                    <span className="bottom-border">Your Stealth account list.</span>
                    <table className="table">
                    <tbody>
                    {this.state.SDB.Get_Account_List().map(account=>{
                        return(
                            <tr key={account}>
                            <td>{account}</td>
                            <td><a onClick={stealth_keys.bind(this,account)}>View Keys</a></td>
                            </tr>
                        );
                    })}
                    </tbody>
                    </table>
                </div>);
            }
        }
    }
    render() {
        let {myAccounts, ignoredAccounts} = this.props;

        let accounts = ignoredAccounts.toArray().concat(myAccounts).sort();
        let Stealth_Accounts = this.Stealth_Accounts();
        if (!accounts.length) {
            return <div><Translate content="settings.no_accounts" /></div>;
        }

        return (
            <div>
            <table className="table">
                <tbody>
                    {accounts.map(account => {
                        let isIgnored = ignoredAccounts.has(account);
                        let hideLink = (<a
                            href
                            onClick={isIgnored ?
                                this.onLinkAccount.bind(this, account) :
                                this.onUnlinkAccount.bind(this, account)
                            }
                            >
                                <Translate content={"account." + (isIgnored ? "unignore" : "ignore")} />
                            </a>
                        );

                        return (
                            <tr key={account}>
                                <td>{account}</td>
                                <td><Link to={`/account/${account}/permissions`}><Translate content="settings.view_keys" /></Link></td>
                                <td>{hideLink}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {Stealth_Accounts}
            </div>
        );
    }
}

AccountsSettings = connect(AccountsSettings, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            myAccounts: AccountStore.getMyAccounts(),
            ignoredAccounts: AccountStore.getState().myIgnoredAccounts
        };
    }
});

export default AccountsSettings;
