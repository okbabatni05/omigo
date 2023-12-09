let socket = io(); // connect to socket server
let text_area = document.getElementsByClassName('chatfooter')[0];
let chat_logs = document.getElementsByClassName('chatlogs')[0];
let status_bar = document.getElementsByClassName('connection_status')[0];
let next = document.getElementsByClassName('next')[0];
function put_video(stream,id){
    let dom_elem = document.getElementById(id);
    dom_elem.srcObject = stream
    dom_elem.play();
}


next.addEventListener('click', function () {

    reload();
        });


function reload(){
    if(peer){
	peer.destroy();
    }
    if(socket){
	socket.disconnect();
    }
    location.reload();
}

socket.on('connect', ()=>{
    console.log("connected");
    
    
    
})

socket.on('disconnect',()=>{
// console.log("disconnected");
});

function createMessageDiv(toggle,data){
    let div1 =  document.createElement("div");
    div1.classList.add("timestamp");
    
    let div2 =  document.createElement("div");
    if(toggle=='s')
        div2.classList.add("msg-content","msg-s");
    else
        div2.classList.add("msg-content","msg-r");

    let div3 =  document.createElement("div");
    if(toggle=='s')
        div3.classList.add("msg","s");
    else
        div3.classList.add("msg","r");

    let sp_div =  document.createElement("div");
    sp_div.classList.add("sp");
    
    let span =  document.createElement("span");
    let time = new Date();
    let today=time.toLocaleString('en-US',{dateStyle:'medium'});
    today = today.replace(",", "");
    span.innerHTML=today+" ";

    span.innerHTML+=time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      
    let p =  document.createElement("p");
    p.innerHTML=data;                           //attach message to p tag
    
    div1.appendChild(span);
    div2.appendChild(p);
    div2.appendChild(div1);

    if(toggle=='s'){
        div3.appendChild(div2);
        div3.appendChild(sp_div);
    }
    else{
        div3.appendChild(sp_div);
        div3.appendChild(div2);
    }
    chat_logs.prepend(div3);  //attach message to DOM 
}






function onPressEnter() {
    let key = window.event.keyCode;
    
                            // If the user has pressed enter in textarea in the footer send the message 
    if (key === 13) {
        window.event.preventDefault();
	if(peer){
	    if(text_area.firstElementChild.value !=""){
		peer.send(text_area.firstElementChild.value);
		createMessageDiv('s',text_area.firstElementChild.value);
	    }
	}
        
        text_area.firstElementChild.value='';
	    
    }
    
}

let peer;

socket.on('remote',init_id=>{   //create simplepeer instance with initiator :false
    navigator.mediaDevices.getUserMedia({
	video: true,
	audio: true
    }).then((stream)=>{
	put_video(stream,'local');
	
	let p = new SimplePeer(
	    {
		initiator: false,
		stream : stream
	    });
	peer=p;

	p.on('data',data=>{
            createMessageDiv('r',data);
	})


	p.on('signal',ans => {    //on signal emit it to socket server to be emitted by the server to socket with id init_id
	    console.log(ans);
	    socket.emit('ans',{id:init_id,
			       sdp:ans});	
	});


	p.on('connect',()=>{
	    status_bar.style.backgroundColor='lightgreen';
	    console.log("WebRTC connected!");
	});
	peer.on('close', () => {
	    status_bar.style.backgroundColor='red';
	    console.log("WebRTC Disconnected!");	    
	});
	p.on('stream', stream =>{
	    console.log(stream);
	    put_video(stream,'remote');
	});
	
	socket.on('offer',offer=>{  //signal the peer to get the signal answer sdp 
	    p.signal(offer.sdp);
	});

    }).catch(() => {})
    
});


socket.on('init',(remote_id)=>{ //create simplepeer instance with initiator : true
    navigator.mediaDevices.getUserMedia({
	video: true,
	audio: true
    }).then(stream=>{
	put_video(stream,'local');
	let p = new SimplePeer(
	    {
		initiator: true,
		stream: stream
	    });

	peer=p;
	p.on('data',data=>{
            createMessageDiv('r',data);
	})

	p.on('signal',offer => {                //on signal emit it to socket server to be emitted by the server to socket with id remote_id
	    socket.emit('offer',{id:remote_id,
				 sdp:offer});
	});

	p.on('connect',()=>{
	    status_bar.style.backgroundColor='lightgreen';
	    console.log("WebRTC connected!");
	});
	peer.on('close', () => {
	    status_bar.style.backgroundColor='red';
	    console.log("WebRTC Disconnected!");	    
	});

	p.on('stream', stream =>{

	    put_video(stream,'remote');
	});


	socket.on('ans',ans=>{      //signal the peer to establish Webrtc connection
	    console.log(ans,"answer");
	    p.signal(ans);
	    
	});

    }).catch(() => {})

    
});

