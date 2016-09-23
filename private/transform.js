'use strict';

const fs = require('fs');
const ecmarkup = require('ecmarkup/lib/ecmarkup');
const { default: Spec } = require('ecmarkup/lib/Spec');
const utils = require('ecmarkup/lib/utils');
const Clause = require('ecmarkup/lib/Clause');
const Algorithm = require('ecmarkup/lib/Algorithm');
const netFetch = require('node-fetch');

let transformedFlag;

function getFirstChildByTagName(elm, tagName) {
    let ret = [];
    const l = elm.childNodes.length;
    for (let i = 0; i < l; ++i) {
        if (elm.childNodes[i].tagName === tagName) {
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

function extractAlgDescriptor(spec, id) {
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
}

const cache = {};
const specs = {};

function diskFetch(path) {
    console.log('Fetching from disk: ', path);
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

function fetchSpec(url) {
    console.log('Fetching over the network: ', url);
    if (!cache[url]) {
        cache[url] = netFetch(url).then(res => res.text()).then(html => {
            if (html === 'Not Found') {
                throw new Error('Invalid spec identifier. Invalid spec text: ' + url);
            }
            return html;
        }).then(utils.htmlToDoc).then(doc => {
            specs[url] = new Spec(url, diskFetch, doc, {});
            return specs[url].build('emu-alg', Algorithm);
        });
    }
    return cache[url];
}

var transform = require("babel-core").transform;
var t = require("babel-core").types;
const toRoman = require("roman-numerals").toRoman;
var traverse = require("babel-traverse");
const reSpecRef = /@spec\[(.*?)\]/g;
const reClauseRef = /@clause\[(.*?)\]/g;

function prefix(level, position) {
    return [
    // 1, 2, 3...
    i => i,
    // a, b, c...
    i => String.fromCharCode(97),
    // i, ii, iii...
    i => toRoman(i).toLowerCase()][level % 3](position + 1);
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
        statement.leadingComments = [{
            type: "CommentLine",
            value: ' ' + prefix(level, pos) + '. ' + step
        }];
        return statement;
    }));
}

function createAlgArgsAST(header) {
    const params = [];
    header = header.replace(/[\[\]]/g, '');
    const firstParentPos = header.indexOf('(');
    const lastParentPos = header.indexOf(')');
    if (firstParentPos > 0 && lastParentPos > firstParentPos) {
        header.substring(firstParentPos + 1, lastParentPos - 1).split(',').forEach(name => {
            params.push(t.identifier(name.trim()));
        });
    }
    return params;
}

function expandSpecUrl(id) {
    return 'https://rawgit.com/' + id;
}

const updateBodyVisitor = {
    Statement(path) {
        // this.newBody
        (path.node.leadingComments || []).forEach(o => {
            this.existingAlgoComments.push(o.value);
        });
    }
};

const FunctionVisitor = {
    FunctionDeclaration(path) {
        const comment = (path.node.leadingComments || []).reduce((comment, o) => comment + o.value, '');
        if (!comment) return;
        reSpecRef.lastIndex = 0;
        reClauseRef.lastIndex = 0;
        const specMatch = reSpecRef.exec(comment);
        const clauseMatch = reClauseRef.exec(comment);
        if (specMatch && clauseMatch) {
            const specId = specMatch[1];
            const clauseId = clauseMatch[1];
            const descriptor = extractAlgDescriptor(specs[expandSpecUrl(specId)], clauseId);
            if (descriptor) {
                // we are ready to transform
                const newParams = createAlgArgsAST(descriptor.header);
                const newBody = createAlgStepsAST(descriptor.steps);
                const existingAlgoComments = [];
                path.traverse(updateBodyVisitor, { newBody, existingAlgoComments });
                if (existingAlgoComments.length === 0) {
                    path.node.params = newParams;
                    path.node.body = newBody;
                    transformedFlag = true;
                } else {
                    // TODO: implement the matching algo
                    console.log('Skipping existing algo [' + clauseId + '] from ' + specId);
                    // console.log(existingAlgoComments);
                    // do something else with traverse(parent, opts, scope, state, parentPath)
                    //     console.log(path.node.traverse());
                    //     traverse(path.node.body, {}, null, null, path.node.body.nodePath)
                }
            }
        }
    }
};

function transformAlgFunction(code) {
    const list = [];
    var match;
    while ((match = reSpecRef.exec(code)) !== null) {
        list.push(fetchSpec(expandSpecUrl(match[1])));
    }
    return Promise.all(list).then(_ => {
        // all specs needed for `code` are now available
        transformedFlag = false;
        const output = transform(code, {
            shouldPrintComment: function (comment) {
                return comment;
            },
            plugins: [function () {
                return {
                    visitor: FunctionVisitor
                };
            }]
        });
        return transformedFlag ? output.code : undefined;
    });
}

module.exports = {
    extractAlgDescriptor,
    createAlgStepsAST,
    createAlgArgsAST,
    fetchSpec,
    transform: transformAlgFunction
};
