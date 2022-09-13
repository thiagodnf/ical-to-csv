let settings = {
    csvSeparator: ",",
    removeAllNewLineCharacters: true,
    removeAllCarriageReturnCharacters: true,
    escapeStringsInSummary: true,
    escapeStringsInDescription: true,
    escapeStringsInLocation: true,
};

function download(filename, text) {

    var element = document.createElement('a');

    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function generateCSV(file, content) {

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

    lines.push(columns.join(settings.csvSeparator));

    for (let k in parsed) {

        const event = parsed[k];

        // Let's sanitize the data

        for (const prop in event) {

            if ((typeof event[prop]) !== "string") {
                continue;
            }

            if (settings.removeAllCarriageReturnCharacters) {
                event[prop] = event[prop].replaceAll("\r", "");
            }

            if (settings.removeAllNewLineCharacters) {
                event[prop] = event[prop].replaceAll("\n", "");
            }

            if (prop == "summary" && settings.escapeStringsInSummary) {
                event[prop] = "\"" + event[prop] + "\"";
            }

            if (prop == "location" && settings.escapeStringsInLocation) {
                event[prop] = "\"" + event[prop] + "\"";
            }

            if (prop == "description" && settings.escapeStringsInDescription) {
                event[prop] = "\"" + event[prop] + "\"";
            }
        }

        if (event.type == 'VEVENT') {

            const startDate = dayjs(iCalDateParser(event.start));
            const endDate = dayjs(iCalDateParser(event.end));

            const row = [
                event.uid,

                startDate.format("YYYY-MM-DDTHH:mm:ssZ[Z]"),
                startDate.format("M/D/YYYY"),
                startDate.format("h:mm A"),

                endDate.format("YYYY-MM-DDTHH:mm:ssZ[Z]"),
                endDate.format("M/D/YYYY"),
                endDate.format("h:mm A"),

                event.summary ? event.summary : "",
                event.description ? event.description : "",
                event.location ? event.location : "",
            ];

            lines.push(row.join(settings.csvSeparator));
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

        bootbox.alert({
            title: "Ooops...",
            animate: false,
            centerVertical: true,
            message: message.trim().replaceAll("Error: ", ""),
            closeButton: false
        });

        return true;
    };

    $("select[data-settings-type='string'").on('change', function () {

        settings[$(this).prop("id")] = this.value;

        return false;
    });

    $("input[data-settings-type='bool'").on('change', function () {

        settings[$(this).prop("id")] = $(this).is(':checked');

        return false;
    });

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

        reader.onerror = function () {
            throw new Error(`Error occurred reading file: ${file.name}`);
        };

        reader.onload = function (evt) {
            generateCSV(file, evt.target.result);
        };

        reader.readAsText(file, "utf-8");

        return false;
    });
});
