$(function () {
    "use strict";
	
	// for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');
		
	var userColor = false;
	var userName = false;
		
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {               
		addMessage( 'Error', 'Sorry, but your browser doesn\'t support WebSockets.', 
					'red', new Date());
		
        return;
    }	
		
    var connection = new WebSocket('ws://127.0.0.1:1337');

    connection.onopen = function () {
        input.removeAttr('disabled');
        status.text('Choose name:');
    };

    connection.onerror = function (error) {
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.</p>' } ));
    };

    connection.onmessage = function (message) {
	
		// try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.		
		try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

		var cases = {
			'color': function() {
				userColor = json.data;
				status.text(userName + ': ').css('color', userColor);
				input.removeAttr('disabled').focus();	
			}, 
			'history':function() {
				 // insert every single message to the chat window
				for (var i=0; i < json.data.length; i++) {
					addMessage(json.data[i].author, json.data[i].text,
							   json.data[i].color, new Date(json.data[i].time));
				}
			 }, 
			'message':function() {
				input.removeAttr('disabled'); // let the user write another message
				addMessage(json.data.author, json.data.text,
						   json.data.color, new Date(json.data.time));
			}};
		
		if(cases[json.type]) {
			cases[json.type]();
		}		
    };
	
	input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            
			if (!msg) {
                return;
            }
			
			var type = (msg.substring(0,1) === '-' ? 'command' : 'message');
			
			var message = {'type' : type, 'message' : msg.replace('-','') };
			
            // send the message as an ordinary text
            connection.send(JSON.stringify(message));
			
            $(this).val('');
			
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (userName === false) {
                userName = msg;
            }
        }
    });
	
	function changeUserName( user ) {
	}
	
	function addMessage( user, text, color, time ) {
		var time = new Date(time);
		var formatedDate = (time.getHours() < 10 ? '0' + time.getHours() : time.getHours()) + ':'
							+ (time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes());
							
		$('<div>').append('<span class="user">' + user   + '</span>')
				  .append('<span class="time">' + formatedDate + '</span>')
				  .append('<span class="message">' + text + '</span>')
				  .appendTo(content);

		$(content).scrollDown();
	}
});
