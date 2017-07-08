'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var api = supertest('http://localhost:3000');

/**
 * Rover user info for testing purposes -
 */
var testEmail = 'testrunner@hearstautos.com';
var testPassword = 'testrunner';

describe('User: ', function() {

  var accessToken;

  describe('Rover-Login: ', function () {

    var roverEndpoint = '/v1/users/rover-login';
    var refreshToken;

    it('should remind user to input password or email', function(done) {
      api.post(roverEndpoint)
      .expect('Content-Type', /json/)
      .type('form')
      .send('email=')
      .send('password=')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['login_data'];

        expect(JSON.stringify(data)).to
        .equal(JSON.stringify({status:'Please pass in either a valid rover email address & password OR a refresh token.'}));
        done();
      });
    });

    it('should authenticate user', function(done) {
      api.post(roverEndpoint)
      .expect('Content-Type', /json/)
      .type('form')
      .send('email=' + testEmail)
      .send('password=' + testPassword)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['login_data'];

        // set access token to be used in user info test
        accessToken = data.user_token;
        refreshToken = data.refresh_token;

        expect(data.status).to.equal('authenticated');
        expect(data.user_token.length).to.not.equal(0);
        expect(data.refresh_token.length).to.not.equal(0);
        expect(data.expires_in.length).to.not.equal(0);
        done();
      });
    });

    it('should refresh user token', function(done) {
      api.post(roverEndpoint)
      .expect('Content-Type', /json/)
      .type('form')
      .send('refreshToken=' + refreshToken)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['login_data'];

        // set access token to be used in user info test
        accessToken = data.user_token;

        expect(data.status).to.equal('authenticated');
        expect(data.user_token.length).to.not.equal(0);
        expect(data.refresh_token.length).to.not.equal(0);
        expect(data.expires_in.length).to.not.equal(0);
        done();
      });
    });

    it('should return "status: denied"', function(done) {
      api.post(roverEndpoint)
      .expect('Content-Type', /json/)
      .type('form')
      .send('email=test@something.com')
      .send('password=78888')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['login_data'];

        expect(JSON.stringify(data)).to.equal(JSON.stringify({status:'denied'}));
        done();
      });
    });
  });

  describe('Rover-User', function () {

    var roverEndpoint = '/v1/users/rover-user';

    it('should return user data', function(done) {
      api.post(roverEndpoint)
      .expect('Content-Type', /json/)
      .type('form')
      .send('accessToken=' + accessToken)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        var data = res.body['rover_user'];

        expect(data.first_name).to.equal('VTAX test');
        expect(data.last_name).to.equal('runner');
        expect(data.email).to.equal(testEmail);

        // clear access token
        accessToken = '';

        done();
      });
    });
  });
});
