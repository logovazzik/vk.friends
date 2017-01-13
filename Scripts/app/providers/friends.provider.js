angular.module('app')
	.provider('Friends',
        function () {
            var urls = {
				 serverTimeUrl:null,
            friendsUrl: null
			},
                cacheableData,
                serverTime,
                snapshotExists;

            this.setUrls = function (config) {
				angular.extend(urls, config);
                
            };

            function Snapshot(settings) {
                this.date = settings.date;
                this.data = settings.data;
            }

            this.$get = [
                '$http', '$q', '$window', 'Config', 'StorageService',
                function ($http, $q, $window, config, storageService) {

                    function isTheSameDay(unix1, unix2) {
                        return moment.unix(unix1).isSame(moment.unix(unix2), 'day');
                    }

                    function getServerTime() {
                        return $http.jsonp(urls.serverTimeUrl)
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
                                        .jsonp(urls.friendsUrl)
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


