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

	vm.events.login = function(){
		WebsocketService.login(vm.data.userinfo.username, vm.data.userinfo.password).then(function(response){
			console.log("call completed");
			if (response.error > 0){
				vm.errors.loginError = true;
			} else{
				//go to main view
				UserService.clearUserWrapper();
				UserService.getUserWrapper().user = {username: vm.data.userinfo.username}
				$location.path("/main");
			}
		}, function(error){
			console.log("call error");
		});
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