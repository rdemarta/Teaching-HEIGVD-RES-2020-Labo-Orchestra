const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const multicastAddress = '239.255.0.0';
const port = 41234;

var message = Buffer.from('Je suis un musicien');

socket.send(message, 0, message.length, port, multicastAddress, function(err, bytes) {
	console.log('Sending');
	socket.close();
});
