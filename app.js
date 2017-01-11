angular.module('app', [])
    .config(function ($sceProvider) {
        // Completely disable SCE.  For demonstration purposes only!
        // Do not use in new projects.
        $sceProvider.enabled(false);
    })
    .constant('FriendStatus',
    {
        deleted: 'DELETED',
        added: 'ADDED'
    })
    .constant('AppConfig',
    {
        storageUserKey: 'vk.friends.user.id',
        storageFriendsKey: 'vk.friends',
        dateTimeFormat: 'DD.MM.YYYY'
    })
    .controller('BaseController',
    [
        'FriendService', 'StorageService', 'AppConfig', function (friendService, storageService, config) {
            var self = this;
            this.submit = function () {
                if (this.model.userId) {
                    this.model.noUserId = false;
                    storageService.setItem(config.storageUserKey, this.model.userId);
                    fillData();
                }
              
            };

            this.model = {
                userId: null,
                statistics: null,
                noUserId : false
            };

            //17864153
            function init() {
                self.model.userId = storageService.getItem(config.storageUserKey);
                if (self.model.userId) {
                    fillData();
                } else {
                    self.model.noUserId = true;
                }
            }

            function fillData() {
                friendService.getStatistics(self.model.userId)
                      .then(function (data) {
                          self.model.statistics = data;
                      });
            }

            init();


        }
    ])
    .service('FriendService',
    [
        'Friends', 'FriendStatus', '$q', function (friendsProvider, friendStatus, $q) {

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
                        nextSnapshot[i].status = reverse ? friendStatus.deleted : friendStatus.added;
                        result.push(nextSnapshot[i]);
                    }
                }
                return result;
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
                                    date: friendsSnapshots[i].date,
                                    data: compareSnapshots(lastSnapshot.data, currentSnapshot.data, true)
                                });

                                unconcatedResult.push(
                                {
                                    date: friendsSnapshots[i].date,
                                    data: compareSnapshots(lastSnapshot.data, currentSnapshot.data)
                                });
                            }
                            lastSnapshot = friendsSnapshots[i];
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
                                    data: tmp
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


