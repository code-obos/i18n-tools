import { extractVariablesFromAST } from './extract-variables-from-ast';
import { getTsArgumentDescription } from './get-ts-argument-description';
import { parse } from '@formatjs/icu-messageformat-parser';
import { camelCase } from '../utils/string-utils';
import { MessageFormatElement } from '@formatjs/icu-messageformat-parser/types';

export function compileIcuMessageIntoFunction(id: string, message: string, useTypescript: boolean): [string, string] {
    const ast: MessageFormatElement[] = parse(message, { ignoreTag: false });

    const name = camelCase(id);

    const variables = extractVariablesFromAST(ast).map(getTsArgumentDescription);

    if (useTypescript) {
        const argsType = variables.map(({ name, type }) => `${name}: ${type}`).join(';');
        const args = variables.length > 0 ? `args: { ${argsType} }` : '';
        const intlOptions = variables.map(({ name }) => `${name}: args.${name}`).join(', ');
        return [name, `(${args}) => intl.formatMessage({ id: '${id}' }, {${intlOptions}})`];
    } else {
        const args = variables.length > 0 ? 'args' : '';
        const intlOptions = variables.map(({ name }) => `${name}: args.${name}`).join(', ');
        return [name, `(${args}) => intl.formatMessage({ id: '${id}' }, {${intlOptions}})`];
    }
}
