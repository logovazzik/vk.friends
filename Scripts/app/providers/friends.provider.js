angular.module('app')
	.provider('Friends',
        function () {
            var urls = {
                    serverTimeUrl: null,
                    friendsUrl: null
                },
                cacheableData,
                serverTime;

            this.setUrls = function (config) {
				angular.extend(urls, config);
                
            };

            this.$get = [
                '$http', '$q', '$window', 'Config', 'StorageService',
                function ($http, $q, $window, config, storageService) {

                    function isTheSameDay(unix1, unix2) {
                        return moment.unix(unix1).isSame(moment.unix(unix2), 'day');
                    }

                    function getServerTime() {
                        return $http.jsonp(urls.serverTimeUrl)
                            .then(function (response) {
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
                                  
                                    if (getFriends.inProcess) {
                                        return getFriends.defer.promise;
                                    }


                                    if (cacheableData) {
                                        defer.resolve(cacheableData);
                                        return defer.promise;
                                    }

                                    


                                    getFriends.inProcess = true;
                                    $http
                                        .jsonp(urls.friendsUrl)
                                        .then(function (response) {

                                            var storageData = storageService.getItem(config.storageFriendsKey),
                                                snapshotExists = false;


                                            storageData = storageData || {};
                                            storageData[userId] = storageData[userId] || [];

                                            if (storageData[userId].length === 0) {
                                                storageData[userId].push({
                                                    data: response.data.response
                                                });
                                            }

                                            for (var i = 0; i < storageData[userId].length; ++i) {
                                                if (isTheSameDay(storageData[userId][i].date, serverTime)) {
                                                    snapshotExists = true;
                                                    break;
                                                }
                                            }
                                            var snapshot = {
                                                date: serverTime,
                                                data: response.data.response
                                            };
                                            
                                            if (snapshotExists) {
                                                storageData[userId][i] = snapshot;
                                            } else {
                                                storageData[userId].push(snapshot);
                                            }


                                           

                                            storageService.setItem(config.storageFriendsKey, storageData);

                                            defer.resolve(cacheableData = storageData[userId]);
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


