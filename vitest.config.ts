import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // test/deps/chokidar-api.test.ts waits on real OS file events. When the test
        // files run in parallel, delivery of those events to the worker stalls long
        // enough that the test times out. The whole suite runs in a couple of seconds,
        // so running the files one at a time is a cheap way to keep it reliable.
        fileParallelism: false,
        coverage: { include: ['src/**/*.ts'] },
    },
});
