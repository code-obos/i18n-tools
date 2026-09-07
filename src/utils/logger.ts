const red = (msg: string) => `\x1b[31m${msg}\x1b[0m`;
const green = (msg: string) => `\x1b[32m${msg}\x1b[0m`;
const cyan = (msg: string) => `\x1b[36m${msg}\x1b[0m`;
const orange = (msg: string) => `\x1b[33m${msg}\x1b[0m`;
const log = (...msg: string[]) => process.stderr.write(msg.map((it) => it.toString()).join(' ') + '\n');

function success(msg: string) {
    log(green('SUCCESS'), msg);
}

function info(msg: string) {
    log(cyan('INFO'), msg);
}

function warn(msg: string) {
    log(orange('WARN'), msg);
}

function error(msg: string) {
    log(red('ERROR'), msg);
}

function fatal(msg: string) {
    log(red('FATAL'), msg);
}

export default { success, info, warn, error, fatal };
