let editor;

window.onload = function() {
    editor = ace.edit("editor", { enableBasicAutocompletion: true, enableLiveAutoCompletion: true, enableSnippets: true});
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/c_cpp");
}

function changeLanguage() {

    let language = $("#lang").val();

    if(language == 'C' || language == 'C++')editor.session.setMode("ace/mode/c_cpp");
    else if(language == 'Java')editor.session.setMode("ace/mode/java");
    else if(language == 'Python')editor.session.setMode("ace/mode/python");
    else if(language == 'Fortran')editor.session.setMode("ace/mode/fortran");
    else if(language == 'C#')editor.session.setMode("ace/mode/csharp");
    else if(language == 'Ruby')editor.session.setMode("ace/mode/ruby");
}

const API_KEY = "2192b3a856msh9bba2f637a6aebcp12d5bdjsnab109bb40283";

var language_to_id = {
    "Fortran": 59,
    "C": 50,
    "C#": 51,
    "C++": 54,
    "Java": 62,
    "Python": 71,
    "Ruby": 72
};

function encode(str) {
    return btoa(unescape(encodeURIComponent(str || "")));
}

function decode(bytes) {
    var escaped = escape(atob(bytes || ""));
    try {
        return decodeURIComponent(escaped);
    } catch {
        return unescape(escaped);
    }
}

function errorHandler(jqXHR, textStatus, errorThrown) {
    $("#output").val(`${JSON.stringify(jqXHR, null, 4)}`);
    $("#run").prop("disabled", false);
}

function check(token) {
    $("#output").val($("#output").val() + "\n⏬ Checking submission status...");
    $.ajax({
        url: `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`,
        
        type: "GET",
        headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": API_KEY
        },
        success: function (data, textStatus, jqXHR) {
            if ([1, 2].includes(data["status"]["id"])) {
                $("#output").val($("#output").val() + "\nℹ️ Status: " + data["status"]["description"]);
                setTimeout(function() { check(token) }, 1000);
            }
            else {
                var output = [decode(data["compile_output"]), decode(data["stdout"])].join("\n").trim();
                $("#output").val(`${data["status"]["id"] != "3" ? "🔴" : "🟢"} ${data["status"]["description"]}\n${output}`);
                $("#run").prop("disabled", false);
            }
        },
        error: errorHandler
    });
}

function run() {
    $("#run").prop("disabled", true);
    $("#output").val("⚙️ Creating submission...");

    $.ajax({
        url: "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false",
        type: "POST",
        contentType: "application/json",
        headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": API_KEY
        },
        data: JSON.stringify({
            "language_id": language_to_id[$("#lang").val()],
            "source_code": encode(editor.getSession().getValue()),
            "stdin": encode($("#input").val()),
            "redirect_stderr_to_stdout": true
        }),
        success: function(data, textStatus, jqXHR) {
            $("#output").val($("#output").val() + "\n🎉 Submission created.");
            setTimeout(function() { check(data["token"]) }, 2000);
        },
        error: errorHandler
    });
}

$("body").keydown(function (e) {
    if (e.ctrlKey && e.keyCode == 13) {
        run();
    }
});

$("textarea").keydown(function (e) {
    if (e.keyCode == 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        var append = "    ";
        $(this).val($(this).val().substring(0, start) + append + $(this).val().substring(end));

        this.selectionStart = this.selectionEnd = start + append.length;
    }
});

$("#editor").focus();