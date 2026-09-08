import { Command, Option } from 'commander';
import { validFormats } from '../config.js';

/**
 * build and watch must accept the exact same options, since watch is just build on a
 * loop. Defining them once keeps the two commands from drifting apart.
 */
export function addBuildOptions(command: Command): Command {
    return command
        .addOption(new Option('-f, --format <format>', 'Output format').choices(validFormats).default('formatjs'))
        .option('--typescript', 'Output script files with typescript', false)
        .option('--strict', 'Run validation before bundling', false)
        .option('--ast', 'Compile generated bundles into AST (not available with -f script)', false)
        .option('--lut', 'Generate look-up-table (intended for the formatjs format)', false)
        .option('-t, --timeZone <timezone>', 'Inject timezone into date/time skeletons');
}
