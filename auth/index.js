'use strict';

const { router } = require('./router');
const { local, jwt } = require('./strats');

modules.exports = { router, local, jwt };