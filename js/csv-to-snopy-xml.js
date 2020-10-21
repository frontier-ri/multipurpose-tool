
/**** ファイルの読み込み ****/
document.getElementById('inputfile').oninput = (e) => {
    var file = e.target.files;
    var reader = new FileReader();
    reader.readAsText(file[0]);
    // console.log(file);
    document.getElementById('file-text').innerText = "";
    const zip = new Zlib.Zip();
    reader.onload = function () {
        const csvArray = CSVToArray(reader.result);
        for (let i = 1; i < csvArray.length; i++) {
            const data = {};
            for (let j = 0; j < csvArray[0].length; j++) {
                const key = csvArray[0][j];
                data[key] = csvArray[i][j];
            }
            if (data["snoopyID"] === "") {
                console.log("Invalid snoopyID (counter: " + String(i) + ")");
                break;
            }
            const xmlString = createSnoXmlString(data);
            if (xmlString === null) {
                break;
            }
            zip.addFile(new TextEncoder().encode(xmlString), {
                filename: new TextEncoder().encode(data["snoopyID"] + ".xml")
            });
        }
        const compressData = zip.compress();
        const blob = new Blob([compressData], { "type": "application/zip" });
        window.URL = window.URL || window.webkitURL;

        const link = document.getElementById('donwload');
        link.setAttribute("href", window.URL.createObjectURL(blob));
        link.setAttribute("download", "convertedCsv.zip");
    };
}

/**** ファイルの生成 ****/
function createCsvFile(content, name) {
    const link = document.getElementById('donwload');
    const blob = new Blob([content], { "type": "text/csv" });
    window.URL = window.URL || window.webkitURL;

    link.setAttribute("href", window.URL.createObjectURL(blob));
    link.setAttribute("download", name);
}

function createSnoXmlString(data) {
    /**
     * data の中身は、列名をキーにした辞書型であること、CSVファイル１行分のデータがあることを期待する
     */

    // data に含まれていると期待するキー
    const expectedKeys = [
        "snoopyID",
        "dataquality",
        "openstatus",
        "lastupdate",
        "blindnote",
        "organism",
        "gene_name",
        "family_name",
        "alias",
        "family_base",
        "chrom_or_contig",
        "genome_position",
        "strand",
        "box:type='c'",
        "box:type='d'",
        "box:type='h'",
        "box:type='aca'",
        "host_id",
        "host_gene",
        "host_intron",
        "host_position",
        "organization",
        "mod_type",
        "mod_rna",
        "mod_site",
        "duplex_region",
        "accession",
        "evidence",
        "note",
        "sequence"
    ];

    /**** data のバリデーション ****/
    const lostValues = [];
    for (let i = 0; i < expectedKeys.length; i++) {
        const key = expectedKeys[i];
        if (data[key] === undefined) {
            lostValues.push(key);
        }
    }
    if (0 < lostValues.length) {
        console.log("On function 'createSnoXml', expected below data\n" + JSON.stringify(lostValues));
        return null;
    }

    /**** xml 生成 ****/
    const xmlDoc = document.implementation.createDocument(null, "snopy");
    const elements = xmlDoc.getElementsByTagName("snopy");
    for (let i = 0; i < expectedKeys.length; i++) {
        const key = expectedKeys[i];
        let node;
        switch (key) {
            case "snoopyID":
                elements[0].setAttribute("id", data[key]);
                break;

            case "box:type='c'":
                node = xmlDoc.createElement("box");
                node.textContent = data[key];
                node.setAttribute("type", "c");
                elements[0].appendChild(node);
                break;

            case "box:type='d'":
                node = xmlDoc.createElement("box");
                node.textContent = data[key];
                node.setAttribute("type", "d");
                elements[0].appendChild(node);
                break;

            case "box:type='h'":
                node = xmlDoc.createElement("box");
                node.textContent = data[key];
                node.setAttribute("type", "h");
                elements[0].appendChild(node);
                break;

            case "box:type='aca'":
                node = xmlDoc.createElement("box");
                node.textContent = data[key];
                node.setAttribute("type", "aca");
                elements[0].appendChild(node);
                break;

            default:
                node = xmlDoc.createElement(key);
                node.textContent = data[key];
                elements[0].appendChild(node);
                break;
        }
    }

    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(xmlDoc);
    return xmlString;
}

/**** CSV Parser ****/
// REFERENCE: Ask Ben: Parsing CSV Strings With Javascript Exec() Regular Expression Command
//         URL: https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
//
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    const objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    const arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    let arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        const strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)
        ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        let strMatchedValue = null;
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}
