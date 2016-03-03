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
                algo: extractBlock(block)
            };
        }
    }).catch(err => {
        console.log(err.stack || err);
    });
}

module.exports.extractAlgDescriptor = extractAlgDescriptor;
