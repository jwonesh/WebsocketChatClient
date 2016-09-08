'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'myApp.login',
  'myApp.main',
  'myApp.messaging',
  'myApp.voice',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/login'});
}]);
