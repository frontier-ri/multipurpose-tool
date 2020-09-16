
/**** ファイルの読み込み ****/
document.getElementById('inputfile').oninput = (e) => {
    var file = e.target.files;
    var reader = new FileReader();
    reader.readAsText(file[0]);
    console.log(file);
    reader.onload = function () {
        document.getElementById('file-text').innerText = reader.result;
        createCsv(reader.result, "new-" + file[0].name);
    };
}

/**** ファイルの生成 ****/
function createCsv(content, name){
    const link = document.getElementById('donwload');
    const blob = new Blob([ content ], { "type" : "text/csv" });
    window.URL = window.URL || window.webkitURL;

    link.setAttribute("href", window.URL.createObjectURL(blob));
    link.setAttribute("download", name);
}