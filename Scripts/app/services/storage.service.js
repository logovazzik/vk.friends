 angular.module('app')
	.service('StorageService',
    [
        '$window', function ($window) {
            this.setItem = setItem;
            this.getItem = getItem;
            this.removeItem = removeItem;


            function getItem(key, noparse) {
                var item = $window.localStorage.getItem(key);
                return item ? noparse ? item: JSON.parse(item) : null;

            }

            function removeItem(key) {
                $window.localStorage.removeItem(key);
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