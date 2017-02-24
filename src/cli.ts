#!/usr/bin/env node

import { run } from './';
import * as minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
run(argv as any);
