'use strict';
var request = require('request');
var config = require('../../config.json');

var authDomain = config.authDomain;
var clientId = config.clientId;
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

  /**
   * Initial method called when the /users/rover-user endpoint is posted
   */
  User.remoteMethod('authenticateUser', {
    accepts: [
      { arg: 'email', type: 'string', description: 'rover email address' },
      { arg: 'password', type: 'string', description: 'rover password' }
    ],
    returns: { arg: 'rover-user', type: 'any' },
    http: { path: '/rover-user', verb: 'post' }
  });

  /**
   * Authenticate Rover: Takes in email and password and confirms
   * whether or not it matches a user in Rover.
   *
   * Function called by remoteMethod()
   *
   * @param email: string
   * @param password: string
   * @param callback: function
   */
  User.authenticateUser = function (email, password, callback) {
    if (!email || !password) {
      // send response string to loopback notifying user they are missing
      // an email and or password
      callback(null, 'Email and or Password properties are missing');
      return;
    }

    User.getAccessTokenFromRover(null, email, password, callback);
  };

  /**
   * Makes an api call to rover in order to get a user token,
   * and then takes that user token and retrieves user information based
   * on the email and password passed into the function.
   *
   * @param type: string
   * @param email: string
   * @param password: string
   * @param callback: function
   */
  User.getAccessTokenFromRover = function(type, email, password, callback) {
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
        // send 'status: denied' response object to loopback
        callback(null, {status: 'Denied.'});
        return;
      }

      User.retrieveUserInfo(accessToken, callback);
    });
  };

  /**
   * Takes in an access token, and uses it to make an api call to rover
   * to retrieve a user's information
   *
   * @param accessToken: string
   * @param callback: function
   */
  User.retrieveUserInfo = function(accessToken, callback) {
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

      // send response object to loopback
      callback(null, returnObj);
    });
  };

  /**
   * Console.logs the responses from an api call.
   *
   * @param error: any
   * @param response: any
   * @param body: any
   */
  User.consoleInfo = function(error, response, body) {
    console.log('error:', error);
    console.log('statusCode:', response && response.statusCode);
    console.log('body:', body);
  };
};
