import React from "react";
import { ContextMenu, Item, Separator, IconFont } from "react-contexify";
import Stealth_DB from "stealth/DB/db";
import {Local_Backup} from "stealth/Visual_Components/Backup_Screens";
import copy from "copy-to-clipboard";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
let GetPrivateKey = (targetNode, x) => 
{
    if (WalletDb.isLocked()) {
        WalletUnlockActions.unlock().then(() => {
            copy(x.get_account(targetNode.innerText).privatekey, {
                debug: false,
                message: "This is your private key, never share it with anyone, it's the one thing that gives you access to your funds. Use it in case you wish to import it elsewhere.",
            });
        });
    }
    else
    {
        copy(x.get_account(targetNode.innerText).privatekey, {
            debug: false,
            message: "This is your private key, never share it with anyone, it's the one thing that gives you access to your funds. Use it in case you wish to import it elsewhere.",
        });
    }
    
};
let Backup = (targetNode) => 
{
    if (WalletDb.isLocked()) {
        WalletUnlockActions.unlock().then(() => {
            Local_Backup(targetNode.innerText);
        });
    }
    else{
        Local_Backup(targetNode.innerText);
    }
    
};

function onClick(targetNode, ref, data) {
    let x = new Stealth_DB();
    x.Initialize().then(()=>{
        switch(data)
        {
            case "Public":
                {
                    copy(x.get_account(targetNode.innerText).publickey, {
                        debug: false,
                        message: "This is your public key. Send it to whomever you wish to transfer you funds.",
                    });
                    break;
                }
            case "Private":
                {
                    GetPrivateKey(targetNode,x);
                    break;
                }
            case "Backup":
                {
                    Backup(targetNode);
                    break;
                }
            case "Delete":
                {
                    var Delete = confirm("Are you sure you want to delete "+targetNode.innerText+"?");
                    if(Delete)
                    {
                        x.delete_account(targetNode.innerText);
                        document.getElementById("stealthacc_"+targetNode.innerText).remove();
                    }
                    break;
                }
            default:
                {
                    console.log(new Error("Error in context menu, none of the options were passed!"));
                    break;
                }
        }
    });
}

// create your menu first
const Menu_Stealth_DashBoard = () => (
    <ContextMenu id="menu_stealth_dashboard" animation="fade">
        <Item onClick={onClick} data="Public">
            Get Public Key
        </Item>
        <Item onClick={onClick} data ="Private">
            Get Private Key
        </Item>
        <Item onClick={onClick} data ="Backup">
            Backup
        </Item>
        <Item onClick={onClick} data="Delete">
            Delete Account
        </Item>
    </ContextMenu>
);

export default Menu_Stealth_DashBoard;