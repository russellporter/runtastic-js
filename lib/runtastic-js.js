/*
The MIT License (MIT)

Copyright (c) 2016 Johannes Terhürne <johannes@terhuerne.org>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


var https = require('https'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    liburl = require('url'),
    util = require('util');

var runtasticJs = function(username, password) {

  // Public Variables
  this.username = false;
  this.password = false;
  this.user = null;
  this.weight = null;
  this.heartrate = null;
  this.activities = null;
  this.timeframe = {
    'from': false,
    'to': false
  };


  // Private Variables
  var authenticityToken = '';
  var cookie = [];
  var paths = {
    'login': 'https://www.runtastic.com/en/d/users/sign_in.json',
    'logout': 'https://www.runtastic.com/en/d/users/sign_out',
    'sessions': 'https://www.runtastic.com/en/users/%s/sport-sessions',
    'sessionsApi': 'https://www.runtastic.com/api/run_sessions/json',
    'sessionDetail': 'https://hubs.runtastic.com/samples/v2/users/%d/samples/%s?include=trace_collection%2Cneighbourhood%2Ccity%2Ccountry%2Csport_type%2Ccreation_application%2Czones'
  };


  // Public Functions
  this.fetchAll = function(callback) {

  }

  this.fetchHeartrate = function(limit, callback) {

  }

  this.fetchSessions = function(limit, callback) {

  }

  this.fetchSessionDetail = function(id, callback) {

  }

  this.fetchWeight = function(limit, callback) {

  }

  this.login = function(callback) {
    if (this.username && this.password) {
      cookie = [];
      var postData = querystring.stringify({
        'user[email]': this.username,
        'user[password]': this.password,
        'authenticity_token': authenticityToken
      });
      requestUrl(paths['login'], 'post', postData, function(err, response) {
        if ('error' in response) {
          if (typeof(callback) == 'function') {
            callback({'code': 403,'message': 'Invalid Runtastic-Credentials.'}, false);
          } else {
            return false;
          }
        } else {
          var html = cheerio.load(response['update']);
          authenticityToken = html('input[name=authenticity_token]').attr('value');
          this.user = response['current_user'];
          if (typeof(callback) == 'function') {
            callback(null, this.user);
          } else {
            return this.user;
          }
            /*runtasticLib.fetchActivityTypes(from, to, function(activities){
              if(authenticityToken && user) {
                if (typeof(callback) !== 'undefined') {
                  callback(user, null);
                } else {
                  return true;
                }
              }
            });*/
        }
      });
    } else {
      if (typeof(callback) == 'function') {
        callback({
          'code': 401,
          'description': '"runtasticJS.user" and "runtasticJS.password" have to be set to perform Login-Request.'}, null);
      } else {
        return false;
      }
    }
  }

  this.logout = function(callback) {
    requestUrl(paths['logout'], 'get', null, function(err, data) {
      if (err) {
        if (typeof(callback) == 'function') {
          callback({
            'code': 500,
            'description': 'Could not perform logout.'}, null);
        } else {
          return false;
        }
      } else {
        if (typeof(callback) == 'function') {
          callback(null, true);
        } else {
          return true;
        }
      }
    });
  }


  // Private Functions
  function requestUrl(url, method, data, callback) {
    url = liburl.parse(url);
    var counter = 0;
    var cookieString = '';
    for (var singleCookie in cookie) {
      if (counter == 0) {
        cookieString += cookie[singleCookie];
      } else {
        cookieString += '; '+cookie[singleCookie];
      }
      counter++;
    }
    if(url.query != null) {
      var path = url.pathname+'?'+url.query;
    } else {
      var path = url.pathname;
    }
    var requestPrototype = {
      host: url.host,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
        'Referer': 'https://www.runtastic.com',
        'X-App-Version': '1.0',
        'X-App-Key': 'com.runtastic.ember',
        'X-CSRF-Token': authenticityToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json, text/javascript,	application/vnd.api+json, */*; q=0.01',
        'DNT': 1,
        'Cookie': cookieString
      }
    }

    var httpsRequest = https.request(requestPrototype, function(response) {
      response.setEncoding('utf8');
      var cache = '';
      response.on('data', function (chunk) {
        cache += chunk;
      });
      response.on('error', function() {
        if (typeof(callback) == 'function') {
          callback({
            'code': 500,
            'description': 'Could not perform request.'
          }, null);
        } else {
          return false;
        }
      });
      response.on('end', function() {
        if (response.statusCode == 403) {
          if (typeof(callback) == 'function') {
            callback({
              'code': 403,
              'description': 'You are not allowed to access this ressource.'
            }, null);
          } else {
            return false;
          }
        } else if (response.statusCode == 404) {
          if (typeof(callback) == 'function') {
            callback({
              'code': 404,
              'description': 'This ressource has been moved or does not exist anymore.'
            }, null);
          } else {
            return false;
          }
        } else {
          if(typeof(response.headers['set-cookie']) != 'undefined') {
            parseCookies(response.headers['set-cookie']);
          }
          if (isValidJSON(cache)) {
            var output = JSON.parse(cache);
          } else {
            var output = cache;
          }
          callback(null, output);
        }
      });
    });
    if (method != 'get') {
      httpsRequest.write(data);
    }
    httpsRequest.end();
  }

  function parseCookies(cookies) {
    for (var i=0; i < cookies.length; i++) {
      var cookiePartly = cookies[i].split(';');
      var cookieName = cookiePartly[0].split('=');
      cookie[cookieName[0]] = cookiePartly[0];
    }
  }

  function isValidJSON(string) {
    try {
      JSON.parse(string);
    } catch (e) {
      return false;
    }
    return true;
  }


  // Constructor Actions
  if (typeof username !== 'undefined') {
    this.username = username;
  }

  if (typeof password !== 'undefined') {
    this.password = password;
  }
}


// Export Class
module.exports = runtasticJs;
