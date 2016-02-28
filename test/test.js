var should = require('should'),
    runtastic = require('../'),
    runtasticSession = null;

describe('Constructor', function() {
  it('Should save the credentials to the Object', function() {
    runtasticSession = new runtastic('username', 'password');
    runtasticSession.username.should.equal('username');
    runtasticSession.password.should.equal('password');
  });
});

describe('.login(function(err, user))', function() {
  it('Failed Login with invalid credentials', function(done) {
    runtasticSession.login(function(err, user) {
      err['code'].should.equal(403);
      done();
    });
  });
  it('Failed Login with no credentials', function(done) {
    runtasticSession = new runtastic();
    runtasticSession.login(function(err, user) {
      err['code'].should.equal(401);
      done();
    });
  });
  it('Successful Login with valid credentials', function(done) {
    runtasticSession = new runtastic(process.env.RUNTASTIC_NAME, process.env.RUNTASTIC_PASSWORD);
    runtasticSession.login(function(err, user) {
      if (err) throw err;
      done();
    });
  });
});

describe('.fetchActivities(function(err, activities))', function() {
  it('Fetch all Activities from 1970/01/01 to current Date', function(done) {
    this.timeout(5000);
    runtasticSession.fetchActivities(null, null, function(err, activities) {
      if (err) throw err;
      activities.should.be.an.instanceOf(Array);
      done();
    });
  });
  it('Set Timerange and fetch all Activities from 2016/01/01 to current Date', function(done) {
    this.timeout(5000);
    runtasticSession.fetchActivities(null, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, activities) {
      if (err) throw err;
      activities.should.be.an.instanceOf(Array);
      done();
    });
  });
  it('fetch the latest 5 Activities in the Timeframe from 2016/01/01 to current Date', function(done) {
    this.timeout(5000);
    runtasticSession.fetchActivities(5, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, activities) {
      if (err) throw err;
      activities.should.be.an.instanceOf(Array).and.have.lengthOf(5);
      done();
    });
  });
});

describe('.fetchActivityDetail(id, getTraces, function(err, activity))', function(){
  it('Get existing Activity-Details for an Activity without Traces', function(done){
    runtasticSession.fetchActivityDetail(1101860177, false, function(err, activity){
      if (err) throw err;
      done();
    });
  });
  it('Get existing Activity-Details for an Activity with Traces', function(done){
    runtasticSession.fetchActivityDetail(1101860177, true, function(err, activity){
      if (err) throw err;
      done();
    });
  });
});

describe('.fetchWeight(limit, function(err, weights))', function() {
  it('Get all Measurements', function(done) {
    runtasticSession.fetchWeight(null, null, function(err, weights) {
      if (err) throw err;
      done();
    });
  });

  it('Get the latest 5 Measurements', function(done) {
    runtasticSession.fetchWeight(5, null, function(err, weights) {
      if (err) throw err;
      weights.should.be.an.instanceOf(Array).and.have.lengthOf(5);
      done();
    });
  });

  it('Get Measurements in the Timeframe from 2016/01/01 to current Date', function(done) {
    runtasticSession.fetchWeight(null, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, weights) {
      if (err) throw err;
      done();
    });
  });
});

describe('.fetchHeartrate(limit, function(err, heartrates))', function() {
  it('Get all Measurements', function(done) {
    runtasticSession.fetchHeartrate(null, null, function(err, heartrates) {
      if (err) throw err;
      done();
    });
  });

  it('Get the latest 5 Measurements', function(done) {
    runtasticSession.fetchHeartrate(5, null, function(err, heartrates) {
      if (err) throw err;
      heartrates.should.be.an.instanceOf(Array).and.have.lengthOf(5);
      done();
    });
  });

  it('Get Measurements in the Timeframe from 2016/01/01 to current Date', function(done) {
    runtasticSession.fetchHeartrate(null, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, heartrates) {
      if (err) throw err;
      done();
    });
  });
});

describe('.fetchAll(limit, function(err, results))', function() {
  this.timeout(5000);
  it('Get Results from all API-Endpoints', function(done) {
    runtasticSession.fetchAll(null, null, function(err, results) {
      if (err) throw err;
      done();
    });
  });

  it('Get the latest 5 Results from all API-Endpoints', function(done) {
    this.timeout(5000);
    runtasticSession.fetchAll(5, null, function(err, results) {
      if (err) throw err;
      results['activities'].should.be.an.instanceOf(Array).and.have.lengthOf(5);
      results['weight'].should.be.an.instanceOf(Array).and.have.lengthOf(5);
      results['heartrates'].should.be.an.instanceOf(Array).and.have.lengthOf(5);
      done();
    });
  });

  it('Get Results in the Timeframe from 2016/01/01 to current Date', function(done) {
    runtasticSession.fetchAll(null, {'from': new Date('2016/01/01'), 'to': new Date()}, function(err, results) {
      if (err) throw err;
      done();
    });
  });
});

describe('.logout(function(err, status))', function() {
  it('Successful Logout after successful Login', function(done) {
    runtasticSession.logout(function(err, status) {
      if (err) throw err;
      done();
    });
  });
});
