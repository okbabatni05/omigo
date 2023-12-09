const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//Modify ip_addr and port 
const ip_addr = '127.0.0.1';
const port = 3000;

app.use('/',express.static('public'));
server.listen(port,ip_addr, () => {
  console.log('listening on',ip_addr,"port",port);
});

let clients = [];//stores the socket.id of socket instances
let clients_values = {}; //stores the socket instances of connected sockets with socket.id as key
io.on('connection', (socket) => {

//    console.log(socket.handshake.address," connected with id ",socket.id);
    clients.push(socket.id); 
    clients_values[socket.id] = socket;
    console.log(clients);

    socket.on('disconnect',()=>{
	clients.splice(clients.indexOf(socket.id),1);
	delete clients_values[socket.id];
    });

    socket.on('offer', offer=>{           //Webrtc offer from client to offer.id
	io.to(offer.id).emit('offer',{
	    id:socket.id,
	    sdp:offer.sdp
	});
    });
    socket.on('ans', ans=>{              //Webrtc answer from client to ans.id
	
	io.to(ans.id).emit('ans',ans.sdp);
	if(clients_values[ans.id]){
	    clients_values[ans.id].disconnect();     //Disconnect socket.id and ans.id from socket server
	}
	clients_values[socket.id].disconnect();
    });
});

async function make_pair_and_connect() { //asynchronous function syntax copied from stackoverflow
    //while true check the clients array for clients and randomly create pairs 
    while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
	// ...do some async work...
	console.log(clients.length);
          if(clients.length >= 2){
	      let i = Math.floor(Math.random()*(clients.length));
	      let init = clients[i];
	      let j = Math.floor(Math.random()*(clients.length));
	      while(j==i){
		  j = Math.floor(Math.random()*(clients.length));
	      }
	      let remote = clients[j];

	      io.to(init).emit('init',remote); //emit to init client the id of remote and tell it to turn  initiator: true of its webrtc instance
	      io.to(remote).emit('remote',init); //emit to remote client the id of init and tell it to create a webrtc instance with value of initiator:false
	      clients.splice(clients.indexOf(init),1);
	      clients.splice(clients.indexOf(remote),1);

	  }

      
  }
}

make_pair_and_connect();
