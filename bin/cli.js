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
    },
    dry: {
      abbr: 'd',
      flag: true,
      help: 'Dry run (no changes are made to files).',
  },
}).parse();

var log = console.log.bind(console);
var ignore = [
        // these are the things that we know for sure we never want to inspect
        '**/node_modules/**'
    ].concat(opts.ignore || []);

var files = [];

if (opts.path) {
    let f;
    try {
        f = fs.statSync(opts.path);
    } catch (e) {}
    if (!f) {
        log('Invalid path ' + opts.path);
        process.exit(1);
    }
    if (f.isFile()) {
        files.push(opts.path);
    }
}

if (files.length === 0) {
    var globOptions = {
        silent: true,
        cwd: opts.path || CURRENT_PATH,
        nodir: true,
        realpath: true,
        ignore: ignore
    };
    // making this async just in case we want to change it later on
    var patterns = Array.isArray(opts.glob) ? opts.glob : [opts.glob];

    log('Search for ' + patterns.join(' or '));
    log(' -> Ignoring: ' + ignore.join(','));

    patterns.forEach(pattern => {
        files = files.concat(glob.sync(pattern, globOptions));
    });
    // deduping...
    files = files.filter((v, i) => files.indexOf(v) === i);
    log('----------------\nFound ' + files.length + ' matching files.');
}

if (files.length) {
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
        }
    }

    function runNext() {
        let file = files.pop();
        if (file) {
            let oldCode = fs.readFileSync(file, 'utf8');
            transform(oldCode).then(newCode => {
                if (newCode === undefined) {
                    log('[nochange] ' + file);
                    result.nochange++;
                } else {
                    if (!opts.dry) {
                        fs.writeFileSync(file, newCode, 'utf8');
                    }
                    log('[transformed] ' + file);
                    result.ok++;
                    modifiedFiles.push(file);
                }
            }).catch(err => {
                log('[error] ' + file);
                log('\t' + err.stack || err);
                result.error++;
                failedFiles.push(file);
            }).then(runNext);
        } else {
            logResults(result);
        }
    }

    if (opts.dry) {
        log('Running in dry-run mode...');
    }

    // running tranform on each individual matching file in
    // a queue to avoid issues with big batches
    runNext();
} else {
    log('Did not find matching files.');
}
