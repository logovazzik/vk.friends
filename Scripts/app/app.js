angular.module('app', [])
    .config([
        '$sceProvider', 'FriendsProvider', function($sceProvider, friendsProvider) {

            $sceProvider.enabled(false);
            friendsProvider.setUrls({
                serverTimeUrl: 'https://api.vk.com/method/utils.getServerTime',
                friendsUrl: 'https://api.vk.com/method/friends.get?user_id={userId}&fields=nicknamenickname,photo_200_orig,online,last_seen'
            });
        }
    ]).run([
       'StorageService', 'Config', '$window', function (storageService, config, $window) {

            var defaultVersion = '1.0',
                currentVersion = $window.APP_VERSION || defaultVersion,
                parsedVersion = parseVersion(currentVersion),
                storageVersion = storageService.getItem(config.storageVersionKey);

            if (!storageVersion || parseVersion(storageVersion) !== parsedVersion) {
                updateStorage();
            } 
          
           function updateStorage() {
               storageService.setItem(config.storageVersionKey, currentVersion);
               storageService.removeItem(config.storageFriendsKey);
               storageService.removeItem(config.storageUserKey);
           }
           function parseVersion(version) {
               return +(version.toString().replace('\.', ''));
           }
        }
    ]);

    