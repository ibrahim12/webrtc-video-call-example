exports.install = function () {
    F.route('/', home);
    F.websocket('/', socket_homepage, ['json'], ['http']);
};

function home() {
    var self = this;
    self.view('webrtc/index');
}

function socket_homepage() {
    var controller = this;

    controller.on('open', function (client) {
        console.log('Connect / Online: ', client.id , controller.online);
    });

    controller.on('close', function (client) {
        console.log('Disconnect / Online:', controller.online);
    });

    controller.on('message', function (client, message) {
        console.log(message);
        controller.send(message);
    });
}
