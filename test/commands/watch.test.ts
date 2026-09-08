import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import type { Command } from 'commander';

type Handler = (...args: unknown[]) => void;

const handlers: Record<string, Handler[]> = {};
const closeMock = vi.fn(async () => {});
const fakeWatcher = {
    on: vi.fn((event: string, handler: Handler) => {
        handlers[event] = [...(handlers[event] ?? []), handler];
        return fakeWatcher;
    }),
    close: closeMock,
};
const watchMock = vi.fn(() => fakeWatcher);

vi.mock('chokidar', () => ({ watch: watchMock }));

const srcDir = '/app/src/intl/messages';
const outDir = '/app/src/intl/compiled';

/**
 * apps/frontend runs `i18n-tool watch src/intl/messages src/intl/compiled --strict
 * --ast --lut --typescript --timeZone Europe/Oslo` as its intl:watch script. chokidar
 * is mocked here so the wiring can be asserted without touching the real filesystem;
 * see test/deps/chokidar-api.test.ts for the real chokidar contract.
 */
async function startWatch(args: string[] = []): Promise<void> {
    vi.resetModules();
    const { watchCommand }: { watchCommand: Command } = await import('../../src/commands/watch');
    await watchCommand
        .exitOverride()
        .configureOutput({ writeOut: () => {}, writeErr: () => {} })
        .parseAsync([srcDir, outDir, ...args], { from: 'user' });
}

// process.stdin is not a TTY under vitest, so setRawMode does not exist and has to be
// installed rather than spied on.
const stdin = process.stdin as NodeJS.ReadStream & { setRawMode?: unknown };
const realSetRawMode = stdin.setRawMode;

describe('watch command', () => {
    beforeEach(() => {
        stdin.setRawMode = vi.fn(() => stdin);
        vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        vol.fromNestedJSON({ 'close_nb.txt': 'Lukk', 'close_sv.txt': 'Stang' }, srcDir);
    });

    afterEach(() => {
        stdin.setRawMode = realSetRawMode;
        process.stdin.removeAllListeners('keypress');
        for (const event of Object.keys(handlers)) delete handlers[event];
        vi.restoreAllMocks();
        vi.clearAllMocks();
        vol.reset();
    });

    it('should watch the source folder and ignore the initial scan', async () => {
        await startWatch();

        expect(watchMock).toHaveBeenCalledWith(srcDir, { ignoreInitial: true });
        expect(handlers.all).toHaveLength(1);
    });

    it('should build once before watching', async () => {
        await startWatch(['--lut', '--typescript']);

        expect(Object.keys(vol.toJSON(outDir))).toContain(`${outDir}/lut.ts`);
    });

    it('should rebuild when the watcher reports a change', async () => {
        await startWatch();
        vol.unlinkSync(`${outDir}/bundle_nb.json`);

        handlers.all[0]('add', `${srcDir}/open_nb.txt`);

        await vi.waitFor(() => expect(Object.keys(vol.toJSON(outDir))).toContain(`${outDir}/bundle_nb.json`));
    });

    it('should not exit the process when validation fails, unlike build', async () => {
        vol.reset();
        vol.fromNestedJSON({ 'close_nb.txt': 'Lukk', 'open_sv.txt': 'Oppna' }, srcDir);

        await expect(startWatch(['--strict'])).resolves.toBeUndefined();
    });

    it('should pass --timeZone through to the compiled bundles', async () => {
        vol.reset();
        vol.fromNestedJSON({ 'date_nb.txt': '{d, date, ::yyyyMMdd}' }, srcDir);

        await startWatch(['--ast', '-t', 'Europe/Oslo']);

        const compiled = JSON.parse(vol.readFileSync(`${outDir}/bundle_nb.compiled.json`, 'utf-8').toString());
        expect(compiled.date[0].style.parsedOptions.timeZone).toBe('Europe/Oslo');
    });

    it("should run the fixer when 'f' is pressed", async () => {
        vol.reset();
        vol.fromNestedJSON({ 'close_nb.txt': 'Lukk', 'close_sv.txt': 'Stang', 'open_nb.txt': 'Apne' }, srcDir);

        await startWatch();
        process.stdin.emit('keypress', 'f', { sequence: 'f', name: 'f', ctrl: false, meta: false, shift: false });

        await vi.waitFor(() => expect(vol.readFileSync(`${srcDir}/open_sv.txt`, 'utf-8').toString()).toBe('[sv] TODO'));
    });

    it('should exit on ctrl-c', async () => {
        await startWatch();

        process.stdin.emit('keypress', '', { sequence: '', name: 'c', ctrl: true, meta: false, shift: false });

        expect(process.exit).toHaveBeenCalledWith(0);
    });
});
