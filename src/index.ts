import { program } from 'commander';
import { buildCommand } from './commands/build.js';
import { watchCommand } from './commands/watch.js';
import { validateCommand } from './commands/validate.js';
import { fixCommand } from './commands/fix.js';

program
    .name('i18n-tool')
    .description('Utility for building and compiling I18N bundles')
    .addCommand(buildCommand)
    .addCommand(watchCommand)
    .addCommand(validateCommand)
    .addCommand(fixCommand)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .parse();
