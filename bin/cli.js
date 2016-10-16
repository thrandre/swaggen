#!/usr/bin/env node
"use strict";
var minimist = require("minimist");
var _1 = require("./");
var argv = minimist(process.argv.slice(2));
_1.run(argv._[0], argv);
//# sourceMappingURL=cli.js.map