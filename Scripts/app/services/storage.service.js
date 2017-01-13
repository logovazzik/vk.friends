 angular.module('app')
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
    ]);