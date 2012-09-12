var WebSocketServer = require('websocket').server;

var http = require('http');

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

/**
* Helper function for escaping input strings
*/
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
* Global variables
*/
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];


// WebSocket server
wsServer.on('request', function(request) {

	var userName = false;

    var connection = request.accept(null, request.origin);

	var index = clients.push(connection) - 1;
	
    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
	
		var request = JSON.parse(message.utf8Data);
		console.log(request);
		var cases = {
			'message':function() {
				console.log((new Date()) + ' Received Message from '
							+ userName + ': ' + request.message);
				
				// we want to keep history of all sent messages
				var obj = {
					time: (new Date()).getTime(),
					text: htmlEntities(request.message),
					author: userName,
				};
				
				history.push(obj);
				history = history.slice(-100);

				// broadcast message to all connected clients
				var json = JSON.stringify({ type:'message', data: obj });
				for (var i=0; i < clients.length; i++) {
					clients[i].sendUTF(json);
				}
			},
			'command': function() {				
				var commands = {'listusers':function() {
					var usernames = [];
					
					for (var i=0; i < clients.length; i++) {
						usernames.push(clients[i].userName);
					}
					
					var json = JSON.stringify({type:'listusers', data: usernames});					
					client[i].sendUTF(json);
					}				
				};
				
				commands[ request.message ]();
			}
		};
		
	   if (userName === false) { // first message sent by user is their name
			// remember user name
			userName = htmlEntities(request.message);
			// get random color and send it back to the user			
			console.log((new Date()) + ' User is known as: ' + userName);
			
			connection.sendUTF(JSON.stringify({ type:'color', data: "red" }));
		}	
		else { // log and broadcast the message
			cases[request.type]();
		}
    });
	
	//send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    connection.on('close', function(connection) {
        if (userName !== false) {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);            
        }
    });
});
