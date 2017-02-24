#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
_1.run(argv);
//# sourceMappingURL=cli.js.map