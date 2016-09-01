'use strict';

angular.module('myApp')

.factory('WebsocketService', ['$q', 'UserService', '$rootScope', '$location', function($q, UserService, $rootScope, $location) {
	var service = {};
	var currentCallbackId = 0;
	var callbacks = {};

	var readyWrapper = {};

	var NO_CONNECTION = -1;

	var ws = null;

	var initWs = function(){
		ws = new WebSocket("ws://localhost:8001");
		ws.onopen = function(){
			if (!!readyWrapper.defer){
				readyWrapper.defer.resolve();
			} else{
				ws.send("{}");
			}
		};

		ws.onmessage =  function(response){
			console.log("Received message: " + JSON.stringify(response.data));
			resolveCallback(response);
		};

		ws.onerror = function(error){
			console.log("error: " + error);
		};

	};

	initWs();

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

	//angular service calls

	service.login = function(username, password){
		var data = {username: username, password: password};
		return defer(data, "LOGIN");
	};

	service.testMessage = function(message){
		var data = {message: 'test'};
		return defer(data, "TEST");
	};

	service.getLoggedInUsers = function(){
		return defer({}, "GET_LOGGED_IN_USERS");
	};

	service.sendMessage = function(username, message){
		var data = {username: username, message: message};
		return defer(data, "SEND_MESSAGE");
	};

	var actions = {};

	var doUserLoggedInCb = function(data){
		UserService.getUserWrapper().loggedInUsers.push(data);
		if(!$rootScope.$$phase) {
			$rootScope.$apply()
		}
	};

	var doUserLoggedOutCb = function(data){
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
			if (UserService.getUserWrapper().conversations[i].username === from){
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
			newConvo.history.push(data);
			UserService.getUserWrapper().conversations.push(newConvo);
		}

		if(!$rootScope.$$phase) {
			$rootScope.$apply();
		}

	};

	actions["USER_LOGGED_IN"] = doUserLoggedInCb;
	actions["USER_LOGGED_OUT"] = doUserLoggedOutCb;
	actions["FORCE_LOGOUT"] = forceLogout;
	actions["RECEIVE_MESSAGE"] = receiveMessage;



	return service;
}])
.controller('WebsocketCtl', function ($scope, WebsocketService){

});