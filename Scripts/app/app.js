angular.module('app', [])
    .config(['$sceProvider', 'FriendsProvider', function ($sceProvider, friendsProvider) {
        
        $sceProvider.enabled(false);
        friendsProvider.setUrls({
            serverTimeUrl: 'https://api.vk.com/method/utils.getServerTime',
            friendsUrl: 'https://api.vk.com/method/friends.get?user_id=17864153&fields=nicknamenickname,photo_200_orig,online,last_seen'
        });
    }]);

    