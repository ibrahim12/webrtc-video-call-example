// ===================================================
// IMPORTANT: only for development
// total.js - web application framework for node.js
// http://www.totaljs.com
// ===================================================


var fs = require('fs'),
    options = {};


options.https = {
    key: fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt'),
};
options.port = 443;

// change it to your network ip
options.ip = '192.168.1.112';

require('total.js');

F.on('load', function load() {
    F.config['allow-compile-script'] = false;
});

F.https('debug', options);
