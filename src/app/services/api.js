/**
 * @file src/app/services/api.js
 * @author Shahidh K Muhammed <shahidhkmuhammed@gmail.com>
 * @author Chinni Chaitanya <chchaitanya95@gmail.com>
 * Date: 20.06.2017
 * Last Modified: 26.07.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
    .service('api', api);

  /** @ngInject */
  function api($q, $http, $log) {
    this.user = undefined;
    this.ip = undefined;
    this.mac = undefined;
    this.publicIp = undefined;
    this.internet = false;
    this.intranet = true;
    var user = undefined;
    var hostname = "dashboard.iitm.ac.in";
    var scheme = 'http';
    var endpoints = {
      'auth': scheme + '://auth.' + hostname,
      'data': scheme + '://data.' + hostname,
      'net': scheme + '://api.' + hostname + ':8080'
    }

    this.isSignedIn = function() {
      var _this = this;
      var deferred = $q.defer();
      if (user) {
        deferred.resolve(user);
      } else {
        $http.get(endpoints.auth + '/user/account/info').then(function(response){
          user = response.data;
          _this.user = response.data;
          deferred.resolve(response.data);
        }).catch(function(response){
          deferred.reject(response.data.message);
          $log.error(response);
        });
      }
      return deferred.promise;
    };

    this.login = function(username, password) {
      var _this = this;
      var deferred = $q.defer();
      $http.post(endpoints.auth + '/login', {username: username, password: password}).then(
        function(response) {
          user = response.data;
          _this.user = response.data;
          console.log(response.data);
          deferred.resolve(response.data);
        }
      ).catch(function(response){
          deferred.reject(response.data.message);
          $log.error('from service', response);
      });
      return deferred.promise;
    };

    this.logout = function() {
      var deferred = $q.defer();
      $http.get(endpoints.auth + '/user/logout').then(
        function(response) {
          $log.info(response.data);
          user = undefined;
          deferred.resolve(response.data);
        }
      ).catch(function(response){
        deferred.reject(response.data.message);
        $log.error('from service', response);
      });
      return deferred.promise;
    };

    this.query = function(type, args){
      var defer = $q.defer(),
          query_params = angular.toJson({
            "type": type,
            "args": args
          });

      $http.post(endpoints.data + '/v1/query', query_params)
        .success(function(data){
          defer.resolve(data);
        })
        .error(function(data){
          defer.reject(data)
        })
      return defer.promise;
    };

    this.userProfile = function() {
      var _this = this;
      return this.query('select', {
        table: 'user',
        columns: ['id', 'username', 'full_name', 'email', 'mobile', 'iitm_id'],
        where: {id: _this.user.hasura_id}
      });
    };

    this.getIp = function() {
      var _this = this;
      var defer = $q.defer();
      $http.get("http://api.dashboard.iitm.ac.in/v1/device/ipv4_mac")
        .success(function(data){
          _this.ip = data.ipv4;
          _this.mac = data.mac;
          _this.intranet = true;
          defer.resolve(data);
        })
        .error(function(data){
          _this.intranet = false;
          defer.reject(data)
        })
      // $http.get(endpoints.net + '/get_ip')
      //   .success(function(data){
      //     _this.ip = data.ipv4;
		    //   _this.intranet = true;
      //     defer.resolve(data);
      //   })
      //   .error(function(data){
  		  //   _this.intranet = false;
      //     defer.reject(data)
      //   })
      return defer.promise;
    };

    this.getPublicIp = function() {
      var _this = this;
      var defer = $q.defer();
      $http.get(scheme + '://ipinfo.io', {withCredentials: false})
        .success(function(data){
          _this.publicIp = data.ip;
		      _this.internet = true;
          defer.resolve(data);
        })
        .error(function(data){
		      _this.internet = false;
          defer.reject(data)
        })
      return defer.promise;
    };

    this.authorizeDevice = function(args){
      var _this = this;
      var defer = $q.defer(),
          query_params = angular.toJson(args);

      // console.log(args.id);
      if(args.validity_option == "0" || args.validity_option == "1"){
        // console.log("Hello");
        var data = {"validity": args.validity_option};
        $http.post(endpoints.net + '/authorize', data)
          .success(function(data){
            defer.resolve(data);
          })
          .error(function(data){
            defer.reject(data)
          })
      }
      else{
        // console.log("Bye");
        var insert_data = [{
          mac: "42323",
          reason: "just like that",
        }]
        var data = {
          type: "insert",
          args: {
            table: "extended_authz",
            objects: insert_data
          }
        };
        $http.post(endpoints.data + "/v1/query", data)
        .success(function(data){
          defer.resolve(data);
        })
        .error(function(data){
          defer.reject(data)
        })
      }      
      return defer.promise;
    };

    this.registerDevice = function(args){
      var _this = this;
      var defer = $q.defer(),
          query_params = angular.toJson(args);

      var insert_data = [{
        user_id: user.hasura_id,
        mac: _this.mac,
        nick: args.nick
      }]
      // console.log(insert_data);
      var data = {
        type: "insert",
        args: {
          table: "device",
          objects: insert_data
        }
      };
      $http.post(endpoints.data + "/v1/query", data)
        .success(function(data){
          defer.resolve(data);
        })
        .error(function(data){
          defer.reject(data)
        })
      return defer.promise;
    };

    this.removeDevice = function(args){
      var _this = this;
      var defer = $q.defer(),
          query_params = angular.toJson(args);

      console.log(query_params);

      var data = {
        type: "delete",
        args: {
          table: "device",
          where: {"mac": _this.mac}
        }
      };

      $http.post(endpoints.data + "/v1/query", data)
        .success(function(data){
          defer.resolve(data);
        })
        .error(function(data){
          defer.reject(data)
        })
      return defer.promise;
    };

    this.approveRequest = function(args){
      var _this = this;
      var defer = $q.defer(),
          query_params = angular.toJson(args);

      $http.post(endpoints.net + '/approve_request', query_params)
        .success(function(data){
          defer.resolve(data);
        })
        .error(function(data){
          defer.reject(data)
        })
      return defer.promise;
    };

    this.rejectRequest = function(args){
      var _this = this;
      var defer = $q.defer(),
          query_params = angular.toJson(args);

      $http.post(endpoints.net + '/reject_request', query_params)
        .success(function(data){
          defer.resolve(data);
        })
        .error(function(data){
          defer.reject(data)
        })
      return defer.promise;
    };        
  }

})();
