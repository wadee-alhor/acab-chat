<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Absi PRO</title>
<script src="/socket.io/socket.io.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body { background:#000; }
video { border-radius:12px; background:#111; }
.chat-box::-webkit-scrollbar { width:5px }
.chat-box::-webkit-scrollbar-thumb { background:#333 }
</style>
</head>

<body class="text-white h-screen flex flex-col">

<div class="text-center p-3 text-xl font-bold bg-black border-b border-gray-800">
🔥 Absi PRO - Random Live Chat
</div>

<div class="flex flex-1 gap-3 p-3 overflow-hidden">

<div class="flex-1 flex flex-col">
<video id="localVideo" autoplay muted class="h-1/2 mb-2"></video>
<video id="remoteVideo" autoplay class="h-1/2"></video>
</div>

<div class="w-72 flex flex-col bg-gray-900 rounded-xl p-3">
<div class="flex-1 chat-box overflow-y-auto mb-2 text-sm" id="chat"></div>
<div class="flex gap-1">
<input id="msgInput" class="flex-1 bg-gray-800 p-2 rounded text-sm outline-none">
<button onclick="sendMsg()" class="bg-blue-600 px-3 rounded">إرسال</button>
</div>
</div>

</div>

<div class="flex gap-3 p-3">
<button onclick="toggleMic()" id="micBtn" class="flex-1 bg-blue-600 p-2 rounded">🎤 ميك</button>
<button onclick="toggleCam()" id="camBtn" class="flex-1 bg-green-600 p-2 rounded">📷 كام</button>
<button onclick="nextUser()" class="flex-1 bg-red-600 p-2 rounded">⏭️ التالي</button>
</div>

<script>
const socket = io();
let localStream;
let peer;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

navigator.mediaDevices.getUserMedia({ video:true, audio:true })
.then(stream=>{
    localStream = stream;
    document.getElementById("localVideo").srcObject = stream;
});

socket.on("matched", async (data)=>{
    createPeer(data.initiator);
});

socket.on("signal", async data=>{
    if(data.offer){
        await peer.setRemoteDescription(data.offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("signal",{answer});
    }
    if(data.answer){
        await peer.setRemoteDescription(data.answer);
    }
    if(data.candidate){
        await peer.addIceCandidate(data.candidate);
    }
});

function createPeer(initiator){
    peer = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track=>{
        peer.addTrack(track,localStream);
    });

    peer.ontrack = e=>{
        document.getElementById("remoteVideo").srcObject = e.streams[0];
    };

    peer.onicecandidate = e=>{
        if(e.candidate){
            socket.emit("signal",{candidate:e.candidate});
        }
    };

    if(initiator){
        peer.createOffer().then(offer=>{
            peer.setLocalDescription(offer);
            socket.emit("signal",{offer});
        });
    }
}

function sendMsg(){
    const input=document.getElementById("msgInput");
    if(!input.value.trim())return;
    addMsg("me",input.value);
    socket.emit("chat",input.value);
    input.value="";
}

socket.on("chat",msg=>addMsg("them",msg));

function addMsg(type,text){
    const chat=document.getElementById("chat");
    chat.innerHTML+=`<div class="${type==="me"?"text-blue-400":"text-pink-400"} mb-1">${text}</div>`;
    chat.scrollTop=chat.scrollHeight;
}

function nextUser(){
    socket.emit("next");
    if(peer) peer.close();
    document.getElementById("remoteVideo").srcObject=null;
}

function toggleMic(){
    localStream.getAudioTracks()[0].enabled =
    !localStream.getAudioTracks()[0].enabled;
}

function toggleCam(){
    localStream.getVideoTracks()[0].enabled =
    !localStream.getVideoTracks()[0].enabled;
}

/* 🎙 AI Voice Command */
const recognition = new (window.SpeechRecognition||window.webkitSpeechRecognition)();
recognition.lang="ar-SA";
recognition.continuous=true;

recognition.onresult=e=>{
    const text=e.results[e.results.length-1][0].transcript;
    if(text.includes("التالي")){
        nextUser();
    }
};
recognition.start();

</script>
</body>
</html>