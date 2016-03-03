const extractAlgDescriptor = require('../').extractAlgDescriptor;
const createAlgStepsAST = require('../').createAlgStepsAST;
const createAlgArgsAST = require('../').createAlgArgsAST;

const file = __dirname + '/fixtures/foo.md';

extractAlgDescriptor(file, 'sec-todatetimeoptions').then(descriptor => {
    const params = createAlgArgsAST(descriptor.header);
    const body = createAlgStepsAST(descriptor.steps);
    console.log('params: ', params);
    console.log('body: ', body);
    /*
    TODO: with the params and body (which is a block statement) we should be able to
    update any function with the corresponding steps
    TODO: how to match body this to an existing body?
    */
}).catch(error => {
    console.log(error.stack || error);
});
