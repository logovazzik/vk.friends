angular.module('app').factory('Utils', function () {
        return {
            ajx2q: ajx2q,
            q2ajx: q2ajx,
            applyTemplate: applyTemplate
        }

        function isFunction(obj) {
            return Object.prototype.toString.call(obj) === '[object Function]';
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        }

        function ajx2q(qa) {
            var query = [],
                enc = function (str) {
                    if (window._decodeEr && _decodeEr[str]) {
                        return str;
                    }
                    try {
                        return encodeURIComponent(str);
                    } catch (e) {
                        return str;
                    }
                };

            for (var key in qa) {
                if (qa[key] == null || isFunction(qa[key])) continue;
                if (isArray(qa[key])) {
                    for (var i = 0, c = 0, l = qa[key].length; i < l; ++i) {
                        if (qa[key][i] == null || isFunction(qa[key][i])) {
                            continue;
                        }
                        query.push(enc(key) + '[' + c + ']=' + enc(qa[key][i]));
                        ++c;
                    }
                } else {
                    query.push(enc(key) + '=' + enc(qa[key]));
                }
            }
            query.sort();
            return query.join('&');
        }

        function q2ajx(qa) {
            if (!qa) return {};
            var query = {},
                dec = function (str) {
                    try {
                        return decodeURIComponent(str);
                    } catch (e) {
                        window._decodeEr = window._decodeEr || {};
                        _decodeEr[str] = 1;
                        return str;
                    }
                };
            qa = qa.split('&');
            qa.forEach(function (a, i) {
                var t = a.split('=');
                if (t[0]) {
                    if (t[1]) {
                        var v = dec(t[1] + '');
                        if (t[0].substr(t.length - 2) == '[]') {
                            var k = dec(t[0].substr(0, t.length - 2));
                            if (!query[k]) {
                                query[k] = [];
                            }
                            query[k].push(v);
                        } else {
                            query[dec(t[0])] = v;
                        }
                    } else {
                        query[dec(t[0])] = t[1];
                    }

                }
            });
            return query;
        }
        function applyTemplate(template, replacements) {
            return template.replace(/{(\w+)}/g, function (e, n) {
                return undefined !== replacements[n] ? encodeURIComponent(replacements[n]) : "";
            });
        }
    });