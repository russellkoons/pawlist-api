'use strict';

const { router } = require('./router');
const { local, jwt } = require('./strats');

module.exports = { router, local, jwt };