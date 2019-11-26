'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var User = require('../../src/user');
var Firebase = require('../../').MockFirebase;

describe('User', function () {
  var auth;
  beforeEach(function () {
    auth = new Firebase().child('data');
    auth.autoFlush();
  });

  describe('#delete', function() {
    it('should delete user', function() {
      return auth.createUser({
        uid: '123',
        email: 'test@test.com',
        password: 'pw'
      }).then(function(user) {
        return user.delete().then(function() {
          return expect(auth.getUser('123')).to.be.rejected.and.notify(function(err) {
            expect(err.code).to.equal('auth/user-not-found');
          });
        });
      });
    });
  });

  describe('#reload', function() {
    it('should reload email when changed', function() {
      return auth.createUser({
        uid: '123',
        email: 'test@test.com',
        password: 'pw'
      }).then(function(user) {
        expect(user).to.have.property('email', 'test@test.com');

        return auth.changeEmail({
          oldEmail: 'test@test.com',
          newEmail: 'test2@test.com',
          password: 'pw'
        }).then(function() {
          expect(user).to.have.property('email', 'test@test.com');

          return user.reload().then(function() {
            expect(user).to.have.property('email', 'test2@test.com');
          });
        });
      });
    });
  });

  describe('#updateEmail', function() {
    it('should change email', function() {
      return auth.createUser({
        uid: '123',
        email: 'test@test.com',
        password: 'pw'
      }).then(function(user) {
        expect(user).to.have.property('email', 'test@test.com');

        return user.updateEmail('test2@test.com').then(function() {
          expect(user).to.have.property('email', 'test2@test.com');

          return expect(auth.getUser(user.uid)).to.eventually.have.property('email', 'test2@test.com');
        });
      });
    });
  });

  describe('#updatePassword', function() {
    it('should change password', function() {
      return auth.createUser({
        uid: '123',
        email: 'test@test.com',
        password: 'pw'
      }).then(function(user) {
        expect(user).to.have.property('password', 'pw');

        return user.updatePassword('pw2').then(function() {
          expect(user).to.have.property('password', 'pw2');

          return expect(auth.getUser(user.uid)).to.eventually.have.property('password', 'pw2');
        });
      });
    });
  });

  describe('#updateProfile', function() {
    it('should change display name', function() {
      return auth.createUser({
        uid: '123',
        email: 'test@test.com',
        password: 'pw',
        displayName: 'bob'
      }).then(function(user) {
        expect(user).to.have.property('displayName', 'bob');

        return user.updateProfile({
          displayName: 'bobby'
        }).then(function() {
          expect(user).to.have.property('displayName', 'bobby');

          return expect(auth.getUser(user.uid)).to.eventually.have.property('displayName', 'bobby');
        });
      });
    });

    it('should change photo URL', function() {
      return auth.createUser({
        uid: '123',
        email: 'test@test.com',
        password: 'pw',
        photoURL: 'url'
      }).then(function(user) {
        expect(user).to.have.property('photoURL', 'url');

        return user.updateProfile({
          photoURL: 'url2'
        }).then(function() {
          expect(user).to.have.property('photoURL', 'url2');

          return expect(auth.getUser(user.uid)).to.eventually.have.property('photoURL', 'url2');
        });
      });
    });
  });

  describe('#getIdToken', function() {
    it('should get token', function() {
      var user = new User(auth, {});
      return expect(user.getIdToken()).to.eventually.not.be.empty;
    });

    it('should refresh token', function() {
      var user = new User(auth, {});
      var token = user._idtoken;
      return expect(user.getIdToken(true)).to.eventually.not.equal(token);
    });
  });

  describe('#toJSON', () => {
    describe('most fields', () => {
      it('should be the same', () => {
        const user = new User(auth, {});
        const json = user.toJSON();
        [
          'uid',
          'email',
          'emailVerified',
          'displayName',
          'photoURL',
          'phoneNumber',
          'providerData',
        ].forEach(k => expect(json[k]).to.deep.equal(user[k]));
      });
    });

    describe('.metadata', () => {
      it('keys should be missing if omitted', () => {
        const user = new User(auth, {});
        expect(user.toJSON()).not.to.haveOwnProperty('lastLoginAt');
        expect(user.toJSON()).not.to.haveOwnProperty('createdAt');
      });

      it('should populate to lastLogin if present', () => {
        const metadata = {
          lastLoginAt: new Date(11).getTime().toString(10),
        };
        const user = new User(auth, { metadata: metadata, });
        expect(user.toJSON().lastLoginAt).to.equal(metadata.lastLoginAt);
      });

      it('should populate to createdAt if present', () => {
        const metadata = {
          createdAt: new Date(12).getTime().toString(10),
        };
        const user = new User(auth, { metadata: metadata, });
        expect(user.toJSON().createdAt).to.equal(metadata.createdAt);
      });
    });
  });
});
