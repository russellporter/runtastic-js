# runtastic-js

[![Build Status](https://travis-ci.org/terhuerne/runtastic-js.svg?branch=master)](https://travis-ci.org/terhuerne/runtastic-js)

runtastic-js is an API-Wrapper for the Runtastic.com Service. The module is designed for use with Node.js and is installable via npm.

##Install
To install runtastic-js you just have to enter this command to your console
`npm install runtastic-js`

##Quickstart
If you just want to start over really quickly, all you need are 5 lines of code:

```js
var runtastic = require('runtastic-js'),
	runtasticApi = new runtastic(RUNTASTIC_E-MAIL-ADRESS, RUNTASTIC_PASSWORD);
	
runtasticApi.login(function(err, user) {
	// Do your Actions here and don't forget to call runtasticApi.logout() when you're finished!
});
```

##API-Reference
This module offers multiple functions to interact with the Runtastic-API. Most of the functions needs to be called after you have called the ```.login()``` method.

###Callable Methods
- [.login(callback(err, user))](#login)
- [.fetchActivities(count, timeframe, callback(err, activities))](#activities)
- [.fetchActivityDetails(id, fetchTraces, callback(err, activity))](#activitydetails)
- [.fetchWeight(count, timeframe, callback(err, weights))](#weight)
- [.fetchHeartrate(count, timeframe, callback(err, heartrates))](#heartrate)
- [.fetchAll(count, timeframe, callback(err, results))](#all)
- [.logout(callback(err, status))](#logout)

<a name="login"></a>
####.login(callback(err, user))###
Needs to be called before any further interaction with the Runtastic-API. Returns a User-Object when successful or an error.

<a name="activities"></a>
####.fetchActivities(count, timeframe, callback(err, activities))####
Can be called to get the IDs of the activities a User did. 

Variable|Acceptable Types|Behavior
---|---|---
count|```Integer``` or ```Null```|Truncates the result and only returns the number of items defined in count. If provided ```null``` all results will be returned
timeframe|```Object``` or ```Null```|Will only return Activities which were performed inside the defined timeframe. If provided ```null``` all results will be returned
callback|```Function```| Needs to a function which will be called as soon as the API-Request has been finished and returns an ```Object``` with eiter an error-message or results. The Object contains of Arrays with two keys. The first key holds the Activity-ID and the second one the UNIX-Timestamp for the Actvitiy.

#####Example#####
```js
// Return the last 10 Activity-Ids between 2016/01/01 and today.

runtasticApi.fetchActivities(10, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, activities) {
  // Do something with the returned data.
});
```

<a name="activitydetails"></a>
####.fetchActivityDetails(id, fetchTraces, callback(err, activity))####
Get the Details for an activity. Returns an Object when successful or an error.

Variable|Acceptable Types|Behavior
---|---|---
id|```Integer```|Needs to be provided.
fetchTraces|```Boolean```|Can be either ```true``` or ```false```. If ```true``` the method will return the Heartrate-, GPS-, Cadence- and Speed-Traces when available.
callback|```Function```| Needs to be a function which will be called as soon as the API-Request has been finished and returns an ```Object``` with eiter an error-message or results

<a name="weight"></a>
####.fetchWeight(count, timeframe, callback(err, weights))####
Get the Body-Weight History.

Variable|Acceptable Types|Behavior
---|---|---
count|```Integer``` or ```Null```|Truncates the result and only returns the number of items defined in count. If provided ```null``` all results will be returned
timeframe|```Object``` or ```Null```|Will only return Meassurements which were performed inside the defined timeframe. If provided ```null``` all results will be returned
callback|```Function```| Needs to be a function which will be called as soon as the API-Request has been finished and returns an ```Object``` with eiter an error-message or results

#####Example#####
```js
// Return the last 10 Weight-Meassurements between 2016/01/01 and today.

runtasticApi.fetchWeight(10, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, activities) {
  // Do something with the returned data.
});
```

<a name="heartrate"></a>
####.fetchHeartrate(count, timeframe, callback(err, weights))####
Get the Heartrate History.

Variable|Acceptable Types|Behavior
---|---|---
count|```Integer``` or ```Null```|Truncates the result and only returns the number of items defined in count. If provided ```null``` all results will be returned
timeframe|```Object``` or ```Null```|Will only return Meassurements which were performed inside the defined timeframe. If provided ```null``` all results will be returned
callback|```Function```| Needs to be a function which will be called as soon as the API-Request has been finished and returns an ```Object``` with eiter an error-message or results

#####Example#####
```js
// Return the last 10 Heartrate-Meassurements between 2016/01/01 and today.

runtasticApi.fetchHeartrate(10, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, heartrates) {
  // Do something with the returned data.
});
```

<a name="all"></a>
####.fetchAll(count, timeframe, callback(err, weights))####
Shortcut method to call ```.fetchActivities()```, ```.fetchWeight()```and ```.fetchHeartrate``` in one. Returns one object with all data.

Variable|Acceptable Types|Behavior
---|---|---
count|```Integer``` or ```Null```|Truncates the results and only returns the number of items defined in count. If provided ```null``` all results will be returned
timeframe|```Object``` or ```Null```|Will only return Results which were performed inside the defined timeframe. If provided ```null``` all results will be returned
callback|```Function```| Needs to be a function which will be called as soon as the API-Request has been finished and returns an ```Object``` with eiter an error-message or results

#####Example#####
```js
// Return the last 10 Heartrate-Meassurements between 2016/01/01 and today.

runtasticApi.fetchHeartrate(10, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, heartrates) {
  // Do something with the returned data.
});
```

<a name="logout"></a>
####.logout(callback(err, status))###
Needs to be called at the end of the API-Interaction. Closes the connection the API and destroys the session.

###Callable Variables
- [.activities](#activitiesvar)
- [.heartrate](#heartratevar)
- [.isLoggedIn](#isloggedinvar)
- [.password](#passwordvar)
- [.user](#uservar)
- [.username](#usernamevar)
- [.weight](#weightvar)
 
<a name="activitiesvar"></a>
####.activities####
Returns all Activity-Ids from the last API-Request to that Endpoint.

<a name="heartratevar"></a>
####.heartrate####
Returns all Heartrate-Meassurements from the last API-Request to that Endpoint.

<a name="isloggedinvar"></a>
####.isLoggedIn####
Returns the Login-Status. Can be either ```true```or ```false```.

<a name="passwordvar"></a>
####.password####
Returns the password which was added at startup.

<a name="uservar"></a>
####.user####
Returns the user-object.

<a name="usernamevar"></a>
####.username####
Returns the username/E-Mail Adress which was added at startup.

<a name="weightvar"></a>
####.weight####
Returns all Weight-Meassurements from the last API-Request to that Endpoint.

##Licence
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
