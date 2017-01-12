angular.module('app', [])
    .config(function ($sceProvider) {
        // Completely disable SCE.  For demonstration purposes only!
        // Do not use in new projects.
        $sceProvider.enabled(false);
    })
    .constant('FriendStatusEnum',
    {
        deleted: 'DELETED',
        added: 'ADDED'
    })
    .constant('AppConfig',
    {
        storageUserKey: 'vk.friends.user.id',
        storageFriendsKey: 'vk.friends',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm'
    })
    .controller('BaseController',
    [
        'FriendService', 'StorageService', 'AppConfig', 'FriendStatusEnum', '$scope', function (friendService, storageService, config, statusEnum, $scope) {
            var self = this;
            this.submit = function () {
                if (this.model.userId) {
                    this.model.noUserId = false;
                    storageService.setItem(config.storageUserKey, this.model.userId);
                    fillData();
                }
              
            };
            this.statusEnum = statusEnum;
            this.model = {
                userId: null,
                statistics: null,
                noUserId : false
            };

            //17864153
            function init() {
                self.model.userId = 17864153 //storageService.getItem(config.storageUserKey);
                if (self.model.userId) {
                    fillData();
                } else {
                    self.model.noUserId = true;
                }
            }

            function fillData() {
                friendService.getStatistics(self.model.userId)
                      .then(function (data) {
                          self.model.filteredStatistics =  self.model.statistics = data;
                      });
            }
            function filterData(str) {
                var result = [];
                if (self.model.statistics) {
                    for (var i = 0; i < self.model.statistics.length; ++i) {
                       var filtered = self.model.statistics[i].data.filter(function(item) {
                           return (item.first_name.toLowerCase() + ' ' + item.last_name.toLowerCase()).indexOf(str.toLowerCase()) > -1;
                       });
                       if (filtered.length) {
                           var clone = angular.copy(self.model.statistics[i]);
                           clone.data = filtered;
                           result.push(clone);
                       }
                    }
                }
                self.model.filteredStatistics = result;
            }

            $scope.$watch(function() {
                return self.model.entry;
            }, function(newValue) {
                if (angular.isDefined(newValue)) {
                    filterData(newValue);
                }
            });

            init();


        }
    ])
    .service('FriendService',
    [
        'Friends', 'FriendStatusEnum', '$q', '$window', 'AppConfig', function (friendsProvider, statusEnum, $q, $window, config) {

            this.getStatistics = getStatistics;

            function compareSnapshots(prevSnapshot, nextSnapshot, reverse) {
                var exists, result = [];
                if (reverse) {
                    var _prev = prevSnapshot,
                        _next = nextSnapshot;
                    nextSnapshot = _prev;
                    prevSnapshot = _next;
                }
                for (var i = 0; i < nextSnapshot.length; ++i) {
                    exists = false;
                    for (var b = 0; b < prevSnapshot.length; ++b) {
                        if (nextSnapshot[i].uid === prevSnapshot[b].uid) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        nextSnapshot[i].status = reverse ? statusEnum.deleted : statusEnum.added;
                        result.push(nextSnapshot[i]);
                    }
                }
                return result;
            }
            function modifySnapshot(snapshot) {
                for (var j = 0; j < snapshot.data.length; ++j) {
                    snapshot.data[j].lastSeenFormattedDateTime = $window.moment(snapshot.data[j].last_seen.time * 1000).format(config.timeFormat + ' ' + config.dateFormat);
                }
                snapshot.date = $window.moment(snapshot.date * 1000).format(config.dateFormat);
              
               
            }
            function getStatistics(userId) {
                var defer = $q.defer();
                friendsProvider.getFriends(userId)
                    .then(function (data) {
                        var friendsSnapshots = data;

                        if (friendsSnapshots.length < 2) {
                            defer.resolve([]);
                            return defer.promise;
                        }

                        var unconcatedResult = [], result = [], lastSnapshot;
                        for (var i = 0; i < friendsSnapshots.length; ++i) {

                            var currentSnapshot = friendsSnapshots[i];

                            if (lastSnapshot) {
                                unconcatedResult.push(
                                {
                                    date: currentSnapshot.date,
                                    data: compareSnapshots(lastSnapshot.data, currentSnapshot.data, true)
                                });

                                unconcatedResult.push(
                                {
                                    date: currentSnapshot.date,
                                    data: compareSnapshots(lastSnapshot.data, currentSnapshot.data)
                                });
                            }
                       
                                modifySnapshot(currentSnapshot);
     
                          
                            lastSnapshot = currentSnapshot;
                        }
                        var keys = _.uniq([].map.call(unconcatedResult,
                            function (item) {
                                return item.date;
                            }));
                        for (var i = 0; i < keys.length; ++i) {
                            var tmp = [];
                            for (var j = 0; j < unconcatedResult.length; ++j) {
                                if (keys[i] === unconcatedResult[j].date) {
                                    tmp = tmp.concat(unconcatedResult[j].data);
                                }
                            }
                            if (tmp.length) {
                                result.push({
                                    date: keys[i],
                                    data: tmp,
                                    formattedDate: $window.moment(keys[i] * 1000).format(config.dateFormat)
                                });
                            }

                        }
                        defer.resolve(result);
                    });


                return defer.promise;
            }

        }
    ])
    .service('StorageService',
    [
        '$window', function ($window) {
            this.setItem = setItem;
            this.getItem = getItem;


            function getItem(key) {
                var item = $window.localStorage.getItem(key);
                return item ? JSON.parse(item) : null;

            }

            function setItem(key, data) {
                if (typeof data !== 'string') {
                    data = JSON.stringify(data);
                }
                $window.localStorage.setItem(key, data);
                return data;
            }

        }
    ])
    .provider('Friends',
        function () {
            var url = '',
                cacheableData,
                serverTime,
                snapshotExists;

            this.setUrl = function (u) {
                url = u;
            };

            function Snapshot(settings) {
                this.date = settings.date;
                this.data = settings.data;
            }

            this.$get = [
                '$http', '$q', '$window', 'AppConfig', 'StorageService',
                function ($http, $q, $window, config, storageService) {

                    function isTheSameDay(unix1, unix2) {
                        return moment.unix(unix1).isSame(moment.unix(unix2), 'day');
                    }

                    function getServerTime() {
                        return $http.jsonp('https://api.vk.com/method/utils.getServerTime')
                            .then(function (response) {
                                debugger;
                                return response.data.response;
                            });
                    }

                    return {
                        getFriends: function getFriends(userId) {
                            var defer = getFriends.defer = $q.defer();
                            (serverTime ? $q.when(serverTime) : getServerTime()).then(function (data) {
                                serverTime = data;
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

                                    if ((storageData = storageService.getItem(config.storageFriendsKey))) {

                                        if ((storageData = storageData[userId])) {
                                            snapshotExists = false;
                                            for (var i = 0; i < storageData.length; ++i) {
                                                if (isTheSameDay(storageData[i].date, serverTime)) {
                                                    snapshotExists = true;
                                                    break;
                                                }
                                            }
                                            if (snapshotExists) {
                                                defer.resolve(cacheableData = storageData);
                                                return defer.promise;
                                            }

                                        }
                                    }


                                    getFriends.inProcess = true;
                                    $http
                                        .jsonp('https://api.vk.com/method/friends.get?user_id=17864153&fields=nicknamenickname,photo_200_orig,online,last_seen')
                                        .then(function (response) {
                                            var data = storageService.getItem(config.storageFriendsKey);

                                            data = data ? data : {};
                                            data[userId] = data[userId] || [];
                                            debugger;
                                            data[userId].push(new Snapshot({
                                                date: serverTime,
                                                data: response.data.response
                                            }));

                                            storageService.setItem(config.storageFriendsKey, data);

                                            defer.resolve(cacheableData = data[userId]);
                                        })
                                        .finally(function () {
                                            getFriends.inProcess = false;
                                        });
                                });

                            return defer.promise;
                        }

                    }

                }
            ];
        });




