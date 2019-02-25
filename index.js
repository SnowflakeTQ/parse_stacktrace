#!/usr/bin/env node

const sourceMap = require('source-map');
const fs = require('fs');
const readline = require('readline');

const argv = require('minimist')(process.argv.slice(2));
const version = require('./package.json').version;

// 版本
if (argv.v || argv.version) {
    console.log(version);
    return;
}

// 帮助
if (argv.h || argv.help) {
    console.log(`
    Usage:
        parse_stacktrace -m [sourcemap] -s [stacktrace]
    Options:
        -m Source Map                       [required]
        -o Stack Trace                      [required]
        -v Show version
        -h Show help
    `);
    return;
}

// 输入参数检测
if (!(argv.m && argv.s)) {
    console.log("Invalid arguments, Use -h for more detail.");
    return;
}

const sourceMapFile = argv.m;
const stackTraceFile = argv.s;

const rawSourceMap = JSON.parse(fs.readFileSync(sourceMapFile));
sourceMap.SourceMapConsumer.with(rawSourceMap, null, (consumer) => {
    const rl = readline.createInterface({
        input: fs.createReadStream(stackTraceFile),
    });
    rl.on("line", (line) => {
        const ret1 = line.match(/at\s.*:\d+:\d+\(\w+\.js\)/);
        if (!ret1) {
            console.log(line);
            return;
        }
        const fileName = line.match(/\(\w+\.js\)/)[0].match(/\w+\.js/)[0];
        if (fileName !== consumer.file) {
            console.log(line);
            return;
        }
        const lineColumnNums = line.match(/:\d+/g);
        const lineNum = Number(lineColumnNums[0].match(/\d+/)[0]);
        const columnNum = Number(lineColumnNums[1].match(/\d+/)[0]);
        const result = consumer.originalPositionFor({
            line: lineNum,
            column: columnNum, 
        });
        if (!result.source) {
            console.log(line);
            return;
        }
        console.log('\x1b[32m%s\x1b[0m', `       at ${result.name}:${result.line}:${result.column}(${result.source})`);
    });
});
