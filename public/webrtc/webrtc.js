(function iife() {
    var configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com' },
            ],
        },
        pcConstraints = {
            optional: [],
        },
        offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1,
            voiceActivityDetection: false,
        },
        localStream,
        _socket = new WebSocket('wss://' +  window.location.hostname + '/'),
        signalSrc = 'receiver',
        video,
        rvideo,
        isCaller = false,
        iceCandidateFound = false,
        pc;


        function sendOffer() {
            pc.createOffer(
                offerOptions
              ).then(
                gotDescription,
                onCreateSessionDescriptionError
              );
        }

        function sendAnswer() {
            pc.createAnswer().then(
                gotDescription,
                onCreateSessionDescriptionError);

        }

        function signalSend(data) { 
            _socket.send(decodeURIComponent(JSON.stringify(data)));
        }

        function gotDescription(desc) {
            pc.setLocalDescription(desc);
            signalSend({ 'sdp': desc, signalSrc: signalSrc });
        }

        function onCreateSessionDescriptionError(error) {
            console.log('Failed to create session description: ' + error.toString());
        }

        function onSetSessionDescriptionError(error) {
            console.log('Failed to set session description: ' + error.toString());
        }

        // run start(true) to initiate a call
        function start(_isCaller) {
            isCaller = _isCaller;
            if (isCaller) {
                signalSrc = 'caller';
            }
            video = document.querySelector('video#src');
            rvideo = document.querySelector('video#dest');

            pc = new RTCPeerConnection(configuration);

            // send any ice candidates to the other peer
            pc.onicecandidate = function (evt) {
                if (!!iceCandidateFound) return;
                signalSend({ 'candidate': evt.candidate, signalSrc: signalSrc });
                iceCandidateFound = true;
            };

            // once remote stream arrives, show it in the remote video element
            pc.onaddstream = function (evt) {
                rvideo.src = URL.createObjectURL(evt.stream);
            };

            // get the local stream, show it in the local video element and send it
            navigator.getUserMedia({ 'audio': true, 'video': true }, function (stream) {
                video.src = URL.createObjectURL(stream);
                pc.addStream(stream);

                if (isCaller)
                    sendOffer();
                else
                    sendAnswer()

            });
    }

    _socket.onmessage = function (evt) {
        if (!pc)
            start(false);

        var signal = JSON.parse(decodeURIComponent(evt.data));

        if (signal.signalSrc === signalSrc) return;

        if (signal.sdp)
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        else
            pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    };

    window.RingCallSDK = {
        start: start
    };
})(window);
