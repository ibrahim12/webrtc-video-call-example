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
        _socket = new WebSocket('wss://192.168.1.112/'),
        type = 'receiver',
        video,
        rvideo,
        pc;


    function getKey(_type) {
        var key = type + '_desc';
        if (!!_type) {
            key = _type + '_desc';
        }
        return key;
    }

    function setDescription(desc, _type) {
        var key = getKey(_type);
        localStorage[key] = JSON.stringify(desc);
    }

    function getDescription(_type) {
        var key = getKey(_type);
        return JSON.parse(localStorage[key]);
    }

    function sendDesc(_type, desc) {
        _socket.send(encodeURIComponent(JSON.stringify({ type: _type + '_desc', desc: desc })));
    }

    function sendIceCandidate(candidate) {
        _socket.send(encodeURIComponent(JSON.stringify({ type: 'candidate', candidate: candidate, target: type })));
    }

    function onAddIceCandidateSuccess() {
        console.log('AddIceCandidate success.');
    }

    function onAddIceCandidateError(error) {
        console.log('Failed to add ICE Candidate: ' + error.toString());
    }

    function onicecandidate(event) {
        if (!event || !event.candidate || window.iceSent) return;
        console.log(event);

        if (event.candidate) {
            console.log('Sending ICE candidate');
            sendIceCandidate(event.candidate);
        }
        window.iceSent = true;
    };

    function onaddstream(event) {
        console.log('Received remote stream');
        console.log(event);
    };



    function call() {
        type = 'caller';
        console.log('Starting call');
        video = document.querySelector('video#video');

        pc = new RTCPeerConnection(configuration, pcConstraints);
        console.log('Created local peer connection object pc1');

        pc.onaddstream = onaddstream; 
        pc.onicecandidate = onicecandidate;
        callerSendStream();
        sendOffer();
        window.pc = pc;
    }

    function setIceCadidate(candidate) {
        console.log('Ice Candiate set, type ', type, candidate);
        pc.addIceCandidate(
            new RTCIceCandidate(candidate)
        ).then(
            onAddIceCandidateSuccess,
            onAddIceCandidateError
        );
    }

    function callerSendStream() {
        pc.setRemoteDescription(getDescription('receiver')).then(
            function afterSetRemoteDescription() {
            },
            onSetSessionDescriptionError
        );

        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        })
          .then(gotStream)
          .catch(function catchHandler(e) {
              console.log('getUserMedia() error: ' + e.name);
          });
    }


    function answer() {
        type = 'receiver';
        console.log('Answering call');
        video = document.querySelector('video#video');

        pc = new RTCPeerConnection(configuration, pcConstraints);
        console.log('Created Peer Connection ' + type);

        pc.onaddstream = onaddstream; 
        pc.onicecandidate = onicecandidate;

        pc.setRemoteDescription(getDescription('caller')).then(
            function afterSetRemoteDescription() {
                pc.createAnswer().then(
                onAnswerDescription,
                onCreateSessionDescriptionError
              );
            },
            onSetSessionDescriptionError
        );

        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        })
          .then(answerGotStream)
          .catch(function catchHandler(e) {
              console.log('getUserMedia() error: ' + e.name);
          });
    }

    function onAnswerDescription(desc) {
        console.log('on Answer Description \n' + desc.sdp);
        setDescription(desc, 'receiver');

        pc.setLocalDescription(desc).then(
            onSetLocalDescriptionSuccess,
            onSetSessionDescriptionError
        );
    }

    function onSetLocalDescriptionSuccess(event) {
        console.log('setLocalDescriptionSuccss', event);
        sendDesc(type, getDescription());
        // desc.sdp = forceChosenAudioCodec(desc.sdp);
    }

    function onCallDescription(desc) {
        console.log('on Call Description \n' + desc.sdp);
        setDescription(desc, 'caller');

        pc.setLocalDescription(desc).then(
            onSetLocalDescriptionSuccess,
            onSetSessionDescriptionError
        );
    }

    function sendStream(stream) {
        var videoTracks;

        localStream = stream;
        videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
            console.log('Using Audio device: ' + videoTracks[0].label);
        }
        console.log('Adding Local Stream to peer connection');
        pc.addStream(localStream);
    }

    function sendOffer() {
        pc.createOffer(
            offerOptions
          ).then(
            onCallDescription,
            onCreateSessionDescriptionError
          );
    }

    function gotStream(stream) {
        console.log('Sending Caller Stream');
        video.src = URL.createObjectURL(stream);
        sendStream(stream);
    }

    function answerGotStream(stream) {
        console.log('Sending Receiver Stream');
        video.src = URL.createObjectURL(stream);
        sendStream(stream);
    }


    function onCreateSessionDescriptionError(error) {
        console.log('Failed to create session description: ' + error.toString());
    }

    function onSetSessionDescriptionError(error) {
        console.log('Failed to set session description: ' + error.toString());
    }

//     window.addEventListener('storage', function addEventListener() {
//         console.log('message received', event);
//         console.log(localStorage.caller_desc);
//         console.log(localStorage.receiver_desc);
//
//         if (!localStorage.state == 'calling') {
//             onAnswerReceived();
//         } else {
//             answer();
//         }
//     });

    _socket.onmessage = function onMessage(e) {
        var data = JSON.parse(decodeURIComponent(e.data));
        console.log('Recived on Message: ', data);
        if (data.type === 'caller_desc' && type === 'receiver') {
            setDescription(data.desc, 'caller');
            answer();
        } else if (data.type === 'receiver_desc' && type === 'caller') {
            setDescription(data.desc, 'receiver');
        } else if (data.type === 'candidate' && data.target !== type) {
            setIceCadidate(data.candidate);
        }
    };

    window.RingCallSDK = {
        call: call,
        answer: answer,
        callerSendStream: callerSendStream,
    };
})(window);
