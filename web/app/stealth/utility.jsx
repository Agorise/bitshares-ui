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
let download_csv = (csv, filename) => {
    var csvFile;
    var downloadLink;
    csvFile = new Blob([csv], {type: "text/csv"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
};

let export_table_to_csv = (html, filename) => {
    let csv = [];
    let rows = document.querySelectorAll("#Sbal_Table tr");
	
    for (let i = 0; i < rows.length; i++) 
    {
        let row = [], cols = rows[i].querySelectorAll("#Sbal_Table td, #Sbal_Table th");//Temp override will be optimized soon.
        for (let j = 0; j < cols.length; j++)
        {
            row.push(cols[j].innerText);
        }
        csv.push(row.join(","));		
    }

    // Download CSV
    download_csv(csv.join("\n"), filename);
};
export {bin2hex, hex2str, str2hex, export_table_to_csv};