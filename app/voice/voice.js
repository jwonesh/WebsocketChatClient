'use strict';

angular.module('myApp.voice', ['ngRoute'])

.directive('voice', ['UserService', 'WebsocketService', function (UserService, WebsocketService) {
        return {
            restrict: "E",
            templateUrl: "voice/voice.html",
            controllerAs: "vm",
            controller: voiceCtrl
        };


	function voiceCtrl($scope, UserService, WebsocketService) {
		var vm = this;

		$scope.vm = vm;
	};

}]);