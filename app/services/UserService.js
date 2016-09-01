'use strict';

angular.module('myApp')

.factory('UserService', ['$q', function($q) {
	var service = {};

	service.getUserWrapper = getUserWrapper;
	service.clearUserWrapper = clearUserWrapper;

	var userWrapper = {};
	userWrapper.conversations = [];

	function getUserWrapper(){
		return userWrapper;
	}

	function clearUserWrapper(){
		for (var k in userWrapper){
			userWrapper[k] = null;
		}
	}

	return service;
}])
.controller('UserServiceCtl', function ($scope, UserService){

});