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
                    console.log("You want me to get the public key of "+targetNode.innerText+"IT IS: "+x.get_contact(targetNode.innerText).publickey);
                    copy(x.get_contact(targetNode.innerText).publickey, {
                        debug: false,
                        message: "This is your public key. Send it to whomever you wish to transfer you funds.",
                    });
                    break;
                }
            case "Delete":
                {
                    var Delete = confirm("Are you sure you want to delete "+targetNode.innerText+"?");
                    if(Delete)
                    {
                        x.delete_contact(targetNode.innerText);
                        document.getElementById("stealthctc_"+targetNode.innerText).remove();
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
const Menu_StealthC_DashBoard = () => (
    <ContextMenu id="menu_stealthC_dashboard" animation="fade">
        <Item onClick={onClick} data="Public">
            Get Public Key
        </Item>
        <Item onClick={onClick} data="Delete">
            Delete Contact
        </Item>
    </ContextMenu>
);

export default Menu_StealthC_DashBoard;