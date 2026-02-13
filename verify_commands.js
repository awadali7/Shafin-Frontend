const { commands } = require("@uiw/react-md-editor");
console.log(commands ? "commands exported" : "commands NOT exported");
if (commands) console.log(Object.keys(commands).slice(0, 5));
