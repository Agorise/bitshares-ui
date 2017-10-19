import {BlindCoin} from "stealth/Transfer/transfer";
import Stealth_DB from "stealth/DB/db";
let Receive_Receipt_Screen = (router) =>{
    let Overlay = document.createElement("div"); //OVERLAY
    let _Window = document.createElement("div"); //Window
    let Title_Text = document.createTextNode("RECEIVING RECEIPT");
    let Title_Container = document.createElement("h3");
    let Description_Text = document.createTextNode("Enter the receipt you wish to cash in below:");
    let Description_Container = document.createElement("p");
    let Receipt_Text = document.createTextNode("Copy your receipt here!");
    let Receipt_Container = document.createElement("textarea");
    let OKTEXT = document.createTextNode("CONFIRM");
    let OKTEXT_Container = document.createElement("span");
    let OK_Button = document.createElement("input");
    let CANCELTEXT = document.createTextNode("CANCEL");
    let CANCELTEXT_Container = document.createElement("span");
    let CANCEL_Button = document.createElement("input");

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
        "id":"RRECEIPT_OVERLAY",
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
        "id":"RRECEIPT_WINDOW",
        "styles":{
            "backgroundColor":"#191a1f",
            "border":"1px solid gray",
            "width": "400px",
            "height": "270px",
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
    Receipt_Container.setAttributes({
        "id":"RECEIPT_TEXT_AREA",
        "styles":{
            "color":"green",
            "background-color":"#2b2d36",
            "margin-left":"30px",
            "margin-right":"30px",
            "height":"92px",
            "width":"335px",
            "font-size":"20px",
            "text-align":"center",
            "border":"0px",
            "margin-bottom":"15px"
        }
    });
    OKTEXT_Container.setAttributes({
        "styles":
        {
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;"
        }
    });
    OK_Button.setAttributes({
        "id":"RReceive_Receipt_OK",
        "type":"button",
        "value":"CONFIRM",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "width" : "140px",
            "height": "50px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;",
            "margin-left": "50px"
        }
    });
    CANCELTEXT_Container.setAttributes({
        "styles":
        {
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;"
        }
    });
    CANCEL_Button.setAttributes({
        "id":"RReceive_Receipt_CANCEL",
        "type":"button",
        "value":"CANCEL",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "width" : "140px",
            "height": "50px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;",
        }
    });

    Title_Container.appendChild(Title_Text);
    Description_Container.appendChild(Description_Text);
    Receipt_Container.appendChild(Receipt_Text);
    OKTEXT_Container.appendChild(OKTEXT);
    OK_Button.appendChild(OKTEXT_Container);
    CANCELTEXT_Container.appendChild(CANCELTEXT);
    CANCEL_Button.appendChild(CANCELTEXT_Container);
    _Window.appendChild(Title_Container);
    _Window.appendChild(Description_Container);
    _Window.appendChild(Receipt_Container);
    _Window.appendChild(CANCEL_Button);
    _Window.appendChild(OK_Button);
    document.body.appendChild(Overlay);
    document.body.appendChild(_Window);
    let overlay = document.getElementById("RRECEIPT_OVERLAY");
    let _window = document.getElementById("RRECEIPT_WINDOW");
    let XAREA = document.getElementById("RECEIPT_TEXT_AREA");
    let BUTTONCANCEL = document.getElementById("RReceive_Receipt_CANCEL");
    let BUTTONOK = document.getElementById("RReceive_Receipt_OK");
    XAREA.addEventListener("mouseover",()=>
    {
        if(XAREA.value === "Copy your receipt here!")
        {
            XAREA.value="";
            XAREA.setAttributes({
                "id":"RECEIPT_TEXT_AREA",
                "styles":{
                    "color":"white",
                    "background-color":"#2b2d36",
                    "margin-left":"30px",
                    "margin-right":"30px",
                    "height":"92px",
                    "width":"335px",
                    "border":"0px",
                    "margin-bottom":"15px"
                }
            });
        }
    });
    XAREA.addEventListener("mouseleave",()=>
    {
        if(XAREA.value === "" || XAREA.value === null)
        {
            XAREA.setAttributes({
                "id":"RECEIPT_TEXT_AREA",
                "styles":{
                    "color":"green",
                    "background-color":"#2b2d36",
                    "margin-left":"30px",
                    "margin-right":"30px",
                    "height":"92px",
                    "width":"335px",
                    "font-size":"20px",
                    "text-align":"center",
                    "border":"0px",
                    "margin-bottom":"15px"
                }
            });
            XAREA.value="Copy your receipt here!";
        }
    });
    BUTTONCANCEL.addEventListener("click", ()=>
    {
        _window.remove();
        overlay.remove();
    });
    BUTTONOK.addEventListener("click", ()=>
    {
        let DB = new Stealth_DB();
        DB.Initialize().then(()=>{
            let bc = BlindCoin.fromReceipt(XAREA.value, DB);
            console.log(bc);
            DB.Stash(bc.toDBObject(),bc.ask_address());
            router.push("/transfer");
            router.push("/dashboard");
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
export default Receive_Receipt_Screen;