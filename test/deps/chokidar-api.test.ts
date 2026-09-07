import { describe, it, expect, afterEach, vi } from 'vitest';
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

type Watcher = ReturnType<typeof chokidar.watch>;

/**
 * src/commands/watch.ts uses exactly three things from chokidar: watch(dir, {
 * ignoreInitial: true }), the 'all' event, and recursive coverage of nested folders
 * (apps/frontend nests messages four levels deep). These tests run against the real
 * filesystem so a chokidar upgrade that changes any of those fails here instead of in
 * nybolig-nettsider's intl:watch script.
 *
 * These are the only tests in the suite that wait on real OS file events, and macOS
 * occasionally takes far longer than usual to deliver one, which made the suite fail
 * roughly one run in five. Hence the long timeout and the retries. Retrying does not
 * hide a genuine chokidar regression: a broken api never delivers the event, so all
 * three attempts fail and the test still reports.
 */
const watchOptions = { ignoreInitial: true };
const timeout = 20_000;
const testOptions = { timeout, retry: { count: 2, delay: 250 } };
const waitOptions = { timeout: timeout - 2_000, interval: 25 };

describe('chokidar api contract', () => {
    let dir = '';
    let watcher: Watcher | undefined;

    afterEach(async () => {
        await watcher?.close();
        watcher = undefined;
        if (dir) fs.rmSync(dir, { recursive: true, force: true });
        dir = '';
    });

    function makeDir(): string {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-tools-watch-'));
        return dir;
    }

    async function startWatching(): Promise<string[]> {
        const events: string[] = [];
        watcher = chokidar.watch(dir, watchOptions);
        watcher.on('all', (event: string, changedPath: string) =>
            events.push(`${event} ${path.relative(dir, changedPath)}`),
        );
        await new Promise<void>((resolve) => watcher!.on('ready', () => resolve()));
        return events;
    }

    it('should report added files through the all event', testOptions, async () => {
        makeDir();
        const events = await startWatching();

        fs.writeFileSync(path.join(dir, 'close_nb.txt'), 'Lukk');

        await vi.waitFor(() => expect(events).toContain('add close_nb.txt'), waitOptions);
    });

    it('should report files added in nested folders', testOptions, async () => {
        makeDir();
        const nested = path.join('propertyProject', 'newLeadForm', 'part1');
        fs.mkdirSync(path.join(dir, nested), { recursive: true });
        const events = await startWatching();

        fs.writeFileSync(path.join(dir, nested, 'heading_nb.txt'), 'Om deg');

        await vi.waitFor(() => expect(events).toContain(`add ${path.join(nested, 'heading_nb.txt')}`), waitOptions);
    });

    it('should report changes to existing files', testOptions, async () => {
        makeDir();
        const file = path.join(dir, 'close_nb.txt');
        fs.writeFileSync(file, 'Lukk');
        const events = await startWatching();

        fs.writeFileSync(file, 'Lukk vinduet');

        await vi.waitFor(() => expect(events).toContain('change close_nb.txt'), waitOptions);
    });

    it('should not report existing files as added when ignoreInitial is set', testOptions, async () => {
        makeDir();
        fs.writeFileSync(path.join(dir, 'close_nb.txt'), 'Lukk');
        const events = await startWatching();

        await new Promise((resolve) => setTimeout(resolve, 250));

        // A 'change' can still arrive for a file written just before the watcher
        // started; ignoreInitial only promises no 'add' for the initial scan.
        expect(events.filter((event) => event.startsWith('add'))).toEqual([]);
    });
});
