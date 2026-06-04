import { VariableDescription } from './extract-variables-from-ast.js';
import { TYPE } from '@formatjs/icu-messageformat-parser';

interface TypescriptArgument {
    name: string;
    type: string;
}

const tsTypeDescriptorMap: Record<TYPE, (description: VariableDescription) => string> = {
    [TYPE.literal]: () => 'string',
    [TYPE.argument]: () => 'string',
    [TYPE.number]: () => 'number',
    [TYPE.date]: () => 'Date',
    [TYPE.time]: () => 'Date',
    [TYPE.select]: (description: VariableDescription) => {
        const options = (description.options ?? []).map((it) => `'${it}'`);
        options.push('string');
        return options.join(' | ');
    },
    [TYPE.plural]: () => 'number',
    [TYPE.pound]: () => 'number',
    [TYPE.tag]: () => 'FormatXMLElementFn<React.ReactNode>',
};

export function getTsArgumentDescription(variableDescription: VariableDescription): TypescriptArgument {
    const tsTypeDescriptor = tsTypeDescriptorMap[variableDescription.type];
    const type = tsTypeDescriptor(variableDescription);

    return {
        name: variableDescription.name,
        type,
    };
}
