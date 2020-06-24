var availableInstruments = [
	{
		name: "piano",
		sound: "ti-ta-ti"
	},
	{
		name: "trumpet",
		sound: "pouet"
	},
	{
		name: "flute",
		sound: "trulu"
	},
	{
		name: "violin",
		sound: "gzi-gzi"
	},
	{
		name: "drum",
		sound: "boum-boum"
	}
];

// Fetch the command line arguments, remove 2 first (node and script name)
var cmdArgs = process.argv.slice(2);


// Must have ONE argument (the instrument name)
if(cmdArgs.length != 1){
	displayArgsError(availableInstruments);
}else{
	var instrument = null;

	// Fetch the instrument passed in argument from the available instrument list object
	for(var i = 0; i < availableInstruments.length; ++i){
		if(availableInstruments[i].name == cmdArgs[0]){
			instrument = availableInstruments[i];
			break;
		}
	}

	// Valid instrument
	if(instrument != null){
		createDgramSocket(instrument);
	}
	// Invalid instrument
	else{
		displayArgsError(availableInstruments);
	}
}




/* 
 * Display en invalid argument error, and show the available instruments
 */
function displayArgsError(availableInstruments){
	var errorMsg = "Invalid argument => [";
	for(var i = 0; i < availableInstruments.length; ++i){
		if(i){
			errorMsg += ", ";
		}
		errorMsg += availableInstruments[i].name;
	}
	errorMsg += "]";

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
