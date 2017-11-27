let temp_warn = () =>
{
    let Title = document.createTextNode("Warning: This operation takes a long time to process, do not freak out if the page gets stuck! It's simply doing complex calculations to hide the transaction. This will get faster and more responsive in the future. For now simply wait for this popup to go away.");
    let Title_Container = document.createElement("p");
    let Overlay = document.createElement("div");
    let TWindow = document.createElement("div");
    let Button = document.createElement("input");
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
        "id":"temp_overlay",
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
    TWindow.setAttributes({
        "id":"temp_window",
        "styles":{
            "backgroundColor":"#191a1f",
            "border":"1px solid gray",
            "width": "400px",
            "height": "208px",
            "margin-top": "-120px",
            "margin-left": "-200px",
            "color":"white",
            "top": "50%",
            "left": "50%",
            "z-index": "50",
            "text-align":"center",
            "position": "fixed"
        },
    });
    Button.setAttributes({
        "id":"temp_button",
        "type":"button",
        "value":"CLOSE",
        "styles":
        {
            "background-color": "#4A90E2",
            "border": "0",
            "margin-top":"0px",
            "width" : "140px",
            "height": "50px",
            "font-size": "20px",
            "font-family:":"'RobotoCondensed-Regular', arial, sans-serif;",
            "-webkit-font-smoothing": "antialiased;",
        }
    });
    Title_Container.appendChild(Title);
    TWindow.appendChild(Title_Container);
    TWindow.appendChild(Button);
    document.body.appendChild(Overlay);
    document.body.appendChild(TWindow);
    let Removeme1 = document.getElementById("temp_overlay");
    let Removeme2 = document.getElementById("temp_window");
    let Buttonx = document.getElementById("temp_button");
    Removeme1.addEventListener("click", ()=>{
        Removeme1.remove();
        Removeme2.remove();
    });
    Buttonx.addEventListener("click", ()=>{
        Removeme1.remove();
        Removeme2.remove();
    });
};
let temp_warn_remove = () => {
    let Removeme1 = document.getElementById("temp_overlay");
    let Removeme2 = document.getElementById("temp_window");
    Removeme1.remove();
    Removeme2.remove();
};
export {temp_warn,temp_warn_remove};