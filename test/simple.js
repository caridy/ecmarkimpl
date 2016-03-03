const extractAlgDescriptor = require('../').extractAlgDescriptor;

const file = __dirname + '/fixtures/foo.md';

extractAlgDescriptor(file, 'sec-todatetimeoptions').then(descriptor => {
    console.log(JSON.stringify(descriptor, null, 4));
});
