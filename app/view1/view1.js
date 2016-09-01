'use strict';

angular.module('myApp.view1', ['ngRoute', 'myApp', 'ngCookies'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', 'WebsocketService', '$location', 'UserService', '$cookies', function($scope, WebsocketService, $location, UserService, $cookies) {
	var vm = this;

	vm.data = {};
	vm.data.loggedInUsersWrapper = {};
	vm.data.loggedInUsersWrapper.users = [];

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
				//write cookie
				var cookie = response.headers[0];
				val = cookie.split(';');
				val.splice(0, 1);
				var val = val.join(";");
				console.log("val = " + val);
				$cookies.put(cookie.split(';')[0].split('=')[0], cookie.split(';')[0].split('=')[1]);
				UserService.clearUserWrapper();
				UserService.getUserWrapper().user = {username: vm.data.userinfo.username}
				$location.path("/view2");
			}
		}, function(error){
			console.log("call error");
		});
	};

	console.log("View1 Ctrl created.");

	$scope.vm = vm;

}]);