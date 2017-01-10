angular.module('app', []).config(function ($sceProvider) {
    // Completely disable SCE.  For demonstration purposes only!
    // Do not use in new projects.
    $sceProvider.enabled(false);
}).constant('FriendStatus', {
    deleted: 'DELETED',
    added : 'ADDED'
    })
    .constant('appConfig',
    {
        storageKey: 'vk.friends',
        dateTimeFormat: 'DD.MM.YYYY'
    })
    .controller('BaseController', ['FriendService', function (FriendService) {
        FriendService.getFriends(17864153).then(function (data) {
            debugger;
        });
    }]).
    service('FriendService', ['Friends', 'FriendStatus', '$q', function (friendsProvider, friendStatus, $q) {
        var friends;
        this.getFriends = getFriends;
        function getFriends(id) {
            var defer = $q.defer();
            friendsProvider.getFriends(id).then(function (data) {
                friends = data;
               

                function compare(prevFragment, nextFragment, reverse) {
                    var exists, result = [];
                    if (reverse) {
                        var _prev = prevFragment,
                            _next = nextFragment,
                        nextFragment = _prev;
                        prevFragment = _next;
                    }
                    for (var i = 0; i<nextFragment.length; ++i) {
                        exists = false
                        for (var b = 0; b< prevFragment.length; ++b) {
                            if (nextFragment[i].uid === prevFragment[b].uid) {
                                exists = true;
                                break;
                            }
                        }
                        if (!exists) {
                            nextFragment[i].status = reverse ? friendStatus.deleted : friendStatus.added;
                            result.push(nextFragment[i]);
                        }
                    }
                    return result;
                }
                if (friends.length === 1 || friends.length === 0) {
                    defer.resolve([]);
                    return defer.promise;
                }
                var temp = [], last;
                for (var i = 0; i < friends.length; ++i) {
                    if (last) {
                        temp.push(
                        {
                            time: friends[i].fragmentUnixTime,
                            diff: compare(last.data, friends[i].data, true)
                        });

                        temp.push(
                      {
                          time: friends[i].fragmentUnixTime,
                          diff: compare(last.data, friends[i].data)
                      });
                    }
                    last = friends[i];
                }
                var dateKeys = _.uniq([].map.call(temp, function(item) {
                    return item.time;
                }));
                dateKeys.forEach(function(item, key) {
                    temp.filter(function(item2) {
                        return item2.time === item;
                    })
                })
                defer.resolve(temp)
            });

            return defer.promise;
        }
     
    }])
	.service('StorageService', ['$window', function ($window) {
	    this.setItem = setItem;
	    this.getItem = getItem;
		
		
	    function getItem(key){
			
	        var item = $window.localStorage.getItem(key);
			
			
	        return item? JSON.parse(item): null;
			
	    }
		
	    function setItem(key, data) {
	        debugger;
	        if(typeof data !== 'string'){
	            data = JSON.stringify(data);	
	        }
	        $window.localStorage.setItem(key, data);
	        return data;
	    }
		
	}])
    .provider('Friends', function () {
        var url = '',
            cacheableData,
            serverUnixTime,

            fragmentExists;

        this.setUrl = function (u) {
            url = u;
        };
        function Fragment(settings) {
            this.fragmentUnixTime = settings.fragmentUnixTime;
            this.data = settings.data;
        }
        this.$get = ['$http', '$q', '$window', 'appConfig', 'StorageService', function ($http, $q, $window, config, storageService) {
            function insertIntoCache() {

            }

            function isTheSameDay(unix1, unix2) {
                return moment.unix(unix1).isSame(moment.unix(unix2), 'day')
            }

            function getServerTime() {
                return $http.jsonp('https://api.vk.com/method/utils.getServerTime')
                    .then(function (response) {
                        return response.data.response;
                    });
            }

            return {
                getFriends: function getFriends(userId) { 
                    var defer = getFriends.defer = $q.defer();
                    (serverUnixTime ? $q.when(serverUnixTime) : getServerTime()).then(function (data) {
                        serverUnixTime = data;

                    })
                        .then(function () {
                            var storageData;
                            if (getFriends.inProcess) {
                                return getFriends.defer.promise;
                            }
                         

                            if (cacheableData) {
                                defer.resolve(cacheableData);
                                return defer.promise;
                            }

                            if ((storageData = storageService.getItem(config.storageKey))) {
                                
                                if ((storageData = storageData[userId])) {
                                    fragmentExists = false;
                                    for (var i = 0; i < storageData.length; ++i) {
                                        if (isTheSameDay(storageData[i].fragmentUnixTime, serverUnixTime)) {
                                            fragmentExists = true;
                                            break;
                                        }
                                    }
                                    if (fragmentExists) {
                                        defer.resolve(cacheableData = storageData);
                                        return defer.promise;
                                    }

                                }
                            }


                            getFriends.inProcess = true;
                            $http.jsonp('https://api.vk.com/method/friends.get?user_id=17864153&fields=nickname')
                                .then(function (response) {
                                    var data = storageService.getItem(config.storageKey);
                                   
                                    data = data ? data : {};
                                    data[userId] = data[userId] || [];

                                    data[userId].push(new Fragment({
                                        fragmentUnixTime: serverUnixTime,
                                        data: response.data.response
                                    }));

                                    storageService.setItem(config.storageKey, data);
                                    
                                    defer.resolve(cacheableData = data[userId]);
                                })
                                .finally(function () {
                                    getFriends.inProcess = false;
                                });
                        });

                    return defer.promise;
                }

            }

        }];
    });