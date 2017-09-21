import React from "react";
import utils from "common/utils";
import AccountImage from "../Account/AccountImage";
import Translate from "react-translate-component";
import {ChainStore, PublicKey, ChainValidation} from "agorise-bitsharesjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import accountUtils from "common/account_utils";
import FloatingDropdown from "../Utility/FloatingDropdown";
import confidential_logo from "stealth/Visual_Components/images/confidential.png";
import Stealth_DB from "stealth/DB/db";
import Stealth_Contact from "stealth/DB/contact";

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 */

class AccountSelector extends React.Component {

    static propTypes = {
        label: React.PropTypes.string.isRequired, // a translation key for the label
        error: React.PropTypes.element, // the error message override
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: React.PropTypes.func, // a method to be called any time user input changes
        onAccountChanged: React.PropTypes.func, // a method to be called when existing account is selected
        onAction: React.PropTypes.func, // a method called when Add button is clicked
        accountName: React.PropTypes.string, // the current value of the account selector, the string the user enters
        account: ChainTypes.ChainAccount, // account object retrieved via BindToChainState decorator (not input)
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: React.PropTypes.bool, // use it if you need to disable action button,
        allowUppercase: React.PropTypes.bool // use it if you need to allow uppercase letters
    };

    static defaultProps = {
        autosubscribe: false
    };

    // can be used in parent component: this.refs.account_selector.getAccount()
    getAccount() {
        return this.props.account;
    }

    getError() {

        let scamMessage = accountUtils.isKnownScammer(this.props.accountName);

        let error = this.props.error;
        if (!error && this.props.accountName && !this.getNameType(this.props.accountName))
            error = counterpart.translate("account.errors.invalid");
        if(this.props.accountName[0] === "@")
        {
            if(this.props.contacts)
            {
                let found = false;
                this.props.contacts.filter(contact => {
                    let result = "";
                    for(var i=1;i<this.props.accountName.length;i++)
                    {
                        result+=this.props.accountName[i];
                    }
                    if(contact.label == result)
                    {
                        return result;
                    }
                }).map(contact => {
                    if(contact)
                    {
                        found = true;
                    }
                });
                if(!found)
                {
                    error = "CONTACT_ERROR!";
                }
            }
        }
        return scamMessage || error;
    }

    getNameType(value) {
        if(!value) return null;
        if(value[0] === "#" && utils.is_object_id("1.2." + value.substring(1))) return "id";
        if(ChainValidation.is_account_name(value, true)) return "name";
        if(this.props.allowPubKey && PublicKey.fromPublicKeyString(value)) return "pubkey";
        if(value[0] === "@")
        {
            return "stealth/blind";
        }
        return null;
    }

    onInputChanged(event) 
    {
        let value = event.target.value.trim();
        if (!this.props.allowUppercase) 
        {
            if(value[0] !== "@")
            {
                value = value.toLowerCase();
            }
        }
        // If regex matches ^.*#/account/account-name/.*$, parse out account-name
        let newValue = value.replace("#", "").match(/(?:\/account\/)(.*)(?:\/overview)/);
        if (newValue) value = newValue[1];

        if (this.props.onChange && value !== this.props.accountName) this.props.onChange(value);
    }

    onKeyDown(event) {
        if (event.keyCode === 13) this.onAction(event);
    }

    componentDidMount() {
        if(this.props.onAccountChanged && this.props.account)
            this.props.onAccountChanged(this.props.account);
    }

    componentWillReceiveProps(newProps) {
        if((this.props.onAccountChanged && newProps.account) && newProps.account !== this.props.account)
            this.props.onAccountChanged(newProps.account);
    }

    onAction(e) {
        e.preventDefault();
        if(this.props.onAction && !this.getError() && !this.props.disableActionButton) {
            if (this.props.account)
                this.props.onAction(this.props.account);
            else if (this.getNameType(this.props.accountName) === "pubkey")
                this.props.onAction(this.props.accountName);
        }
    }
    Add_Contact()
    {
        let account_name = "";
        let account_address = "";
        if(
            this.props.accountName[0] === "@" &&
            this.props.accountName[1] === "B" &&
            this.props.accountName[2] === "T" &&
            this.props.accountName[3] === "S"
        )
        {
            account_address = this.props.accountName;
        }
        else
        {
            account_name = this.props.accountName;
        }
        console.log("Label: "  +account_name);
        console.log("Address: "+account_address);
        //Creation Box
        let z = document.createElement("div"); //MENU
        let x = document.createElement("div"); //OVERLAY
        let t = document.createTextNode("ADDING STEALTH CONTACT");
        let za = document.createElement("h5");
        za.appendChild(t);
        let zb = document.createElement("input"); //label
        let zc = document.createElement("input"); //address
        let zd = document.createElement("input"); //Cancel button
        let ze = document.createElement("input"); //Create button
        zb.value = account_name;
        zc.value = account_address;
        Element.prototype.setAttributes = function (attrs) {
            for (var idx in attrs) {
                if ((idx === "styles" || idx === "style") && typeof attrs[idx] === "object") {
                    for (var prop in attrs[idx]){this.style[prop] = attrs[idx][prop];}
                } else if (idx === "html") {
                    this.innerHTML = attrs[idx];
                } else {
                    this.setAttribute(idx, attrs[idx]);
                }
            }
        };
        za.setAttributes({
            "styles":
            {
                "color":"white",
                "margin-top":"12px"
            }
        });
        zb.setAttributes({
            "id":"STEALTH_CONTACT_LABEL",
            "placeholder":"Stealth Contact Label",
            "type":"text",
            "styles":
            {
                "color": "white",
                "background-color": "#2b2d36",
                "border":"0",
                "width":"350px",
                "margin-left":"25px",
                "align":"center"
            }
        });
        zc.setAttributes({
            "id":"STEALTH_CONTACT_ADDRESS",
            "placeholder":"Stealth Contact Address",
            "type":"text",
            "styles":
            {
                "color": "white",
                "background-color": "#2b2d36",
                "border":"0",
                "width":"350px",
                "margin-left":"25px",
                "align":"center"
            }
        });
        zd.setAttributes({
            "id":"Create_Stealth_CANCEL",
            "type":"button",
            "value":"CANCEL",
            "styles":{
                "background-color": "#4A90E2",
                "border": "0",
                "width" : "160px",
                "height": "50px",
                "margin-right":"20px"
            }
        });
        ze.setAttributes({
            "id":"Create_Stealth_ADD",
            "type":"button",
            "value":"ADD",
            "styles":
            {
                "background-color": "#4A90E2",
                "border": "0",
                "width" : "160px",
                "height": "50px",
            }
        });
        z.setAttributes({
            "id":"Create_Stealth_Contact_window",
            "styles":{
                "backgroundColor":"#191a1f",
                "border":"1px solid gray",
                "width": "400px",
                "height": "228px",
                "margin-top": "-114px",
                "margin-left": "-200px",
                "color":"white",
                "top": "50%",
                "left": "50%",
                "z-index": "50",
                "text-align":"center",
                "position": "fixed"
                
            }
        });
        x.setAttributes({
            "id":"Create_Stealth_Contact",
            "styles":{
                "backgroundColor":"black",
                "width": "100%",
                "height": "100%",
                "opacity": "0.8",
                "z-index": "10",
                "color": "white",
                "top": "0",
                "left": "0",
                "position": "fixed"
            },
        });
        z.appendChild(za);
        z.appendChild(zb);
        z.appendChild(zc);
        z.appendChild(zd);
        z.appendChild(ze);
        document.body.appendChild(z);
        document.body.appendChild(x);
        let menu = document.getElementById("Create_Stealth_Contact_window");
        let overlay = document.getElementById("Create_Stealth_Contact");
        let cancelbutton = document.getElementById("Create_Stealth_CANCEL");
        let createbutton = document.getElementById("Create_Stealth_ADD");
        overlay.addEventListener("click", function(){
            menu.remove();
            overlay.remove();
        });
        cancelbutton.addEventListener("click", function(){
            menu.remove();
            overlay.remove();
        });
        createbutton.addEventListener("click", function(){
            let MYDB = new Stealth_DB;
            account_name = document.getElementById("STEALTH_CONTACT_LABEL").value;
            account_address = document.getElementById("STEALTH_CONTACT_ADDRESS").value;
            let account_name_checked = "";
            for(var i=1;i<account_name.length && account_name[0] === "@";i++)
            {
                account_name_checked += account_name[i];
            }
            MYDB.Initialize().then(function(){
                let C = new Stealth_Contact(account_name_checked,account_address);
                document.getElementById("Create_Stealth_Contact_window").remove();
                let win = document.createElement("div"); //WINDOW
                let STEALTH_MSG = "";
                win.setAttributes({
                    "id":"Create_Stealth_Contact_window",
                    "styles":{
                        "width": "200px",
                        "height": "100px",
                        "margin-top": "-70px",
                        "margin-left": "-100px",
                        "color":"red",
                        "top": "50%",
                        "left": "50%",
                        "z-index": "50",
                        "text-align":"center",
                        "position": "fixed"
                        
                    }
                });
                let h1 = document.createElement("h3");
                if(MYDB.create_contact(C))
                {
                    STEALTH_MSG = "Contact added successfully!";
                    h1.setAttributes({
                        "styles":{
                            "color":"green"
                        }
                    });
                }
                else
                {
                    h1.setAttributes({
                        "styles":{
                            "color":"red"
                        }
                    });
                    STEALTH_MSG = "Error: Contact Already Exists!";
                }
                let text = document.createTextNode(STEALTH_MSG);
                h1.appendChild(text);
                win.appendChild(h1);
                document.getElementById("Create_Stealth_Contact").appendChild(win);
                setTimeout(()=>{
                    overlay.remove();
                },800);
            }.bind(MYDB,this));
        }.bind(this));
        this.setState({created: true});
    }
    render() {
        let error = this.getError();
        const AccErr = () => {
            if(error === "CONTACT_ERROR!")
            {
                if(this.props.accountName.length > 3 && !this.state)
                {
                    return(<div id="STH_ERR" style={{color: "lightblue"}}>This stealth contact hasn't been added yet, would you like to <b><a href="#" onClick={this.Add_Contact.bind(this)}>add it now?</a></b></div>);
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return(
                <div>{error}</div>
            );}};
        let type = this.getNameType(this.props.accountName);
        let lookup_display;
        let mycustomimage = null;
        if (this.props.allowPubKey) {
            if (type === "pubkey") lookup_display = "Public Key";
        } 
        else if (this.props.account) 
        {
            if(type === "name") lookup_display = "#" + this.props.account.get("id").substring(4);
            else if (type === "id") lookup_display = this.props.account.get("name");
        }
        else if(type=="stealth/blind")
        {
            lookup_display = "Stealth Account";
            mycustomimage = confidential_logo;
        } 
        else if(!error && this.props.accountName)
        {
            error = counterpart.translate("account.errors.unknown");
        }

        let member_status = null;
        if (this.props.account)
            member_status = counterpart.translate("account.member." + ChainStore.getAccountMemberStatus(this.props.account));

        let action_class = classnames("button", {"disabled" : !(this.props.account || type === "pubkey") || error || this.props.disableActionButton});

        return (
            <div className="account-selector" style={this.props.style}>
                <div className="content-area">
                    <div className="header-area">
                        {error ? null : <label className="right-label"><span>{member_status}</span> &nbsp; <span>{lookup_display}</span></label>}
                        <Translate className="left-label" component="label" content={this.props.label}/>
                    </div>
                    <div className="input-area">
                        <div className="inline-label input-wrapper">
                            {type === "pubkey" ? <div className="account-image"><Icon name="key" size="4x"/></div> :
                            <AccountImage size={{height: this.props.size || 80, width: this.props.size || 80}}
                                account={this.props.account ? this.props.account.get("name") : null} custom_image={mycustomimage}/>}
                                <input type="text"
                                    value={this.props.accountName || ""}
                                    placeholder={this.props.placeholder || counterpart.translate("account.name")}
                                    ref="user_input"
                                    onChange={this.onInputChanged.bind(this)}
                                    onKeyDown={this.onKeyDown.bind(this)}
                                    tabIndex={this.props.tabIndex}
                                />
                                {this.props.dropDownContent ? <div className="form-label select floating-dropdown">
                                    <FloatingDropdown
                                        entries={this.props.dropDownContent}
                                        values={this.props.dropDownContent.reduce((map, a) => {if (a) map[a] = a; return map;}, {})}
                                        singleEntry={this.props.dropDownContent[0]}
                                        value={this.props.dropDownValue || ""}
                                        onChange={this.props.onDropdownSelect}
                                    />
                                </div> : null}
                                { this.props.children }
                                { this.props.onAction ? (
                                    <button className={action_class}
                                        onClick={this.onAction.bind(this)}>
                                        <Translate content={this.props.action_label}/></button>
                                    ) : null }
                                </div>
                            </div>

                            {error ? <div className="error-area">
                                <span>{<AccErr/>}</span>
                            </div> : null}
                        </div>
            </div>
        );

    }
}

export default BindToChainState(AccountSelector, {keep_updating: true});
