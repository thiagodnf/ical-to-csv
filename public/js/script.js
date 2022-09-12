
function download(filename, text) {
    var element = document.createElement('a');

    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function generateCSV(file, content, separator = ",") {

    const parsed = ical.parseICS(content);

    const columns = [
        "uid",
        "start",
        "start_as_date",
        "start_as_time",
        "end",
        "end_as_date",
        "end_as_time",
        "summary",
        "description",
        "location"
    ];

    const lines = [];

    lines.push(columns.join(separator));

    for (let k in parsed) {

        const event = parsed[k];

        event.type = event.type.replaceAll("\r", "");
        event.uid = event.uid.replaceAll("\r", "");
        event.start = event.start.replaceAll("\r", "");
        event.end = event.end.replaceAll("\r", "");
        event.summary = event.summary? event.summary.replaceAll("\r", ""): "";
        event.description = event.description? event.description.replaceAll("\r", ""): "";
        event.location = event.location? event.location.replaceAll("\r", ""): "";

        if (event.type == 'VEVENT') {

            const row = [
                event.uid,

                dayjs(iCalDateParser(event.start)).format("YYYY-MM-DDTHH:mm:ssZ[Z]"),
                dayjs(iCalDateParser(event.start)).format("M/D/YYYY"),
                dayjs(iCalDateParser(event.start)).format("h:mm A"),

                dayjs(iCalDateParser(event.end)).format("YYYY-MM-DDTHH:mm:ssZ[Z]"),
                dayjs(iCalDateParser(event.end)).format("M/D/YYYY"),
                dayjs(iCalDateParser(event.end)).format("h:mm A"),

                event.summary ? `"${event.summary}"` : "",
                event.description ? `"${event.description}"` : "",
                event.location ? `"${event.location}"` : "",
            ];

            lines.push(row.join(separator));
        }
    }

    const filename = file.name.replace(".ics", ".csv");

    download(filename, lines.join("\n"));
}

function isValid(file) {

    if (file.type === "text/calendar") {
        return true;
    }

    return false;
}

$(function () {

    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

    window.onerror = function (message, url, lineNumber) {
        alert(message);
        return true;
    };

    $("#form-input").submit((event) => {
        event.preventDefault();

        let $file = $('#file')[0];

        if (!$file) {
            throw new Error("The file was not found");
        }

        let file = $file.files[0];

        if (!file) {
            throw new Error("You did not select a file");
        }

        if (file.size === 0) {
            throw new Error("The file is empty");
        }

        if (!isValid(file)) {
            throw new Error("The file is not .ical");
        }

        var reader = new FileReader();

        reader.onload = function (evt) {
            generateCSV(file, evt.target.result);
        };

        reader.onerror = function (event) {
            throw new Error(`Error occurred reading file: ${file.name}`);
        };

        reader.readAsText(file, "utf-8");

        return false;
    });
});
