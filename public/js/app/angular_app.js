'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngResource',
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'views/lobby.html', controller:'LobbyCtrl'});
    $routeProvider.when('/game/:gameId/pId/:playerId/name/:playerName', {templateUrl: 'views/game.html', controller: 'GameCtrl'});
    //$routeProvider.otherwise({redirectTo: '/'});
}]);
