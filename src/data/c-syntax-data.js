(function () {
  "use strict";

  var entries = [];
  var exercises = [];

  function program(headers, body, beforeMain) {
    var includes = headers.map(function (header) { return "#include <" + header + ">"; }).join("\n");
    var prefix = beforeMain ? (includes ? "\n\n" : "") + beforeMain.trim() : "";
    var separator = includes || prefix ? "\n\n" : "";
    return includes + prefix + separator + "int main(void) {\n" +
      body.map(function (line) { return "    " + line; }).join("\n") +
      "\n    return 0;\n}\n";
  }

  function defineEntry(entry) {
    entries.push(entry);
  }

  function addEntries(nextEntries) {
    nextEntries.forEach(defineEntry);
  }

  function addExercises(nextExercises) {
    nextExercises.forEach(function (exercise) { exercises.push(exercise); });
  }

  window.C_SYNTAX_ENTRIES = entries;
  window.C_SYNTAX_DEFINE_ENTRY = defineEntry;
  window.C_SYNTAX_ADD_ENTRIES = addEntries;
  window.C_SYNTAX_PROGRAM = program;
  window.C_SYNTAX_EXERCISES = exercises;
  window.C_SYNTAX_ADD_EXERCISES = addExercises;
}());
