import { afterEach, describe, expect, it } from 'vitest';
import { vol } from 'memfs';
import { compile } from '../../src/builder/compile-formatjs-bundle';

describe('compile-formatjs-bundle', () => {
    afterEach(() => {
        vol.reset();
    });

    it('should reject conflicting ids across files', async () => {
        vol.fromNestedJSON(
            {
                'a.json': JSON.stringify({ title: { defaultMessage: 'Hello' } }, null, 2),
                'b.json': JSON.stringify({ title: { defaultMessage: 'Hei' } }, null, 2),
            },
            '/app/input',
        );

        await expect(compile(['/app/input/a.json', '/app/input/b.json'], { ast: true })).rejects.toThrow(
            'Conflicting ID "title"',
        );
    });

    it('should skip invalid messages when skipErrors is enabled', async () => {
        vol.fromNestedJSON(
            {
                'messages.json': JSON.stringify(
                    {
                        valid: { defaultMessage: 'Hello {name}' },
                        invalid: { defaultMessage: '{, number}' },
                    },
                    null,
                    2,
                ),
            },
            '/app/input',
        );

        const compiled = await compile(['/app/input/messages.json'], { ast: true, skipErrors: true });
        const parsed = JSON.parse(compiled) as Record<string, unknown>;

        expect(parsed.valid).toBeDefined();
        expect(parsed.invalid).toBeUndefined();
    });

    it('should inject timezone into nested skeletons', async () => {
        const message = `<div>
{gender,select,
  male {<p>He was born {date,time,::ddMMM}</p>}
  female {<p>She was born {date,time,::ddMMM}</p>}
  other {<p>They was born {date,time,::ddMMM}</p>}
}.
</div>`;

        vol.fromNestedJSON(
            {
                'messages.json': JSON.stringify({ nested: { defaultMessage: message } }, null, 2),
            },
            '/app/input',
        );

        const compiled = await compile(['/app/input/messages.json'], { ast: true, timeZone: 'Europe/Oslo' });

        expect(compiled).toContain('"timeZone": "Europe/Oslo"');
    });

    it('should return string messages when ast is disabled', async () => {
        vol.fromNestedJSON(
            {
                'messages.json': JSON.stringify(
                    {
                        title: { defaultMessage: 'Hello world' },
                        subtitle: { defaultMessage: 'Secondary text' },
                    },
                    null,
                    2,
                ),
            },
            '/app/input',
        );

        const compiled = await compile(['/app/input/messages.json'], { ast: false });
        const parsed = JSON.parse(compiled) as Record<string, string>;

        expect(parsed).toEqual({
            subtitle: 'Secondary text',
            title: 'Hello world',
        });
    });
});
