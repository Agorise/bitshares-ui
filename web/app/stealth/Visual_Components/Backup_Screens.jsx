import Stealth_DB from "stealth/DB/db";
let str2hex = (str) => 
{
    if(typeof(str) !== "string"){return false;}
    let result = "";
    for (let i=0; i<str.length; i++) {
        let hex = str.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result;
};
let Local_Backup = (input) =>
{
    let Overlay = document.createElement("div");
    let _Window = document.createElement("div");

    let Title_Text = null;
    let Title_Container = document.createElement("h3");
    let Description_Text = null;
    if(typeof(input) === "string")
    {
        Title_Text = document.createTextNode("Backing up "+input+".");
        Description_Text = document.createTextNode("Download this file and store it somewhere safe, import it from settings whenever you wish to restore \""+input+"\" somewhere else.");
    }
    else
    {
        Title_Text = document.createTextNode("Backing up Stealth Wallet.");
        Description_Text = document.createTextNode("Download this file and store it somewhere safe, this will help you restore all your stealth accounts, in this account or another by importing it from settings.");
    }
    let Description_Container = document.createElement("p");
    let DLTEXT = document.createTextNode("DOWNLOAD");
    let DLTEXT_Container = document.createElement("span");
    let DOWNLOAD_BUTTON = document.createElement("input");

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
    Overlay.setAttributes({
        "id":"SGBK_OVERLAY",
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
    _Window.setAttributes({
        "id":"SGBK_WINDOW",
        "styles":{
            "backgroundColor":"#191a1f",
            "border":"1px solid gray",
            "width": "400px",
            "height": "215px",
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
    Title_Container.setAttributes({
        "styles":{
            "color":"green",
            "margin-top":"10px",

        }
    });
    Description_Container.setAttributes({
        "styles":{
            "color":"white",
            "margin-left":"30px",
            "margin-right":"30px",
            
        }
    });
    DLTEXT_Container.setAttributes({
        "styles":
        {
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;"
        }
    });
    DOWNLOAD_BUTTON.setAttributes({
        "id":"DOWNLOAD_BUTTON_SBKP",
        "type":"button",
        "value":"DOWNLOAD",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "width" : "140px",
            "height": "50px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;"
        }
    });


    Title_Container.appendChild(Title_Text);
    Description_Container.appendChild(Description_Text);
    DLTEXT_Container.appendChild(DLTEXT);
    DOWNLOAD_BUTTON.appendChild(DLTEXT_Container);
    _Window.appendChild(Title_Container);
    _Window.appendChild(Description_Container);
    _Window.appendChild(DOWNLOAD_BUTTON);
    document.body.appendChild(Overlay);
    document.body.appendChild(_Window);
    let overlay = document.getElementById("SGBK_OVERLAY");
    let _window = document.getElementById("SGBK_WINDOW");
    let DLBUTTON = document.getElementById("DOWNLOAD_BUTTON_SBKP");
    DLBUTTON.addEventListener("click", ()=>
    {
        let SDB = new Stealth_DB();
        SDB.Initialize().then(()=>{
            let BACKUP  = null;
            let full = false;
            if(typeof(input) === "string")
            {
                console.log("Exporting account, A Value is:"+input);
                BACKUP = SDB.Export_Account(input);
            }
            else
            {
                full = true;
                console.log("Exporting DB, A Value is:"+input);
                BACKUP =  JSON.stringify(SDB.Export_DB());
            }
            let hex = str2hex(BACKUP);
            let bytearr = new Uint8Array(hex.match(/.{2}/g) .map(e => parseInt(e, 16)));;
            let blob = new Blob([bytearr], {type: "application/octet-stream"});
            let a = document.createElement("a");
            a.href = window.URL.createObjectURL(blob);
            if(full)
            {
                a.download = "Stealth_Wallet_Backup.bin";
            }
            else
            {
                a.download = "Backup_"+input+".bin";
            }
            a.click();
        });
        _window.remove();
        overlay.remove();
    });
    overlay.addEventListener("click",()=>
    {
        _window.remove();
        overlay.remove();
    });

};
let Ipfs_Backup = () =>
{
    //todo
};
export {Local_Backup,Ipfs_Backup};