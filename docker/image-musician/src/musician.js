// Available instruments mapped with their respective sound
const availableInstruments = new Map();
availableInstruments.set('piano', 'ti-ta-ti');
availableInstruments.set('trumpet', 'pouet');
availableInstruments.set('flute', 'trulu');
availableInstruments.set('violin', 'gzi-gzi');
availableInstruments.set('drum', 'boum-boum');

// Fetch the command line arguments, remove 2 first (node and script name)
var cmdArgs = process.argv.slice(2);


// Must have ONE argument (the instrument name) and the instrument must be known
if(cmdArgs.length == 1 && availableInstruments.has(cmdArgs[0])) {
	createDgramSocket(cmdArgs[0]);
} else {
	displayArgsError();
}	




/* 
 * Display en invalid argument error, and show the available instruments
 */
function displayArgsError(){
	var errorMsg = "Invalid argument. Use [";
	
	var keys = [...availableInstruments.keys()];
	for(var i = 0; i < keys.length; ++i) {
		errorMsg += (i == 0 ? "" : " | ") + keys[i];		
	}
	errorMsg += "].";
	
	console.log(errorMsg);
}




/* 
 * Create a datagram socket and send UDP message
 */
function createDgramSocket(instrument) {
	const dgram = require('dgram');
	const socket = dgram.createSocket('udp4');
	const multicastAddress = '239.255.0.0';
	const port = 41234;
	const interval = 1000; // [ms]
	const uuid = require('uuid'); // To create unique id
	const moment = require('moment'); // Useful to transmit current time
	
	// Message
	const payload = JSON.stringify({
		uuid : uuid.v4(),
		instrument : instrument.name,
		sound : instrument.sound,
		activeSince : moment().format()
	});
	const message = new Buffer(payload);

	// Send message at constant interval
	setInterval(function(){ 
		emitSound(socket, message, port, multicastAddress);
	}, 1000);
}




/*
 * Send a message from a socket to a a specific port and address
 */
function emitSound(socket, message, port, address){
	socket.send(message, 0, message.length, port, address, function(err, bytes) {
		console.log('Sent: "' + message + '"');
	});
}
