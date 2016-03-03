'use strict';

const fs = require('fs');
const ecmarkup = require('ecmarkup/lib/ecmarkup');
const Spec = require('ecmarkup/lib/Spec');
const utils = require('ecmarkup/lib/utils');
const Clause = require('ecmarkup/lib/Clause');
const Algorithm = require('ecmarkup/lib/Algorithm');

function fetch(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

function getFirstChildByTagName(elm, tagName){
    let ret = [];
    const l = elm.childNodes.length;
    for (let i = 0; i < l; ++i){
        if (elm.childNodes[i].tagName === tagName){
            return elm.childNodes[i];
        }
    }
}

function extractBlock(el) {
    const ol = getFirstChildByTagName(el, 'OL');
    if (!ol) return;
    const block = [];
    while (ol.firstChild) {
        debugger;
        const childBlock = extractBlock(ol.firstChild);
        block.push([ol.firstChild.textContent.trim(), childBlock]);
        ol.firstChild.parentElement.removeChild(ol.firstChild);
    }
    ol.parentElement.removeChild(ol);
    return block;
}

function extractAlgDescriptor(file, id) {
    return fetch(file)
        .then(utils.htmlToDoc)
        .then(doc => {
            return new Spec(file, fetch, doc, {}).build('emu-alg', Algorithm);
    }).then(spec => {
        // removing all unnecessary garbage from ecmarkup output
        Array.prototype.forEach.call(spec.doc.querySelectorAll('span[class="secnum"]'), el => {
            el.parentElement.removeChild(el);
        });
        Array.prototype.forEach.call(spec.doc.querySelectorAll('span[class="anchor"]'), el => {
            el.parentElement.removeChild(el);
        });
        // looking for the clause for a specific `id`
        const clause = spec.doc.getElementById(id);
        if (clause) {
            // finding the first header and algo inside the clause
            const header = clause.querySelectorAll('h1,h2,h3,h4,h5,h6')[0];
            const block = clause.querySelectorAll('emu-alg')[0];
            return {
                header: header.textContent,
                steps: extractBlock(block)
            };
        }
    }).catch(err => {
        console.log(err.stack || err);
    });
}

var transform = require("babel-core").transform;
var t = require("babel-core").types;
const toRoman = require("roman-numerals").toRoman;

function prefix(level, position) {
    return [
        // 1, 2, 3...
        i => i,
        // a, b, c...
        i => String.fromCharCode(97),
        // i, ii, iii...
        i => toRoman,
    ][level % 3](position + 1);
}

function createAlgStepsAST(steps, level) {
    level = level || 0;
    return t.blockStatement(steps.map((pair, pos) => {
        const step = pair[0];
        const block = pair[1];
        let statement;
        if (block && block.length) {
             statement = createAlgStepsAST(block, level + 1);
        } else {
            statement = t.emptyStatement();
        }
        statement.leadingComments = '// ' + prefix(level, pos) + '. ' + step;
        return statement;
    }));
}

function createAlgArgsAST(header) {
    const params = [];
    header = header.replace(/[\[\]]/g, '');
    const firstParentPos = header.indexOf('(');
    const lastParentPos = header.lastIndexOf(')');
    if (firstParentPos > 0 && lastParentPos > firstParentPos) {
        header.substr(firstParentPos + 1, lastParentPos - 1).split(',').forEach(name => {
            params.push(t.identifier(name.trim()));
        });
    }
    return params;
}

module.exports = {
    extractAlgDescriptor,
    createAlgStepsAST,
    createAlgArgsAST,
};
