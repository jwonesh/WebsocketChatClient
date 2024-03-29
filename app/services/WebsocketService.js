'use strict';

angular.module('myApp')

.factory('WebsocketService', ['$q', 'UserService', '$rootScope', '$location', 'VoiceService', function($q, UserService, $rootScope, $location, VoiceService) {
	var service = {};
	var currentCallbackId = 0;
	var callbacks = {};

	var bufferHeuristic = VoiceService.getVoiceWrapper().bufferHeuristic;

	var readyWrapper = {};

	var NO_CONNECTION = -1;

	var ws = null;

	var buffers = [];
	var buffRotator = -1;

	var BUFF_SIZE_RENDERER = VoiceService.getVoiceWrapper().BUFF_SIZE_RENDERER;

	var first = true;

	var audioBuffer = new Float32Array(bufferHeuristic * BUFF_SIZE_RENDERER);

	var bufferRing = [];

	var audioContext = new AudioContext();
	var frameCount = audioContext.sampleRate;
	//var c = new OfflineAudioContext(1, bufferHeuristic * BUFF_SIZE_RENDERER, frameCount);
    var myArrayBuffer = audioContext.createBuffer(1, (BUFF_SIZE_RENDERER * bufferHeuristic/8), frameCount);
	var source = null;
	var buffToggle = -1;
	var writingToAudio = false;
	var ranOnce = false;
	var startPlayback = -1;
	var bufferRingPosition = -1;
	var bufferRingPlayPosition = 0;
	var playbackStopped = false;

	for (var i = 0; i < bufferHeuristic; i++){
		bufferRing.push(createBufferNode(BUFF_SIZE_RENDERER, audioContext, frameCount));
	}

	var onPlayEnded = function(){
		if (bufferRingPosition >= bufferHeuristic/8 - 1){
			bufferRingPlayPosition = bufferRingPosition - (bufferHeuristic/8 - 1);
		} else{
			bufferRingPlayPosition = (bufferHeuristic/8 + bufferRingPosition - 1);
		}
		//if (!bufferRing[(bufferRingPlayPosition + 1) % bufferHeuristic].readyForConsumption === 1){
			//var playbackStopped = true;
		//	return;
		//}
		bufferRingPlayPosition = ++bufferRingPlayPosition % bufferHeuristic;
		var node = bufferRing[bufferRingPlayPosition];
		//if (node.readyForConsumption === 1){
		node.readyData();
		node.readyForConsumption = 0;
		//TODO: only play if marked for consumption;
		node.source.start(0);
		//}

	};


	function createBufferNode(bufferSize, context, frameCount){
		var node = {};
		node.buffer = context.createBuffer(1, BUFF_SIZE_RENDERER, frameCount);
		node.readyForConsumption = 0;
		node.channel = 0;
		node.source = null;

		node.readyData = function(){
			node.source = audioContext.createBufferSource(1, (BUFF_SIZE_RENDERER), frameCount);
			node.source.buffer = node.buffer;
			
			node.source.connect(audioContext.destination);
			node.source.onended = onPlayEnded;

			node.readyForConsumption = 1;
		};

		return node;
	};



	var initWs = function(){
		ws = new WebSocket("ws://10.10.11.83:8001");
		//ws = new WebSocket("ws://0.tcp.ngrok.io:18124");
		ws.binaryType = "arraybuffer";
		ws.onopen = function(){
			if (!!readyWrapper.defer){
				readyWrapper.defer.resolve();
			} else{
				ws.send("{}");
			}
		};

		ws.onmessage =  function(response){
			if(response.data instanceof ArrayBuffer){
				console.log("received binary data!");
				handleBinaryData(response.data);
			} else{
				console.log("Received message: " + JSON.stringify(response.data));
				resolveCallback(response);
			}
		};

		ws.onerror = function(error){
			console.log("error: " + error);
		};

	};

	initWs();



	
	var configDone = false;
	function handleBinaryData(data){
			var buffRotatePos = ++buffRotator % bufferHeuristic;

			var newArr = new Float32Array(data);
			bufferRingPosition = ++bufferRingPosition % bufferHeuristic;
			var node = bufferRing[bufferRingPosition];
			//copy to super buffer
			//for (var i = 0; i < newArr.length; i++){
				//audioBuffer[(buffRotatePos * BUFF_SIZE_RENDERER) + i] = newArr[i];

			//	node.buffer.getChannelData(0)[i] = newArr[i];
			//}

			node.buffer.copyToChannel(newArr, 0);
			//node.readyData();

			if (bufferRingPosition === bufferHeuristic/8 - 1){
				if (!ranOnce){
					ranOnce = true;
				}
			}

			if (configDone && playbackStopped){
			}
			else if ((!ranOnce || configDone)){
				return;
			}
			
		
			source = audioContext.createBufferSource(1, (BUFF_SIZE_RENDERER), frameCount);
			source.buffer = bufferRing[0].buffer;

   			source.connect(audioContext.destination);
   			source.onended = onPlayEnded;
   			source.start(0);
   			configDone = true;
		
	};


	var defaultReceiveCallback = {
		resolve: function(response){
			console.log("message received: " +response.message);
		}
	};

	callbacks[-1] = defaultReceiveCallback;

	var registeredCallbackWrapper = {};
	registeredCallbackWrapper.callback = defaultReceiveCallback;

	var resolveCallback = function(data){
		var d = JSON.parse(data.data);
		var callback = callbacks[d.cbid];
		if (d.cbid === -1){
			callback.resolve(d)
		} else if (d.cbid === -2){ 
			var message = JSON.parse(d.message);
			var action = actions[message.type];

			if (!!action){
				action(message.data);
			} else{
				console.log("can't parts action");
			}
		}else{
			callback.resolve(d);
			//delete callbacks[data.cbid];

		}
	}

	var sendMessage = function(message, type, cbid){
		var data = {};
		data.type = type;
		data.body = message;
		data.cbid = cbid;
		if (ws.readyState > 1){
			//var defer = $q.defer();
			//ws = new WebSocket("ws://localhost:8001");
			//readyWrapper.defer = defer;
			//defer.promise.then(function(){ws.send(JSON.stringify(data))});
			return NO_CONNECTION;
		} else{
			ws.send(JSON.stringify(data));
		}
	};

	var defer = function(request, type){
		var defer = $q.defer();
		var callbackId = currentCallbackId;
		callbacks[currentCallbackId] = defer;
		if (currentCallbackId === Number.MAX_VALUE){
			currentCallbackId = 0;
		} else{
			currentCallbackId++;
		}
    	var err = sendMessage(request, type, callbackId);
    	if (!!err){
    		//attempt to reconnect
    		initWs();
    		defer.reject();
    	}
    	return defer.promise;
	};

	service.sendVoiceChunk = function(buffer){
	//	buffers.push(buffer);
	//	while (buffers.length >= bufferHeuristic){
	//		ws.send(buffers[0]);
	//		buffers.splice(0, 1);
		//}

		ws.send(buffer);
	};

	//angular service calls

	service.login = function(username, password, peerId){
		var data = {username: username, password: password, peerId: peerId};
		return defer(data, "LOGIN");
	};

	service.testMessage = function(message){
		var data = {message: 'test'};
		return defer(data, "TEST");
	};

	service.getLoggedInUsers = function(){
		return defer({}, "GET_LOGGED_IN_USERS");
	};

	service.sendMessage = function(username, message, cid){
		var data = {username: username, message: message, cid: cid};
		return defer(data, "SEND_MESSAGE");
	};

	service.createConversation = function(participants){
		var data = {participants: participants};
		return defer(data, "CREATE_CONVERSATION");
	};

	service.addUserToConversation = function(username, conversation, from){
		var data = {username: username, cid: conversation.id, from: from};
		return defer(data, "ADD_USER_TO_CONVERSATION");
	};

	service.register = function(username, password){
		var data = {username: username, password: password};
		return defer(data, "REGISTER");
	};

	service.createVoiceChatRoom = function(name){
		var data = {name: name, owner: UserService.getUserWrapper().user.username};
		return defer(data, "CREATE_VOICE_CHAT_ROOM");
	};

	service.getVoiceChatRooms = function(){
		return defer({}, "GET_VOICE_CHAT_ROOMS");
	};

	service.connectToVoiceChatRoom = function(name){
		return defer({name: name}, "CONNECT_TO_VOICE_CHAT_ROOM");
	};

	var actions = {};

	var doUserLoggedInCb = function(data){
		var convo = null;
		var participant = null;
		for (var i = 0; i < UserService.getUserWrapper().conversations.length; i++){
			convo = UserService.getUserWrapper().conversations[i];
			for (var j = 0; j < convo.participants.length; j++){
				participant = convo.participants[j];
				if (participant === data.username){
					convo.history.push({from: "", message: data.username + " reconnected to the conversation."});
					break;
				}
				
			}
		}

		for (var k in VoiceService.getVoiceWrapper().chatRooms){
			var room = VoiceService.getVoiceWrapper().chatRooms[k];
			if (room.name.toLowerCase() === 'lobby'){
				var userInLobbyAlready = false;
				for (var l = 0; l < room.participants.length; l++){
					if (room.participants[l].username === data.username){
						userInLobbyAlready = true;
						break;
					}
				}

				if (!userInLobbyAlready){
					room.participants.push({username: data.username, peerId: data.peerId});
				}
			} else{
				for (var m = 0; m < room.participants.length; m++){
					if (room.participants[m].username === data.username){
						room.participants.splice(m, 1);
					}
				}
			}
		}

		if (UserService.getUserWrapper().loggedInUsers.indexOf(data.username) === -1){
			UserService.getUserWrapper().loggedInUsers.push(data);
		}

		if(!$rootScope.$$phase) {
			$rootScope.$apply()
		}
	};

	var doUserLoggedOutCb = function(data){
		//notify conversations
		var convo = null;
		var participant = null;
		for (var i = 0; i < UserService.getUserWrapper().conversations.length; i++){
			convo = UserService.getUserWrapper().conversations[i];
			for (var j = 0; j < convo.participants.length; j++){
				participant = convo.participants[j];
				if (participant === data.username){
					convo.history.push({from: "", message: data.username + " disconnected from the conversation."});
					break;
				}
				
			}
		}

		for (var k in VoiceService.getVoiceWrapper().chatRooms){
			var room = VoiceService.getVoiceWrapper().chatRooms[k];
			for (var j = 0; j < room.participants.length; j++){
				if (room.participants[j].username === data.username){
					room.participants.splice(j, 1);
					break;
				}
			}
		}

		var users = UserService.getUserWrapper().loggedInUsers;
		users.splice(users.indexOf(data.username), 1);
		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}
	};

	var forceLogout = function(data){
		//reset connection
		initWs();
		$location.path("/view1");
	};

	var receiveMessage = function(data){
		var d = data;
		var from = d.from;
		var convos = UserService.getUserWrapper().conversations;
		var found = false;
		for (var i = 0; i < UserService.getUserWrapper().conversations.length; i++){
			if (UserService.getUserWrapper().conversations[i].id === d.cid){
				UserService.getUserWrapper().conversations[i].history.push(data);
				found = true;
				break;
			}
		}

		if (!found){
			var newConvo = {};
			newConvo.username = from;
			newConvo.history = [];
			newConvo.participants = d.participants;
			newConvo.isGroupChat = d.isGroupChat;
			newConvo.id = d.cid;
			newConvo.history.push(data);
			UserService.getUserWrapper().conversations.push(newConvo);
		}

		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}

	};

	var addUserToConversation = function(data){
		var foundConvo = null;
		for (var i = 0; i < UserService.getUserWrapper().conversations.length; i++){
			if (UserService.getUserWrapper().conversations[i].id === data.cid){
				foundConvo = UserService.getUserWrapper().conversations[i];
				break;
			}
		}

		if (!!foundConvo){
			//being created on already participating users client
			var filteredUserList = [];
			for (var i = 0; i < data.participants.length; i++){
				if (data.participants[i] !== UserService.getUserWrapper().user.username){
					filteredUserList.push(data.participants[i]);
				}
			}
			foundConvo.participants = filteredUserList;
			foundConvo.history.push({from: "", message: data.addedUser + " has been added to the conversation by " + data.addedBy});
		} else{
			//being created on new user client
			var newConvo = {};
			newConvo.username = data.from;
			newConvo.history = [];
			var filteredUserList = [];
			for (var i = 0; i < data.participants.length; i++){
				if (data.participants[i] !== UserService.getUserWrapper().user.username){
					filteredUserList.push(data.participants[i]);
				}
			}
			newConvo.participants = filteredUserList;
			newConvo.isGroupChat = true;
			newConvo.id = data.cid;
			UserService.getUserWrapper().conversations.push(newConvo);
		}


		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}
	};

	var voiceChatRoomCreated = function(data){
		var chatRooms = VoiceService.getVoiceWrapper().chatRooms;

		chatRooms[data.name.toLowerCase()] = data;

		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}
	};

	var userConnectedToChatRoom = function(data){
		var chatRooms = VoiceService.getVoiceWrapper().chatRooms;

		var participants = null;
		for (var k in chatRooms){
			participants = chatRooms[k].participants;

			if (k !== data.name){
				for (var i = 0; i < participants.length; i++){
					if (participants[i].username === data.username){
						participants.splice(i, 1);
						break;
					}
				}
			} else{
				participants.push({username: data.username, peerId: data.peerId});
			}
		}

		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}
	};

	actions["USER_LOGGED_IN"] = doUserLoggedInCb;
	actions["USER_LOGGED_OUT"] = doUserLoggedOutCb;
	actions["FORCE_LOGOUT"] = forceLogout;
	actions["RECEIVE_MESSAGE"] = receiveMessage;
	actions["ADD_USER_TO_CONVERSATION"] = addUserToConversation;
	actions["VOICE_CHAT_ROOM_CREATED"] = voiceChatRoomCreated;
	actions["CONNECT_TO_VOICE_CHAT_ROOM"] = userConnectedToChatRoom;



	return service;
}])
.controller('WebsocketCtl', function ($scope, WebsocketService){

});