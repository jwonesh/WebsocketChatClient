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

        vm.events.connectToRoom = function(name){
            vm.errors.voiceChatRoomConnectionError = false;
            WebsocketService.connectToVoiceChatRoom(name).then(function(response){
                vm.events.chatRoomConnectionInProgress = false;
                if (response.error > 0){
                    vm.errors.voiceChatRoomConnectionError = true;
                } else{
                    //update UI
                    var participants = null;
                    for (var k in  vm.data.voiceWrapper.chatRooms){
                        var room = vm.data.voiceWrapper.chatRooms[k];

                        if (k !== name.toLowerCase()){
                            for (var i = 0; i < room.participants.length; i++){
                                if (room.participants[i].username === UserService.getUserWrapper().user.username){
                                    room.participants.splice(i, 1);
                                    break;
                                }
                            }
                        } else{
                            room.participants.push({username: UserService.getUserWrapper().user.username, peerId: UserService.getUserWrapper().user.peerId});
                        }
                    }
                    console.log("Connected to room.");
                }
            });
        };

		$scope.vm = vm;
	};

}]);