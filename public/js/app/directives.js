'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersionDirective', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);
