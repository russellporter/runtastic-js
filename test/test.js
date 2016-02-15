var should = require('should'),
    runtastic = require('../');

console.log(process.env);



describe('Constructor', function() {
  it('Should save the credentials to the Object', function() {
    var runtasticSession = new runtastic('username', 'password');
    runtasticSession.username.should.equal('username');
    runtasticSession.password.should.equal('password');
  });
});

describe('.login(function(err, user))', function() {
  it('Successful Login with valid credentials', function(done) {
    var runtasticSession = new runtastic(process.env.RUNTASTIC_NAME, process.env.RUNTASTIC_PASSWORD);
    runtasticSession.login(function(err, user) {
      if (err) throw err;
      done();
    });
  });

  it('Failed Login with invalid credentials', function(done) {
    var runtasticSession = new runtastic('wrong', 'credentials');
    runtasticSession.login(function(err, user) {
      err['code'].should.equal(403);
      done();
    });
  });

  it('Failed Login with no credentials', function(done) {
      var runtasticSession = new runtastic();
      runtasticSession.login(function(err, user) {
        err['code'].should.equal(401);
        done();
      });
  });
});

describe('.logout(function(err, status))', function() {
  it('Successful Logout after successful Login', function(done) {
    var runtasticSession = new runtastic(process.env.RUNTASTIC_NAME, process.env.RUNTASTIC_PASSWORD);
    runtasticSession.login(function(err, user) {
      if (err) throw err;
      runtasticSession.logout(function(err, status) {
        if (err) throw err;
        done();
      });
    });
  });
});
