'use strict';

angular.module('myApp.main', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/main', {
    templateUrl: 'main/main.html',
    controller: 'MainCtrl'
  });
}])

.controller('MainCtrl', ['$scope', 'UserService', function($scope, UserService) {
	var vm = this;

	vm.data = {};
	vm.data.userWrapper = UserService.getUserWrapper();

	vm.tabs = {};
	vm.tabs.selected = 0;

	$scope.vm = vm;
}]);