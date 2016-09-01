'use strict';

angular.module('myApp.view2', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view2', {
    templateUrl: 'view2/view2.html',
    controller: 'View2Ctrl'
  });
}])

.controller('View2Ctrl', ['$scope', 'UserService', 'WebsocketService', function($scope, UserService, WebsocketService) {
	var vm = this;

	vm.data = {};
	vm.data.userWrapper = UserService.getUserWrapper();
	vm.data.userWrapper.loggedInUsers = [];
	vm.data.sendEnabled = true;
	vm.data.userWrapper.conversations = [];
	vm.data.selectedConversationWrapper = {};

	$scope.$watch('vm.data.userWrapper.conversations.length', function(newVal, oldVal){
		if (newVal === 1 && oldVal === 0){
			vm.data.selectedConversationWrapper.conversation = vm.data.userWrapper.conversations[0];
		}
	});

	vm.events = {};
	vm.events.startChat = function(user){
		var conversation = {};
		conversation.username = user.username;
		conversation.history = [];
		for (var i = 0; i < vm.data.userWrapper.conversations.length; i++){
			var convo = vm.data.userWrapper.conversations[i];
			if (convo.username === user.username){
				return;
			}
		}
		vm.data.userWrapper.conversations.push(conversation);
		vm.data.selectedUser = user;
	};

	vm.events.submitMessage = function(){
		var m = String(vm.data.chatTo);
		vm.data.chatTo = "";
		vm.data.selectedConversationWrapper.conversation.history.push({from: vm.data.userWrapper.user.username, message: m})
		WebsocketService.sendMessage(vm.data.selectedConversationWrapper.conversation.username, m).then(function(response){
			console.log("message sent");
		});
	};

	vm.events.selectConversation = function(conversation){
		vm.data.selectedConversationWrapper.conversation = conversation;
	};

	WebsocketService.getLoggedInUsers().then(function(response){
		var users = JSON.parse(response.message);
		vm.data.userWrapper.loggedInUsers = users;
	});

	$scope.vm = vm;
}]);