'use strict';
var request = require('request');
var config = require('../../config.json');

var authDomain = config.authDomain;
var clientId = config.clientId;

/**
 * Rover user info for testing purposes -
 *
 * Email: testrunner@hearstautos.com
 * Password: testrunner
 */
module.exports = function(User) {

  /**
   * /users/rover-login: authenticate user and return access tokens
   */
  User.remoteMethod('authenticateUser', {
    description: 'Pass in email & password OR refresh token to get new rover access token',
    accepts: [
      { arg: 'email', type: 'string', description: 'rover email address' },
      { arg: 'password', type: 'string', description: 'rover password' },
      { arg: 'refreshToken', type: 'string', default: '', description: 'refresh token' }
    ],
    returns: { arg: 'login_data', type: 'any' },
    http: { path: '/rover-login', verb: 'post' }
  });

  /**
   * /users/rover-user: Return user information
   */
  User.remoteMethod('retrieveUserInfo', {
    description: 'Get rover user information with access token',
    accepts: [
      { arg: 'accessToken', type: 'string', description: 'rover access token', required: true }
    ],
    returns: { arg: 'rover_user', type: 'any' },
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
   * @param refreshToken: string
   * @param callback: function
   */
  User.authenticateUser = function (email, password, refreshToken, callback) {
    if (!(email || password) && !refreshToken) {
      // send response string to loopback notifying user they are missing
      // an email and or password
      callback(null, {status: 'Please pass in either a valid rover email address & password OR a refresh token.'});
      return;
    }

    var options = (refreshToken)
      ? User.refreshTokenOptions(refreshToken)
      : User.newAccessTokenOptions(email, password);

    var params = {
      options: options,
      email: email,
      password: password
    };

    User.getAccessTokenFromRover(params, callback);
  };

  /**
   * Makes an api call to rover in order to get a user token,
   * and then takes that user token and retrieves user information based
   * on the email and password passed into the function.
   *
   * params {
   *  type: string
   *  email: string
   *  password: string
   *  lbCallback: function
   *  callback: function
   * }
   */
  User.getAccessTokenFromRover = function(params, callback) {
    request.post(params.options, function (error, response, body) {
      User.consoleInfo(error, response, body);

      var data = JSON.parse(body);
      var accessToken = data.access_token;
      var refreshToken = data.refresh_token;
      var expiresIn = data.expires_in;

      if (!accessToken) {
        // send 'status: denied' response object to loopback
        callback(null, {status: 'denied'});
        return;
      }

      var returnObj = {
        status: 'authenticated',
        user_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn
      };

      callback(null, returnObj);
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
    var options = User.userInfoOptions(accessToken);

    request.post(options, function (error, response, body) {
      User.consoleInfo(error, response, body);

      var userInfo = JSON.parse(body);

      // send response object to loopback
      callback(null, userInfo);
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

  /**
   * Returns Options for making an api POST request
   * to return a brand new access token.
   */
  User.newAccessTokenOptions = function (email, password) {
    return {
      url: authDomain + '/openid/token',
      form: {
        client_id: clientId,
        timestamp: Math.floor(Date.now() / 1000),
        email: email,
        password: password,
        grant_type: 'password',
        scope: 'openid user roles profiles'
      }
    }
  };

  /**
   * Takes in refresh token (string) and returns options for
   * making an api POST request to return a refreshed access token.
   */
  User.refreshTokenOptions = function (refreshToken) {
    return {
      url: authDomain + '/openid/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        refresh_token: refreshToken,
        client_id: clientId,
        grant_type: 'refresh_token'
      }
    }
  };

  /**
   * Takes in access token (string) and returns options for
   * making an api POST request to return user info.
   */
  User.userInfoOptions = function (accessToken) {
    return {
      url: authDomain + '/openid/userinfo/',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    };
  };
};
