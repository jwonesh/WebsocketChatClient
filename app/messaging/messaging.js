'use strict';

angular.module('myApp.messaging', ['ngRoute'])

.directive('scrollBottom', function () {
  return {
    scope: {
      scrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('scrollBottom', function (newValue) {
        if (newValue)
        {
          $(element).scrollTop($(element)[0].scrollHeight);
        }
      });
    }
  }
})

.directive('messaging', ['UserService', 'WebsocketService', function (UserService, WebsocketService) {
        return {
            restrict: "E",
            templateUrl: "messaging/messaging.html",
            controllerAs: "vm",
            controller: messagingCtrl
        };


	function messagingCtrl($scope, UserService, WebsocketService) {
		var vm = this;

		vm.data = {};
		vm.data.userWrapper = UserService.getUserWrapper();
		vm.data.userWrapper.loggedInUsers = [];
		vm.data.sendEnabled = true;
		vm.data.userWrapper.conversations = [];
		vm.data.selectedConversationWrapper = {};



		vm.data.getParticipants = function(participants){
			var str = "";
			for (var i = 0; i < participants.length; i++){
				if (participants[i] !== vm.data.userWrapper.user.username){
					str += participants[i];
					str += ",";
				}
			}

			str = str.substring(0, str.length - 1);
			return str;
		}

		$scope.$watch('vm.data.userWrapper.conversations.length', function(newVal, oldVal){
			if (newVal === 1 && oldVal === 0){
				vm.data.selectedConversationWrapper.conversation = vm.data.userWrapper.conversations[0];
			}
		});

		vm.display = {};

		vm.display.formatMessageText = function(message){
			if (message.from === ''){
				return message.message;
			} else{
				return message.from + ": " + message.message;
			}
		};

		vm.events = {};

		vm.events.addUser = function(conversation){
			vm.data.conversationForAdding = conversation;
			vm.data.conversationCandidateList = [];
			for (var i = 0; i < vm.data.userWrapper.loggedInUsers.length; i++){
				var userInConversation = false;
				for (var j = 0; j < conversation.participants.length; j++){
					if (vm.data.userWrapper.loggedInUsers[i].username === conversation.participants[j]){
						userInConversation = true;
						break;
					}		
				}
				
				if (!userInConversation){
					vm.data.conversationCandidateList.push(vm.data.userWrapper.loggedInUsers[i]);
				}
			}
			vm.data.showAddUserModal = true;
		};

		vm.events.startChat = function(user){
			for (var i = 0; i < vm.data.userWrapper.conversations.length; i++){
				var convo = vm.data.userWrapper.conversations[i];
				if (convo.username === user.username && convo.participants.length === 1){
					return;
				}
			}
			WebsocketService.createConversation([user.username, vm.data.userWrapper.user.username]).then(function(response){
				var conversation = {};
				conversation.username = user.username;
				conversation.participants = [user.username];
				conversation.history = [];

				var id = JSON.parse(response.message).id;
				conversation.id = id;
				vm.data.userWrapper.conversations.push(conversation);
				vm.data.selectedUser = user;

				if (!$scope.$$phase){
					$scope.$apply();
				}
			});

		};

		vm.events.submitMessage = function(){
			var m = String(vm.data.chatTo);
			vm.data.chatTo = "";
			vm.data.selectedConversationWrapper.conversation.history.push({from: vm.data.userWrapper.user.username, message: m,})
			WebsocketService.sendMessage(vm.data.selectedConversationWrapper.conversation.username, m, vm.data.selectedConversationWrapper.conversation.id).then(function(response){
				console.log("message sent");
			});
		};

		vm.events.selectConversation = function(conversation){
			vm.data.selectedConversationWrapper.conversation = conversation;
		};

		vm.events.addUserToConversation = function(username){
			var getConvo = function(c){
				return function(){
					return c;
				}
			}(vm.data.conversationForAdding);
			WebsocketService.addUserToConversation(username, vm.data.conversationForAdding, vm.data.userWrapper.user.username).then(function(response){
				var convo = getConvo();
				convo.participants.push(username);
				console.log("user added");
				convo.history.push({from: "", message: username + " added to the conversation."});
				vm.data.showAddUserModal = false;
			});
		};

		WebsocketService.getLoggedInUsers().then(function(response){
			var users = JSON.parse(response.message);
			vm.data.userWrapper.loggedInUsers = users;
		});

		$scope.vm = vm;
	};

}]);