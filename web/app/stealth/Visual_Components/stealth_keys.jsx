import Stealth_DB from "stealth/DB/db";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
let stealth_keys_view = (DB,account) =>
{
    if(typeof(account) !== "string"){return false;}
    let SKeys_Overlay = document.createElement("div"); //OVERLAY
    let SKeys_Window = document.createElement("div"); //Window
    let Skeys_Title_Text = document.createTextNode(account+"'s Sensitive Information");
    let Skeys_Title_Container = document.createElement("h3");
    //Publickey
    let Skeys_PublicKey_Text = document.createTextNode("Public Key");
    let Skeys_PublicKey_Text_Container = document.createElement("p");
    let Skeys_PublicKey_Input = document.createElement("input");
    let Skeys_PublicKey_Container = document.createElement("div");
    //Privatekey
    let Skeys_PrivateKey_Text = document.createTextNode("Private Key");
    let Skeys_PrivateKey_Text_Container = document.createElement("p");
    let Skeys_PrivateKey_Input = document.createElement("input");
    let Skeys_PrivateKey_Container = document.createElement("div");
    //BrainKey
    let Skeys_BrainKey_Text = document.createTextNode("Brain Key");
    let Skeys_BrainKey_Text_Container = document.createElement("p");
    let Skeys_BrainKey_Input = document.createElement("input");
    let Skeys_BrainKey_Container = document.createElement("div");
    let Skeys_Cancel = document.createElement("input");
    Element.prototype.setAttributes = function (attrs) { //The awesomest tool ever!
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
    SKeys_Overlay.setAttributes({
        "id":"SKeys_Overlay",
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
    SKeys_Window.setAttributes({
        "id":"Skeys_Window",
        "styles":{
            "backgroundColor":"#191a1f",
            "border":"1px solid gray",
            "width": "400px",
            "height": "240",
            "margin-top": "-120px",
            "margin-left": "-200px",
            "color":"white",
            "top": "50%",
            "left": "50%",
            "z-index": "50",
            "text-align":"center",
            "position": "fixed"
            
        }
    });
    Skeys_Title_Container.setAttributes({
        "styles":{
            "color":"white",
            "margin-top":"10px",
        }
    });
    //Public
    Skeys_PublicKey_Input.setAttributes({
        "id":"SKeys_PublicKey_Input",
        "type":"text",
        "value":""+DB.Get("account",account).publickey,
        "styles":{
            "color":"white",
            "background-color":"#191a1f",
            "border":"0px",
            "margin-left":"5px",
            "margin-right":"30px",
            "height":"30px",
            "width":"255px",
            "background-color":"dimgray"
            
        }
    });
    Skeys_PublicKey_Text_Container.setAttributes({
        "styles":{
            "color":"white",
            "float":"left",
            "margin-right":"5px",
            "width":"90px",
            "text-align":"left"
        }
    });
    Skeys_PublicKey_Container.setAttributes({
        "styles":{
            "color":"white",
            "margin-left":"20px",
            "margin-right":"20px",
            "height":"30px",
            "width":"350px",
            "overflow-y":"hidden",
            "margin-bottom":"5px"
        }
    });
    //Private
    Skeys_PrivateKey_Input.setAttributes({
        "id":"SKeys_PrivateKey_Input",
        "type":"text",
        "value":""+DB.Get("account",account).privatekey,
        "styles":{
            "color":"white",
            "background-color":"#191a1f",
            "border":"0px",
            "margin-left":"5px",
            "margin-right":"30px",
            "height":"30px",
            "width":"255px",
            "background-color":"dimgray"
            
            
        }
    });
    Skeys_PrivateKey_Text_Container.setAttributes({
        "styles":{
            "color":"white",
            "float":"left",
            "margin-right":"5px",
            "width":"90px",
            "text-align":"left"
        }
    });
    Skeys_PrivateKey_Container.setAttributes({
        "styles":{
            "color":"white",
            "margin-left":"20px",
            "margin-right":"20px",
            "height":"30px",
            "width":"350px",
            "float":"left",
            "overflow-y":"hidden",
            "margin-bottom":"5px"
        }
    });
    //BrainKey
    Skeys_BrainKey_Input.setAttributes({
        "id":"SKeys_PrivateKey_Input",
        "type":"text",
        "value":""+DB.Get("account",account).brainkey,
        "styles":{
            "color":"white",
            "background-color":"#191a1f",
            "border":"0px",
            "margin-left":"5px",
            "margin-right":"30px",
            "height":"30px",
            "width":"255px",
            "background-color":"dimgray"
            
            
        }
    });
    Skeys_BrainKey_Text_Container.setAttributes({
        "styles":{
            "color":"white",
            "float":"left",
            "margin-right":"5px",
            "width":"90px",
            "text-align":"left"
        }
    });
    Skeys_BrainKey_Container.setAttributes({
        "styles":{
            "color":"white",
            "margin-left":"20px",
            "margin-right":"20px",
            "height":"30px",
            "width":"350px",
            "float":"left",
            "overflow-y":"hidden",
            "margin-bottom":"5px"
        }
    });
    //Cancel
    Skeys_Cancel.setAttributes({
        "id":"Skey_Close",
        "type":"button",
        "value":"CLOSE",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "margin-top":"20px",
            "width" : "140px",
            "height": "50px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;",
        }
    });
    Skeys_Title_Container.appendChild(Skeys_Title_Text);
    //Public
    Skeys_PublicKey_Text_Container.appendChild(Skeys_PublicKey_Text);
    Skeys_PublicKey_Container.appendChild(Skeys_PublicKey_Text_Container);
    Skeys_PublicKey_Container.appendChild(Skeys_PublicKey_Input);
    //Private
    Skeys_PrivateKey_Text_Container.appendChild(Skeys_PrivateKey_Text);
    Skeys_PrivateKey_Container.appendChild(Skeys_PrivateKey_Text_Container);
    Skeys_PrivateKey_Container.appendChild(Skeys_PrivateKey_Input);
    //Brainkey
    Skeys_BrainKey_Text_Container.appendChild(Skeys_BrainKey_Text);
    Skeys_BrainKey_Container.appendChild(Skeys_BrainKey_Text_Container);
    Skeys_BrainKey_Container.appendChild(Skeys_BrainKey_Input);
    SKeys_Window.appendChild(Skeys_Title_Container);
    SKeys_Window.appendChild(Skeys_PublicKey_Container);
    SKeys_Window.appendChild(Skeys_PrivateKey_Container);
    SKeys_Window.appendChild(Skeys_BrainKey_Container);
    SKeys_Window.appendChild(Skeys_Cancel);
    document.body.appendChild(SKeys_Overlay);
    document.body.appendChild(SKeys_Window);

    //Used elements
    let Close_Button = document.getElementById("Skey_Close");
    let Olay = document.getElementById("SKeys_Overlay");
    let Windoe = document.getElementById("Skeys_Window");
    Close_Button.addEventListener("click", ()=>{
        Windoe.remove();
        Olay.remove();
    });
    Olay.addEventListener("click", ()=>{
        Windoe.remove();
        Olay.remove();
    });
};
let stealth_keys = (account) => {
    let SDB = new Stealth_DB;
    if (WalletDb.isLocked()) {
        WalletUnlockActions.unlock().then(() => {
            SDB.Initialize().then(()=>{
                stealth_keys_view(SDB,account);
            });
        });
    }
    else
    {
        SDB.Initialize().then(()=>{
            stealth_keys_view(SDB,account);
        });
    }
};
export default stealth_keys;