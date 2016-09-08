'use strict';

angular.module('myApp.voice', ['ngRoute'])

.directive('voice', ['UserService', 'WebsocketService', 'VoiceService', function (UserService, WebsocketService, VoiceService) {
        return {
            restrict: "E",
            templateUrl: "voice/voice.html",
            controllerAs: "vm",
            controller: voiceCtrl
        };


	function voiceCtrl($scope, UserService, WebsocketService) {
		var vm = this;

        vm.data = {};

        vm.data.voiceWrapper = VoiceService.getVoiceWrapper();

        vm.errors = {};
        vm.events = {};

        WebsocketService.getVoiceChatRooms().then(function(response){
            if (response.error > 0){
                console.log("Error fetching voice chat rooms");
            } else{
                console.log("Fetched voice chat rooms");
                var roomMap = JSON.parse(response.message);
                var roomList = [];
                for (var k in roomMap){
                    roomList.push(roomMap[k]);
                }
                vm.data.voiceWrapper.chatRooms = roomMap;
            }

        });

        vm.events.createVoiceChatRoom = function(name){
            vm.errors.voiceChatRoomCreationError = false;
            WebsocketService.createVoiceChatRoom(name).then(function(response){
                vm.events.chatRoomCreationInProgress = false;
                vm.data.showCreateChatRoomModal = false;
                if (response.error > 0){
                    vm.errors.voiceChatRoomCreationError = true;
                } else{
                    console.log("Chat room created.");
                }
            });
        };

		$scope.vm = vm;
	};

}]);