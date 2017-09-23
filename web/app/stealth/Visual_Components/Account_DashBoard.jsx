import React from "react";
import { ContextMenu, Item, Separator, IconFont } from "react-contexify";
import Stealth_DB from "stealth/DB/db";
import copy from "copy-to-clipboard";
function onClick(targetNode, ref, data) {
    let x = new Stealth_DB();
    x.Initialize().then(()=>{
        switch(data)
        {
            case "Public":
                {
                    console.log("You want me to get the public key of "+targetNode.innerText+"IT IS: "+x.get_account(targetNode.innerText).publickey);
                    copy(x.get_account(targetNode.innerText).publickey, {
                        debug: false,
                        message: "This is your public key. Send it to whomever you wish to transfer you funds.",
                    });
                    break;
                }
            case "Private":
                {
                    console.log("You want me to get the private key of "+targetNode.innerText);
                    copy(x.get_account(targetNode.innerText).privatekey, {
                        debug: false,
                        message: "This is your private key, never share it with anyone, it's the one thing that gives you access to your funds. Use it in case you wish to import it elsewhere.",
                    });
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
        <Item onClick={onClick} data="Delete">
            Delete Account
        </Item>
    </ContextMenu>
);

export default Menu_Stealth_DashBoard;