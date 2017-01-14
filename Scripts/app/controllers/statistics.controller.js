 angular.module('app').controller('StatisticsController',
    [
        'StatisticsService', 'StorageService', 'Config', 'StatusEnum', '$scope', 'Utils', '$window', function (friendService, storageService, config, statusEnum, $scope, utils, $window) {
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

            function init() {
                debugger;
                self.model.userId = utils.q2ajx($window.location.search.replace(/^\?/, ""))[config.userKeyUrl] || storageService.getItem(config.storageUserKey);

                if (self.model.userId) {
                    storageService.setItem(config.storageUserKey, self.model.userId);
                    fillData();
                } else {
                    self.model.noUserId = true;
                }
            }

            function fillData() {
                friendService.getStatistics(self.model.userId)
                    .then(function(data) {
                        self.model.filteredStatistics = self.model.statistics = data;
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
    ]);