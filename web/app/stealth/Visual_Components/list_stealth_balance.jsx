import Stealth_DB from "stealth/DB/db";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import {ChainStore} from "agorise-bitsharesjs/es";
import {export_table_to_csv} from "stealth/utility";


let stealth_view_balance = (DB,a) =>
{
    let balance = DB.Get_Balance_List(a);
    if(typeof(a) !== "string"){return false;}
    //Elements
    let SBal_Overlay = document.createElement("div");
    let SBal_Window = document.createElement("div");
    let SBal_Title_Text = document.createTextNode(a+"'s Balance");
    let SBal_Title_Container = document.createElement("h3");
    let SBal_Cancel = document.createElement("input");
    let SBal_Export = document.createElement("input");
    let Sbal_Table = document.createElement("table");
    let Sbal_Thead = document.createElement("thead");
    let thname = document.createTextNode("Asset Name");
    let thvalue = document.createTextNode("Amount");
    let Sbal_Thr = document.createElement("tr");
    let Sbal_Th = {name: document.createElement("th"),value: document.createElement("th")};
    let Sbal_Tbody = document.createElement("tbody");
    let Sbal_div = document.createElement("div");
    //Table_Proc
    for(let i=0;i<balance.length;i++)
    {
        let tr = document.createElement("tr");
        tr.setAttribute("style","vertical-align: top");
        for(let x = 0;x<2;x++)
        {
            let text = "";
            if(x === 0){text = document.createTextNode(ChainStore.getAsset(balance[i].asset_id).get("symbol"));}
            if(x === 1){text = document.createTextNode(balance[i].value);}
            let tcontainer = document.createElement("td");
            tcontainer.appendChild(text);
            if(x === 1){tcontainer.setAttribute("style","text-align: right");}
            tr.appendChild(tcontainer);
        }
        Sbal_Tbody.appendChild(tr);
    }
    //Visual
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
    Sbal_Table.setAttributes({
        "id":"Sbal_Table",
        "class":"table olDarkTheme",
        "styles":{
            "width":"380px",
            "height":"475px",
            "overflow-x": "no-overflow",
            "text-align":"left",
            "margin-left":"23px"
        },
    });
    Sbal_Thead.setAttributes({
        "id":"Sbal_Table",
        "class":"table olDarkTheme",
        "styles":{
            "display":"table-header-group"
        },
    });
    Sbal_div.setAttributes({
        "id":"Sbal_Div",
        "class":"table olDarkTheme",
        "styles":{
            "overflow-y":"scroll",
            "height":"475px"
        },
    });
    SBal_Overlay.setAttributes({
        "id":"Sbal_Overlay",
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
    SBal_Window.setAttributes({
        "id":"Sbal_Window",
        "styles":{
            "backgroundColor":"#191a1f",
            "border":"1px solid gray",
            "width": "430px",
            "height": "600px",
            "margin-top": "-300px",
            "margin-left": "-215px",
            "color":"white",
            "top": "50%",
            "left": "50%",
            "z-index": "50",
            "text-align":"center",
            "position": "fixed",
            "overflow":"hidden"
        }
    });
    SBal_Title_Container.setAttributes({
        "styles":{
            "color":"white",
            "margin-top":"10px",
        }
    });
    SBal_Cancel.setAttributes({
        "id":"Sbal_Close",
        "type":"button",
        "value":"CLOSE",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "margin-top":"auto",
            "margin-bottom":"20px",
            "width" : "140px",
            "height": "50px",
            "margin-right":"70px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;",
        }
    });
    SBal_Export.setAttributes({
        "id":"Sbal_Export",
        "type":"button",
        "value":"Export",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "margin-top":"auto",
            "margin-bottom":"20px",
            "width" : "140px",
            "height": "50px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;",
        }
    });
    Sbal_Th.value.setAttribute("style","text-align: right");
    //Connecting
    Sbal_Th.name.appendChild(thname);
    Sbal_Th.value.appendChild(thvalue);
    Sbal_Thr.appendChild(Sbal_Th.name);
    Sbal_Thr.appendChild(Sbal_Th.value);
    Sbal_Thead.appendChild(Sbal_Thr);
    Sbal_Table.appendChild(Sbal_Thead);
    Sbal_Table.appendChild(Sbal_Tbody);
    SBal_Title_Container.appendChild(SBal_Title_Text);
    SBal_Window.appendChild(SBal_Title_Container);
    Sbal_div.appendChild(Sbal_Table);
    SBal_Window.appendChild(Sbal_div);
    SBal_Window.appendChild(SBal_Cancel);
    SBal_Window.appendChild(SBal_Export);
    document.body.appendChild(SBal_Overlay);
    document.body.appendChild(SBal_Window);
    //Used elements
    let Olay = document.getElementById("Sbal_Overlay");
    let Windoe = document.getElementById("Sbal_Window");
    let Export = document.getElementById("Sbal_Export");
    let Close = document.getElementById("Sbal_Close");
    //Listeners
    Olay.addEventListener("click", ()=>{
        Windoe.remove();
        Olay.remove();
    });
    Close.addEventListener("click", ()=>{
        Windoe.remove();
        Olay.remove();
    });
    Export.addEventListener("click",()=>{
        let what = document.querySelector("#Sbal_Table").outerHTML;
        export_table_to_csv(what, a+"_balance.csv");
        Olay.remove();
        Windoe.remove();
    });
    

};
let stealth_balance = (account) => {;
    let SDB = new Stealth_DB;
    if (WalletDb.isLocked()) {
        WalletUnlockActions.unlock().then(() => {
            SDB.Initialize().then(()=>{
                stealth_view_balance(SDB,account);
            });
        });
    }
    else
    {
        SDB.Initialize().then(()=>
        {
            stealth_view_balance(SDB,account);
        });
    }
};
export default stealth_balance;