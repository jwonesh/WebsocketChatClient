'use strict';

angular.module('myApp.login', ['ngRoute', 'myApp', 'ngCookies'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: 'login/login.html',
    controller: 'LoginCtrl'
  });
}])

.controller('LoginCtrl', ['$scope', 'WebsocketService', '$location', 'UserService', '$cookies', function($scope, WebsocketService, $location, UserService, $cookies) {
	var vm = this;

	vm.data = {};
	vm.data.loggedInUsersWrapper = {};
	vm.data.loggedInUsersWrapper.users = [];

	vm.data.register = {};

	vm.data.userinfo = {};

	vm.events = {};
	vm.errors = {};

	function generateUUID(){
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		return uuid;
	}

	vm.events.login = function(){

		var peerId = generateUUID();
		var peer = new Peer(peerId, {host: 'localhost', port: 9000, path: '/chat'});
		//TODO: Check if id is taken with peer.on('unavailable-id', ...)
		//TODO: Check for general errors
		peer.on('open', function(){
			WebsocketService.login(vm.data.userinfo.username, vm.data.userinfo.password, peerId).then(function(response){
				console.log("call completed");
				if (response.error > 0){
					vm.errors.loginError = true;
				} else{
					//go to main view
					UserService.clearUserWrapper();
					UserService.getUserWrapper().user = {username: vm.data.userinfo.username};
					//TODO: change the config values to read from cebntralized config
					//TODO: handle error
					
					UserService.getUserWrapper().user.peer = peer;

					//connect to peering server
					$location.path("/main");
				}
			}, function(error){
				console.log("call error");
			});
		});

		peer.on('error', function(err){
			vm.errors.loginError = true;
		})
	};

	vm.events.register = function(){
		vm.data.registerComplete = false;
		WebsocketService.register(vm.data.register.username, vm.data.register.password).then(function(response){
			vm.data.registerComplete = true;
			vm.data.showRegisterModal = false;
			if (response.error > 0){
				vm.errors.registerError = true;
			}
		}, function(response){
			vm.errors.registerError = true;
			vm.data.registerComplete = true;
		});
	};

	$scope.vm = vm;

}]);