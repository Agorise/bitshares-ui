let Sent_Receipt_Screen = (r,t) =>{
    if(r === null){ return Error("Receipt String IS empty!");}

    let Overlay = document.createElement("div"); //OVERLAY
    let _Window = document.createElement("div"); //Window
    let Title_Text = document.createTextNode("Transaction Successful!");
    let Title_Container = document.createElement("h3");
    let Description_Text = document.createTextNode("Send this to " + t + " so they can receive the funds you have just transfered to them!");
    let Description_Container = document.createElement("p");
    let Receipt_Text = document.createTextNode(r);
    let Receipt_Container = document.createElement("textarea");
    let OKTEXT = document.createTextNode("CONFIRM");
    let OKTEXT_Container = document.createElement("span");
    let OK_Button = document.createElement("input");

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
        "id":"RECEIPT_OVERLAY",
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
        "id":"RECEIPT_WINDOW",
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
            "color":"white",
            "background-color":"#2b2d36",
            "margin-left":"30px",
            "margin-right":"30px",
            "height":"60px",
            "width":"335px",
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
        "id":"Sent_Receipt_OK",
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
            "text-align": "center"
        }
    });

    Title_Container.appendChild(Title_Text);
    Description_Container.appendChild(Description_Text);
    Receipt_Container.appendChild(Receipt_Text);
    OKTEXT_Container.appendChild(OKTEXT);
    OK_Button.appendChild(OKTEXT_Container);
    _Window.appendChild(Title_Container);
    _Window.appendChild(Description_Container);
    _Window.appendChild(Receipt_Container);
    _Window.appendChild(OK_Button);
    /*
    let Title_Text = document.createTextNode("Transaction Successful!");
    let Title_Container = document.createElement("h5");
    let Description_Text = document.createTextNode("Send this to " + t + "so he can receive the funds you just sent him!");
    let Description_Container = document.createElementt("p");
    let Receipt_Text = document.createTextNode(r);
    let Receipt_Container = document.createElement("p");*/
    document.body.appendChild(Overlay);
    document.body.appendChild(_Window);
    let overlay = document.getElementById("RECEIPT_OVERLAY");
    let _window = document.getElementById("RECEIPT_WINDOW");
    let BUTTONOK = document.getElementById("Sent_Receipt_OK");
    /*overlay.addEventListener("click", function(){
        _window.remove();
        overlay.remove();
    });*/
    let TEXT_AREA = document.getElementById("RECEIPT_TEXT_AREA");
    var RECEIPT_TEXT_AREA = document.querySelector("#RECEIPT_TEXT_AREA");
    TEXT_AREA.addEventListener("mousedown",(e)=>{
        e.preventDefault();
        RECEIPT_TEXT_AREA.select();
        document.execCommand("copy");
        var text = TEXT_AREA.innerHTML;
        if(text !== "Copied!")
        {
            TEXT_AREA.setAttributes({
                "id":"RECEIPT_TEXT_AREA",
                "styles":{
                    "color":"green",
                    "background-color":"#2b2d36",
                    "margin-left":"30px",
                    "margin-right":"30px",
                    "height":"60px",
                    "width":"335px",
                    "font-size":"40px",
                    "text-align":"center",
                    "border":"0px",
                    "margin-bottom":"15px"
                }
            });
            TEXT_AREA.innerText = "Copied!";
            setTimeout(()=>{
                TEXT_AREA.setAttributes({
                    "id":"RECEIPT_TEXT_AREA",
                    "styles":{
                        "color":"white",
                        "background-color":"#2b2d36",
                        "margin-left":"30px",
                        "margin-right":"30px",
                        "height":"60px",
                        "width":"335px",
                        "font-size":"1rem",
                        "border":"0px",
                        "margin-bottom":"15px"
                    }
                });
                TEXT_AREA.innerText=text;
            },300);
        }
    });
    BUTTONOK.addEventListener("click", ()=>{
        var RECEIPT_TEXT_AREA = document.querySelector("#RECEIPT_TEXT_AREA");
        RECEIPT_TEXT_AREA.select();
        document.execCommand("copy");
        _window.remove();
        overlay.remove();
    });

};
export default Sent_Receipt_Screen;