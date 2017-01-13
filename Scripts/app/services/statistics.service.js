angular.module('app').service('StatisticsService',
    [
        'Friends', 'StatusEnum', '$q', '$window', 'Config', function (friendsProvider, statusEnum, $q, $window, config) {

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
    ]);