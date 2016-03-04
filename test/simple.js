"use strict";

const transform = require('../').transform;

transform(`

    // @spec[tc39/ecma402/master/spec/negotiation.html]
    // @clause[sec-canonicalizelocalelist]
    function fo() {

    }

`).then(code => {
    console.log(code);
}).catch(error => {
    console.log(error.stack || error);
});
