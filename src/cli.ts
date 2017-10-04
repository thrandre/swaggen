import * as minimist from 'minimist';

import { run } from './';

const argv = minimist(process.argv.slice(2));
run(argv as any);
