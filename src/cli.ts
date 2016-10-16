#!/usr/bin/env node

import * as minimist from "minimist";
import { run } from "./";

import { CliFlags } from "./types";

const argv = minimist(process.argv.slice(2));

run(argv._[0], argv as any);
