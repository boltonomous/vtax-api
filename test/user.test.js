'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var api = supertest('http://localhost:3000');

/**
 * Rover user info for testing purposes -
 *
 * Email: testrunner@hearstautos.com
 * Password: testrunner
 */

var testEmail = 'testrunner@hearstautos.com';
var testPassword = 'testrunner';

describe('User: ', function() {

  describe('Rover-User: ', function () {

    it('should remind user to input password or email', function(done) {

      api.post('/v1/users/rover-user')
      .expect('Content-Type', /json/)
      .type('form')
      .send('email=')
      .send('password=')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['rover-user'];
        var user = data['userInfo'];

        expect(data).to.equal('Email and or Password properties are missing');
        expect(data.status).to.be.an('undefined');
        expect(user).to.be.an('undefined');
        done();
      });
    });

    it('should return authenticated user data', function(done) {

      api.post('/v1/users/rover-user')
      .expect('Content-Type', /json/)
      .type('form')
      .send('email=' + testEmail)
      .send('password=' + testPassword)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['rover-user'];
        var user = data['userInfo'];

        expect(data.status).to.equal('authenticated');
        expect(user.first_name).to.equal('VTAX test');
        expect(user.last_name).to.equal('runner');
        expect(user.email).to.equal(testEmail);
        done();
      });
    });

    it('should return "status: denied"', function(done) {
      api.post('/v1/users/rover-user')
      .expect('Content-Type', /json/)
      .type('form')
      .send('email=test@something.com')
      .send('password=78888')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var data = res.body['rover-user'];
        var user = data['userInfo'];

        expect(data.status).to.equal('denied');
        expect(user).to.be.an('undefined');
        done();
      });
    });
  });
});
