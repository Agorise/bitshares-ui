let str2hex = (str) => 
{
    if(str === null){return false;}
    if(typeof(str) !== "string"){return false;}
    let result = "";
    for (let i=0; i<str.length; i++) {
        let hex = str.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result;
};
let bin2hex = (byteArray) => {
    if(byteArray === null){return false;}
    return Array.from(byteArray, function(byte)
    {
        return ("0" + (byte & 0xFF).toString(16)).slice(-2);
    }).join("");
};
let hex2str = (hex) => {
    if(hex === null){return false;}
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
        let v = parseInt(hex.substr(i, 2), 16);
        if (v) str += String.fromCharCode(v);
    }
    return str;
};
export {bin2hex, hex2str, str2hex};