const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "443",
});

let myVideoStream;
navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
    });

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
    call.on("close", () => {
        video.remove();
    });

    peers[userId] = call;
};

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
};

// Controls
const muteButton = document.getElementById("muteButton");
const cameraButton = document.getElementById("cameraButton");
const shareScreenButton = document.getElementById("shareScreenButton");
const copyLinkButton = document.getElementById("copyLinkButton");

muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        muteButton.innerText = "Unmute";
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        muteButton.innerText = "Mute";
    }
});

cameraButton.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        cameraButton.innerText = "Camera On";
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        cameraButton.innerText = "Camera Off";
    }
});

shareScreenButton.addEventListener("click", async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
    });
    const screenTrack = screenStream.getVideoTracks()[0];
    myVideoStream.getVideoTracks()[0].stop();
    myVideoStream.removeTrack(myVideoStream.getVideoTracks()[0]);
    myVideoStream.addTrack(screenTrack);
    screenTrack.onended = () => {
        myVideoStream.removeTrack(screenTrack);
        navigator.mediaDevices
            .getUserMedia({
                video: true,
            })
            .then((newStream) => {
                const newTrack = newStream.getVideoTracks()[0];
                myVideoStream.addTrack(newTrack);
                myVideoStream.getVideoTracks()[0].enabled = true;
                cameraButton.innerText = "Camera Off";
            });
    };
});

copyLinkButton.addEventListener("click", () => {
    const roomUrl = window.location.href;
    navigator.clipboard
        .writeText(roomUrl)
        .then(() => {
            alert("Room URL copied to clipboard");
        })
        .catch((err) => {
            console.error("Failed to copy: ", err);
        });
});

const peers = {};
