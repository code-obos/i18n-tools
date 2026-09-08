import { describe, it, expect, afterEach } from 'vitest';
import { vol } from 'memfs';
import { runBuildCommand } from '../../src/commands/build';
import { nyboligBuildOptions, nyboligMessages } from '../fixtures/nybolig-usage';

const srcDir = '/app/src/intl/messages';
const outDir = '/app/src/intl/compiled';

function build() {
    vol.fromNestedJSON(nyboligMessages, srcDir);
    return runBuildCommand(srcDir, outDir, nyboligBuildOptions);
}

function readOut(file: string): string {
    return vol.readFileSync(`${outDir}/${file}`, 'utf-8').toString();
}

function readBundle(locale: string): Record<string, { defaultMessage: string }> {
    return JSON.parse(readOut(`bundle_${locale}.json`));
}

describe('build command, as used by nybolig-nettsider', () => {
    afterEach(() => {
        vol.reset();
    });

    it('should emit the exact set of files apps/frontend imports', async () => {
        await build();

        expect(Object.keys(vol.toJSON(outDir)).sort()).toEqual(
            [
                `${outDir}/bundle_nb.compiled.json`,
                `${outDir}/bundle_nb.json`,
                `${outDir}/bundle_sv.compiled.json`,
                `${outDir}/bundle_sv.json`,
                `${outDir}/lut.ts`,
            ].sort(),
        );
    });

    it('should give both locales the same ids', async () => {
        await build();

        expect(Object.keys(readBundle('nb')).sort()).toEqual(Object.keys(readBundle('sv')).sort());
    });

    it('should build ids from folder path and file name, keeping kebab-case', async () => {
        await build();

        expect(Object.keys(readBundle('nb')).sort()).toEqual([
            'anchors.tabs.default',
            'bkmLabel',
            'close',
            'commonProjectAndProperty.informationmeeting.formIntro',
            'plannedProjectsMatched',
            'propertyProject.banners.comingForSaleBodyText',
            'propertyProject.newLeadForm.part1.heading',
            'propertyProject.newLeadForm.receipt.heading',
            'salesassignment-table.parking.assigned-spaces',
            'salesassignment-table.parking.electric-charging-for-sale',
            'salesassignmentTable.heading.unitTBA',
            'searchMatchHeading',
            'traffic-split.mobileCta',
        ]);
    });

    it('should ignore files without a locale suffix', async () => {
        await build();

        const ids = Object.keys(readBundle('nb'));
        expect(ids.some((id) => id.toLowerCase().includes('readme'))).toBe(false);
    });

    it('should include .html messages alongside .txt messages', async () => {
        await build();

        expect(readBundle('nb')['commonProjectAndProperty.informationmeeting.formIntro'].defaultMessage).toContain(
            '<p>',
        );
    });

    it('should wrap every message in defaultMessage for the formatjs format', async () => {
        await build();

        expect(readBundle('nb').close).toEqual({ defaultMessage: 'Lukk' });
    });

    describe('lut.ts', () => {
        it('should camelCase kebab-cased folders and files into LUT keys', async () => {
            await build();
            const lut = readOut('lut.ts');

            expect(lut).toContain('"assignedSpaces": () => intl.formatMessage');
            expect(lut).toContain('"electricChargingForSale": () => intl.formatMessage');
            expect(lut).toContain('"trafficSplit": {');
            expect(lut).toContain("id: 'salesassignment-table.parking.assigned-spaces'");
        });

        it('should merge folders that camelCase to the same LUT key', async () => {
            await build();
            const lut = readOut('lut.ts');

            // 'salesassignment-table' and 'salesassignmentTable' both become
            // 'salesassignmentTable', so parking and heading must end up as siblings.
            expect(lut.match(/"salesassignmentTable": \{/g)).toHaveLength(1);
            const block = lut.slice(lut.indexOf('"salesassignmentTable": {'));
            expect(block).toContain('"parking": {');
            expect(block).toContain('"heading": {');
        });

        it('should type html tags as FormatXMLElementFn', async () => {
            await build();

            expect(readOut('lut.ts')).toContain(
                '"formIntro": (args: { p: FormatXMLElementFn<React.ReactNode> }) => intl.formatMessage',
            );
        });

        it('should type select options as a union including other and string', async () => {
            await build();

            expect(readOut('lut.ts')).toContain(
                "\"bkmLabel\": (args: { bkmModel: 'PARTOWNERSHIP' | 'START_LIVING' | 'PROPERTY_SWAP' | 'other' | string }) =>",
            );
        });

        it('should not duplicate an argument that is reused inside its own select', async () => {
            await build();
            const lut = readOut('lut.ts');
            const line = lut.split('\n').find((it) => it.includes('"bkmLabel"')) ?? '';

            expect(line.match(/bkmModel:/g)).toHaveLength(2); // once in args type, once in formatMessage values
        });

        it('should type every level of a nested plural as a number argument', async () => {
            await build();
            const lut = readOut('lut.ts');
            const line = lut.split('\n').find((it) => it.includes('"searchMatchHeading"')) ?? '';

            expect(line).toContain(
                'args: { count_properties: number;count_project: number;count_planned_project: number }',
            );
            expect(line).toContain(
                '{count_properties: args.count_properties, count_project: args.count_project, count_planned_project: args.count_planned_project}',
            );
        });

        it('should keep an argument surrounded by whitespace usable', async () => {
            await build();

            expect(readOut('lut.ts')).toContain('"comingForSaleBodyText": (args: { p: FormatXMLElementFn');
            expect(readOut('lut.ts')).toContain('propertyProjectName: args.propertyProjectName');
        });

        it('should emit the typescript preamble the frontend type-checks against', async () => {
            await build();

            expect(readOut('lut.ts')).toContain('export function createIntlLUT(intl: IntlShape<React.ReactNode>) {');
        });
    });

    describe('compiled AST bundles', () => {
        it('should compile messages to AST keyed by the same ids as the text bundle', async () => {
            await build();
            const compiled = JSON.parse(readOut('bundle_nb.compiled.json'));

            expect(Object.keys(compiled).sort()).toEqual(Object.keys(readBundle('nb')).sort());
            expect(Array.isArray(compiled.close)).toBe(true);
        });

        it('should keep html tags as tag elements in the AST', async () => {
            await build();
            const compiled = JSON.parse(readOut('bundle_nb.compiled.json'));
            const ast = compiled['commonProjectAndProperty.informationmeeting.formIntro'];

            expect(ast.some((part: { type: number; value?: string }) => part.value === 'p')).toBe(true);
        });
    });

    it('should match the snapshot for the whole nybolig-shaped output', async () => {
        await build();

        expect(vol.toJSON(outDir)).toMatchSnapshot();
    });
});
