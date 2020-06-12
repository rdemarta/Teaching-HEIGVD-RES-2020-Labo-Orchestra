const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const multicastAddress = '239.255.0.0';
const port = 41234;

socket.bind(port, function() {
	console.log('Joining multicast group ' + multicastAddress);
	socket.addMembership(multicastAddress);
});

socket.on('message', function(msg, source) {
	//console.log('Data has arrived: ' + msg + '. Src IP: ' + source.address + '. Src port: ' + source.port);
	console.log('Received: "' + msg + '" from ' + source.address + ':' + source.port);
});
