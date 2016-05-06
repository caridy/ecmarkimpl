"use strict";

const transform = require('../').transform;

transform(`

    // @spec[tc39/ecma402/master/spec/negotiation.html]
    // @clause[sec-canonicalizelocalelist]
    function fo() {
        // 1. If locales is undefined, then
        bar();
        // 2. baz;
        if (true) {
            // a. baz do something
            baz++;
        }
    }

`).then(code => {
    console.log(code);
}).catch(error => {
    console.log(error.stack || error);
});