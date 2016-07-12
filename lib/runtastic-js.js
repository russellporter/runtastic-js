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


var async = require('async'),
    cheerio = require('cheerio'),
    https = require('https'),
    liburl = require('url'),
    querystring = require('querystring'),
    util = require('util');

var runtasticJs = function(username, password) {

  // Public Variables
  this.activities = null;
  this.heartrate = null;
  this.isLoggedIn = false;
  this.password = false;
  this.user = null;
  this.username = false;
  this.weight = null;

  // Helper to access Global-Variables
  var self = this;

  // Private Variables
  var authenticityToken = '';
  var cookie = [];
  var paths = {
    'heartrate': 'https://www.runtastic.com/en/users/%d/health/heart-rates.json?period=lifetime&ago=0',
    'login': 'https://www.runtastic.com/en/d/users/sign_in.json',
    'logout': 'https://www.runtastic.com/en/d/users/sign_out',
    'sessionDetail': 'https://hubs.runtastic.com/samples/v2/users/%d/samples/%s?include=trace_collection%2Cneighbourhood%2Ccity%2Ccountry%2Csport_type%2Ccreation_application%2Czones',
    'sessions': 'https://www.runtastic.com/en/users/%s/sport-sessions',
    'sessionsApi': 'https://www.runtastic.com/api/run_sessions/json',
    'weight': 'https://www.runtastic.com/en/users/%d/health/weight_histories?period=lifetime&ago=0'
  };


  // Public Functions
  this.fetchAll = function(limit, timeframe, callback) {
    if (!isInt(limit)) {
      limit = null;
    }
    if (self.isLoggedIn) {
      async.parallel({
        activities: function(callback) {
          self.fetchActivities(limit, timeframe, function(err, activities) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, activities);
            }
          });
        },
        weight: function(callback) {
          self.fetchWeight(limit, timeframe, function(err, weights) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, weights);
            }
          });
        },
        heartrates: function(callback) {
          self.fetchHeartrate(limit, timeframe, function(err, heartrates) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, heartrates);
            }
          });
        }
      }, function(err, results) {
        if (err) {
          if (typeof(callback) == 'function') {
            callback(err, null);
          } else {
            return false;
          }
        } else {
          if (typeof(callback) == 'function') {
            callback(null, results);
          } else {
            return results;
          }
        }
      }
      );
    } else {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is not logged in.'}, null);
      } else {
        return false;
      }
    }
  }

  this.fetchHeartrate = function(limit, timeframe, callback) {
    if (self.isLoggedIn) {
      requestUrl(util.format(paths['heartrate'], self.user['id']), 'get', null, function(err, response) {
        if (err) {
          if (typeof(callback) == 'function') {
            callback(err, null);
          } else {
            return false;
          }
        } else {
          if (timeframe !== null && typeof timeframe === 'object') {
            if (timeframe['from'] == undefined || !(timeframe['from'] instanceof Date)) {
              throw 'timeframe["from"] needs to be defined and of Type Date';
            }
            if (timeframe['to'] == undefined || !(timeframe['to'] instanceof Date)) {
              throw 'timeframe["to"] needs to be defined and of Type Date';
            }
          } else {
            timeframe = {
              'from': new Date('1970-01-01'),
              'to': new Date()
            };
          }

          var resp = response['heart_rates'];
          resp.sort(function(a,b) {
            return new Date(b['measured_at']).getTime() - new Date(a['measured_at']).getTime()
          });

          var counter = 0;
          var output = [];
          for (var i = 0; i < resp.length; i++) {
            var measurementDate = new Date(resp[i]['measured_at']);
            if (measurementDate <= timeframe['to'] && measurementDate >= timeframe['from']) {
              output[counter] = resp[i];
              counter++;
            }
          }
          if (isInt(limit)) {
            response = [];
            for (var i = 0; i < limit; i++) {
              response[i] = output[i];
            }
          } else {
            var response = output;
          }
          self.heartrate = response;
          if (typeof(callback) == 'function') {
            callback(null, response);
          } else {
            return response;
          }
        }
      });
    } else {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is not logged in.'}, null);
      } else {
        return false;
      }
    }
  }

  this.fetchActivities = function(limit, timeframe, callback) {
    if (self.isLoggedIn) {
      
      requestUrl(util.format(paths['sessions'], self.user['slug']), 'get', null, function(err, sessions) {
        if (err) {
          callback(err, null);
        } else {
          var html = cheerio.load(sessions);
          scripts = html('script');
          if (timeframe !== null && typeof timeframe === 'object') {
            if (timeframe['from'] == undefined || !(timeframe['from'] instanceof Date)) {
              throw 'timeframe["from"] needs to be defined and of Type Date';
            }
            if (timeframe['to'] == undefined || !(timeframe['to'] instanceof Date)) {
              throw 'timeframe["to"] needs to be defined and of Type Date';
            }
          } else {
            
            timeframe = {
              'from': new Date('1970-01-01'),
              'to': new Date()
            };
          }

          for (var i = 0; i < scripts.length; i++) {
            if (scripts.get()[i].children[0]) {
              var indexData = scripts.get()[i].children[0].data;
              var indexStart = indexData.indexOf('index_data');
              var indexEnd = indexData.indexOf(';');
              
              if (indexStart > 0) {
                var indexData = indexData.substring(indexStart, indexEnd).replace('index_data = ' ,'');
                var tmpActivties = JSON.parse(indexData);
                activities = [];
                var counter = 0;
                var limiter = tmpActivties.length;
                for (var j = 0; j < limiter; j++) {
                  var activityDate = new Date(tmpActivties[j][1]);
                  if (activityDate <= timeframe['to'] && activityDate >= timeframe['from']) {
                    activities[counter] = new Array();
                    activities[counter][0] = tmpActivties[j][0];
                    activities[counter][1] = activityDate.getTime()/1000;
                    counter++;
                  }
                }
              }
            }
          }

          activities.sort(sortActivitiesByDate);
          var activitiesTruncated = new Array();
          if (limit > 0 && isInt(limit)) {
            var limiter = limit;
          } else {
            var limiter = activities.length;
          }
          for (var i = 0; i<limiter; i++) {
            activitiesTruncated[i] = activities[i];
          }
          self.activities = activitiesTruncated;
          if (typeof(callback) == 'function') {
            callback(null, activitiesTruncated);
          } else {
            return activitiesTruncated;
          }
        }
      });
    } else {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is not logged in.'}, null);
      } else {
        return false;
      }
    }
  }

  this.fetchActivityDetails = function(id, getTraces, callback) {
    if (self.isLoggedIn) {
      requestUrl(util.format(paths['sessionDetail'], self.user['id'], id), 'get', null, function(err, response) {
        if (err) {
          if (typeof(callback) == 'function') {
            callback(err, false);
          } else {
            return false;
          }
        } else {
          var traceUrl = false;
          for (var i = 0; i<response['included'].length; i++) {
            if (response['included'][i]['type'] == 'city') {
              response['data']['city'] = {};
              response['data']['city']['id'] = response['included'][i]['id'];
              response['data']['city']['name'] = {};
              for (var key in response['included'][i]['attributes']) {
                if (key.indexOf('name_') >= 0) {
                  var language = key.replace('name_', '');
                  response['data']['city']['name'][language] = response['included'][i]['attributes'][key];
                }
              }
            } else if (response['included'][i]['type'] == 'country') {
              response['data']['country'] = {};
              response['data']['country']['id'] = response['included'][i]['id'];
              response['data']['country']['timezone'] = response['included'][i]['attributes']['timezone'];
              response['data']['country']['region'] = response['included'][i]['attributes']['region'];
              response['data']['country']['continent'] = response['included'][i]['attributes']['continent'];
              response['data']['country']['iso'] = response['included'][i]['attributes']['iso'];
              response['data']['country']['iso3'] = response['included'][i]['attributes']['iso3'];
              response['data']['country']['name'] = {};
              for (var key in response['included'][i]['attributes']) {
                if(key.indexOf('name_') >= 0) {
                  var language = key.replace('name_', '');
                  response['data']['country']['name'][language] = response['included'][i]['attributes'][key];
                }
              }
            } else if (response['included'][i]['type'] == 'trace_collection')  {
              traceUrl = response['included'][i]['meta']['endpoint'];
            }
          }
          if (getTraces && traceUrl) {
            requestUrl(traceUrl, 'get', null, function(err, traceResponse) {
              response['traces'] = {};
              response['traces']['gps'] = false;
              response['traces']['heartrate'] = false;
              response['traces']['cadence'] = false;
              response['traces']['speed'] = false;

              if (typeof traceResponse === 'object' && 'traces' in traceResponse) {
                for (var i = 0; i < traceResponse['traces'].length; i++) {
                  switch (traceResponse['traces'][i]['type']) {
                    case 'cadence_trace':
                      response['traces']['cadence'] = traceResponse['traces'][i]['points'];
                      break;
                    case 'speed_trace':
                      response['traces']['speed'] = traceResponse['traces'][i]['points'];
                      break;
                    case 'gps_trace':
                      response['traces']['gps'] = traceResponse['traces'][i]['points'];
                      break;
                    case 'heart_rate_trace':
                      response['traces']['heartrate'] = traceResponse['traces'][i]['points'];
                      break;
                  }
                }
              }
              if (typeof(callback) == 'function') {
                callback(null, response);
              } else {
                return response;
              }
            });
          } else {
            if (typeof(callback) == 'function') {
              callback(null, response);
            } else {
              return response['data'];
            }
          }
        }
      });
    } else {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is not logged in.'}, null);
      } else {
        return false;
      }
    }
  }

  this.fetchWeight = function(limit, timeframe, callback) {
    if (self.isLoggedIn) {
      requestUrl(util.format(paths['weight'], self.user['id']), 'get', null, function(err, response) {
        if (err) {
          if (typeof(callback) == 'function') {
            callback(err, null);
          } else {
            return false;
          }
        } else {

          if (timeframe !== null && typeof timeframe === 'object') {
            if (timeframe['from'] == undefined || !(timeframe['from'] instanceof Date)) {
              throw 'frame["from"] needs to be defined and of Type Date';
            }
            if (timeframe['to'] == undefined || !(timeframe['to'] instanceof Date)) {
              throw 'frame["to"] needs to be defined and of Type Date';
            }
          } else {
            timeframe = {
              'from': new Date('1970-01-01'),
              'to': new Date()
            };
          }

          var counter = 0;
          var output = [];
          for (var i = 0; i < response['weight_histories'].length; i++) {
            var measurementDate = new Date(response['weight_histories'][i]['weight_at']);
            if (measurementDate <= timeframe['to'] && measurementDate >= timeframe['from']) {
              output[counter] = response['weight_histories'][i];
              counter++;
            }
          }
          if (isInt(limit)) {
            response = [];
            for (var i = 0; i < limit; i++) {
              response[i] = output[i];
            }
          } else {
            var response = output;
          }

          self.weight = response;
          if (typeof(callback) == 'function') {
            callback(null, response);
          } else {
            return response;
          }
        }
      });
    } else {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is not logged in.'}, null);
      } else {
        return false;
      }
    }
  }

  this.login = function(callback) {
    if (self.isLoggedIn) {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is already logged in. Please logout first.'}, false);
      } else {
        return false;
      }
    } else {
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
            self.user = response['current_user'];
            self.isLoggedIn = true;
            if (typeof(callback) == 'function') {
              callback(null, self.user);
            } else {
              return self.user;
            }
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
  }

  this.logout = function(callback) {
    if (self.isLoggedIn) {
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
          self.isLoggedIn = false;
          if (typeof(callback) == 'function') {
            callback(null, true);
          } else {
            return true;
          }
        }
      });
    } else {
      if (typeof(callback) == 'function') {
        callback({'code': 403,'message': 'User is not logged in.'}, null);
      } else {
        return false;
      }
    }
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
    for (var i = 0; i < cookies.length; i++) {
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

  function sortActivitiesByDate(a, b) {
    if (a[1] === b[1]) {
      return 0;
    } else {
      return (a[1] > b[1]) ? -1 : 1;
    }
  }

  function isInt(x) {
    var y = parseInt(x, 10);
    return !isNaN(y) && x == y && x.toString() == y.toString();
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
