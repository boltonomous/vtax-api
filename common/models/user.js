'use strict';
var request = require('request');

var authDomain = 'https://stage-rover.mediaos.hearst.io';
var clientId = 142235;
var accessToken;
var refreshToken;
var expiresIn;

/**
 * Rover user info for testing purposes -
 *
 * Email: testrunner@hearstautos.com
 * Password: testrunner
 */

module.exports = function(User) {

  User.remoteMethod('authenticateUser', {
    accepts: [
      { arg: 'email', type: 'string', description: 'rover email address' },
      { arg: 'password', type: 'string', description: 'rover password' }
    ],
    returns: { arg: 'rover-user', type: 'any' },
    http: { path: '/rover-user', verb: 'post' }
  });

  User.authenticateUser = function (email, password, cb) {
    if (!email || !password) {
      cb(null, 'Email and or Password properties are missing');
      return;
    }

    User.getAccessTokenFromRover(null, email, password, cb);
  };

  User.getAccessTokenFromRover = function(type, email, password, cb) {
    var newAccessTokenOptions = {
      url: authDomain + '/openid/token',
      form: {
        client_id: clientId,
        timestamp: Math.floor(Date.now() / 1000),
        email: email,
        password: password,
        grant_type: 'password',
        scope: 'openid user roles profiles'
      }
    };

    var refreshTokenOptions = {
      url: authDomain + '/openid/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        refresh_token: refreshToken,
        client_id: clientId,
        grant_type: 'refresh_token'
      }
    };

    var options = (type === 'refresh')
      ? refreshTokenOptions
      : newAccessTokenOptions;

    request.post(options, function (error, response, body) {
      User.consoleInfo(error, response, body);

      var tokenInfo = JSON.parse(body);

      accessToken = tokenInfo.access_token;
      refreshToken = tokenInfo.refresh_token;
      expiresIn = tokenInfo.expires_in;

      if (!accessToken) {
        cb(null, {status: 'Denied.'});
        return;
      }

      User.retrieveUserInfo(accessToken, cb);
    });
  };

  User.retrieveUserInfo = function(accessToken, cb) {
    var options = {
      url: authDomain + '/openid/userinfo/',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    };

    request.post(options, function (error, response, body) {
      User.consoleInfo(error, response, body);

      var userInfo = JSON.parse(body);

      var returnObj = {
        status: 'authenticated',
        userToken: accessToken,
        userInfo: userInfo
      };

      cb(null, returnObj);
    });
  };

  User.consoleInfo = function(error, response, body) {
    console.log('error:', error);
    console.log('statusCode:', response && response.statusCode);
    console.log('body:', body);
  };
};
