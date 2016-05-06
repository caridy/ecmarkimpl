#!/usr/bin/env node


'use strict';

var glob = require('glob');
var path = require('path');
var fs = require('fs');
var transform = require('../private/transform').transform;
var CURRENT_PATH = process.cwd();

var opts = require('nomnom').script('ecmarkimpl').options({
    path: {
        position: 0,
        help: 'File or directory to analyze [default to "./"]',
        metavar: 'FILE'
    },
    glob: {
        abbr: 'g',
        help: 'Glob to search for file in the selected path.',
        default: '**/*.js'
    },
    verbose: {
        abbr: 'v',
        choices: [0, 1, 2],
        default: 0,
        help: 'Show more information about the process.'
    },
    ignore: {
        abbr: 'i',
        help: 'List of patterns to be ignored, e.g.: **/foo/**',
        list: true
    }
}).parse();

var log = console.log.bind(console);
var ignore = [
// these are the things that we know for sure we never want to inspect
'**/node_modules/**'].concat(opts.ignore || []);

var globOptions = {
    silent: true,
    cwd: CURRENT_PATH,
    nodir: true,
    realpath: true,
    ignore: ignore
};
// making this async just in case we want to change it later on
var patterns = Array.isArray(opts.glob) ? opts.glob : [opts.glob];

log('Search for ' + patterns.join(' or '));
log(' -> Ignoring: ' + ignore.join(','));

var files = [];
console.log(globOptions);
patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern, globOptions));
});
// deduping...
files = files.filter((v, i) => files.indexOf(v) === i);

if (files.length) {
    log('----------------\nFound ' + files.length + ' matching files.');

    var result = {
        error: 0,
        ok: 0,
        nochange: 0
    };
    var modifiedFiles = [];
    var failedFiles = [];

    function logResults() {
        log('\n');
        // log(JSON.stringify(result, null, 4));
        if (opts.dry) {
            log(result.ok + ' unmodified file(s).');
        } else {
            log(result.ok + ' transformed file(s).');
        }
        if (result.error) {
            log(result.error + ' parsing error(s).');
            fs.writeFileSync(path.resolve('codemod.log'), failedFiles.join('\n'), 'utf8');
        }
        if (opts.output) {
            log('\nWritting list of modified files into ' + path.resolve(opts.output));
            fs.writeFileSync(path.resolve(opts.output), modifiedFiles.join('\n'), 'utf8');
        }
    }

    function runNext() {
        let file = files.pop();
        if (file) {
            let oldCode = fs.readFileSync(file, 'utf8');
            transform(oldCode).then(newCode => {
                if (oldCode === newCode) {
                    log('[nochange] ' + file);
                    result.nochange++;
                } else {
                    // fs.writeFileSync(file, newCode, 'utf8');
                    log('[transformed] ' + file);
                    result.ok++;
                    modifiedFiles.push(file);
                }
            }).catch(error => {
                log('[error] ' + file);
                result.error++;
                failedFiles.push(file);
                log(err.stack || err);
            }).then(runNext);
        } else {
            logResults(result);
        }
    }

    // running tranform on each individual matching file in
    // a queue to avoid issues with big batches
    runNext();
} else {
    log('Did not find matching files.');
}
