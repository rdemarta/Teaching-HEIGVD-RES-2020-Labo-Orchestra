const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const multicastAddress = '239.255.0.0';
const port = 41234;

const Net = require('net'); // For TCP server
const TCP_port = 2205;
const TCP_server = new Net.Server();
var moment = require('moment');
var musicianMap = new Map();

socket.bind(port, function() {
	console.log('Joining multicast group ' + multicastAddress);
	socket.addMembership(multicastAddress);
});

socket.on('message', function(msg, source) {
	console.log('Received: "' + msg + '" from ' + source.address + ':' + source.port);
	
	// Update musician map
	musicianMap[msg['uuid']] = JSON.parse(msg);
});



/* ---------------  TCP SERVER ------------------- */

// The server listens to a socket for a client to make a connection request.
TCP_server.listen(TCP_port, function() {
    console.log("TCP server listening for connection requests on port " + TCP_port + ".");
});

// When a client requests a connection with the server, the server creates a new socket dedicated to that client.
TCP_server.on('connection', function(tcpClientSocket) {
    console.log('A new connection has been established.');
	console.log('Sending all musicians that are playing.');

    tcpClientSocket.write('<My list of musician>');

	tcpClientSocket.end();

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    tcpClientSocket.on('end', function() {
        console.log('Closing connection with the client');
    });

    // Don't forget to catch error, for your own sake.
    tcpClientSocket.on('error', function(err) {
        console.log(`Error: ${err}`);
    });
});