'use strict';

const expect = require('chai').use(require('sinon-chai')).expect;
const sinon = require('sinon');
const User = require('../../src/user');
const Firebase = require('../../').MockFirebase;
const _isEqual = require('lodash.isequal');
const _cloneDeep = require('lodash.clonedeep');

describe('User', function() {
  let auth;
  let now;
  let clock;

  beforeEach(function() {
    auth = new Firebase().child('data');
    auth.autoFlush();
    now = new Date(randomTimestamp());
    clock = sinon.useFakeTimers(now);
  });

  afterEach(() => {
    clock.restore();
  });

  describe('#constructor', function() {

    it('should reject ID tokens that expire before the issuance time', () => {
      expect(() => {
        const t = randomTimestamp();
        new User(auth, {
          _tokenValidity: {
            authTime: new Date(t - 2),
            issuedAtTime: new Date(t),
            expirationTime: new Date(t - 1),
          }
        });
      }).to.throw(User.msg_tokenExpiresBeforeIssuance);
    });

    it('should reject ID tokens that are issued before the auth time', () => {
      expect(() => {
        const t = randomTimestamp();
        new User(auth, {
          _tokenValidity: {
            authTime: new Date(t),
            issuedAtTime: new Date(t - 1),
          }
        });
      }).to.throw(User.msg_tokenIssuedBeforeAuth);
    });

    it('should reject ID tokens that are issued in the future', () => {
      expect(() => new User(auth, {
        _tokenValidity: {
          authTime: new Date(now.getTime() - 1),
          issuedAtTime: new Date(now.getTime() + 1),
        },
      })).to.throw(User.msg_tokenIssuedInTheFuture);
    });

    it('should reject ID tokens that show the user authenticating in the future', () => {
      expect(() => {
        new User(auth, {
          _tokenValidity: {
            authTime: new Date(now.getTime() + 1),
          },
        });
      }).to.throw(User.msg_tokenAuthedInTheFuture);
    });
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
      const user = new User(auth, {});
      const token = user._idtoken;
      return expect(user.getIdToken(true)).to.eventually.not.equal(token);
    });

    it('should refresh token result', function() {
      const authTime = new Date(randomPastTimestamp());
      const user = new User(auth, {
        _tokenValidity: {
          authTime: authTime,
          issuedAtTime: authTime,
        },
      });
      return expect(user.getIdToken(true)
        .then(() => user.getIdTokenResult(false))
        .then(r =>
          r.issuedAtTime === now.toISOString() &&
          r.expirationTime === new Date(now.getTime() + 3600000).toISOString()
        )
      ).to.eventually.equal(true);
    });
  });

  describe('#getIdTokenResult', function() {

    it('should use defaults if the id token result param is omitted', () => {
      expect(new User(auth, {}).getIdTokenResult())
        .to.eventually.deep.equal(new User(auth, {_tokenValidity: {}}));
    });

    describe('without forceRefresh', () => {
      describe('.authTime', () => {
        it('should use provided auth time', () => {
          const authTime = new Date(randomPastTimestamp());
          const user = new User(auth, {
            _tokenValidity: {
              authTime: authTime,
            },
          });
          return expect(user.getIdTokenResult().then(r => r.authTime))
            .to.eventually.equal(authTime.toISOString());
        });

        it('should default auth time to current time', () => {
          const user = new User(auth, {_tokenValidity: {}});
          return expect(user.getIdTokenResult().then(r => r.authTime))
            .to.eventually.equal(now.toISOString());
        });
      });

      describe('.issuedAtTime', () => {
        it('should use provided issued-at time', () => {
          const issuedTs = randomPastTimestamp();
          const issuedTime = new Date(issuedTs);
          const user = new User(auth, {
            _tokenValidity: {
              authTime: new Date(issuedTs - 1),
              issuedAtTime: issuedTime,
            },
          });
          return expect(user.getIdTokenResult().then(r => r.issuedAtTime))
            .to.eventually.equal(issuedTime.toISOString());
        });

        it('should default to auth time', () => {
          const authTime = new Date(randomPastTimestamp());
          const user = new User(auth, {
            _tokenValidity: {
              authTime: authTime,
            },
          });
          return expect(user.getIdTokenResult().then(r => r.issuedAtTime))
            .to.eventually.equal(authTime.toISOString());
        });
      });

      describe('.expirationTime', () => {
        it('should use provided expiration time', () => {
          const expTime = new Date(now.getTime() + 1);
          const user = new User(auth, {
            _tokenValidity: {
              expirationTime: expTime,
            },
          });
          return expect(user.getIdTokenResult().then(r => r.expirationTime))
            .to.eventually.equal(expTime.toISOString());
        });

        it('should default to issued at time plus 1 hour', () => {
          const authTime = new Date(now.getTime() - 1);
          const issuedTime = new Date(now.getTime());
          const expTime = new Date(now.getTime() + 3600000);
          const user = new User(auth, {
            _tokenValidity: {
              authTime: authTime,
              issuedAtTime: issuedTime,
            },
          });
          return expect(user.getIdTokenResult().then(r => r.expirationTime))
            .to.eventually.equal(expTime.toISOString());
        });
      });

      describe('.signInProvider', () => {
        it('should use User\'s providerId string', () => {
          const providerName = 'google';
          const user = new User(auth, {
            providerId: providerName,
            _tokenValidity: {},
          });
          return expect(user.getIdTokenResult()
            .then(r => r.signInProvider)
          ).to.eventually.equal(providerName);
        });

        it('should default to null', () => {
          const user = new User(auth, {_tokenValidity: {}});
          return expect(user.getIdTokenResult()
            .then(r => r.signInProvider)
          ).to.eventually.equal(null);
        });
      });

      describe('.claims', () => {
        it('should use user\'s customClaims object', () => {
          const claims = {'testclaim': 'abcd'};
          const user = new User(auth, {
            _tokenValidity: {},
            customClaims: claims,
          });
          return expect(user.getIdTokenResult().then(r => r.claims))
            .to.eventually.deep.equal(claims);
        });

        it('should default to empty object', () => {
          const user = new User(auth, {_tokenValidity: {},});
          return expect(user.getIdTokenResult().then(r => r.claims))
            .to.eventually.deep.equal({});
        });
      });

      describe('.token', () => {
        it('should be the same as returned from getIdToken', () => {
          const user = new User(auth, {_tokenValidity: {},});
          return expect(Promise.all([
            user.getIdTokenResult().then(r => r.token),
            user.getIdToken()
          ]).then(([t1, t2]) => t1 === t2)).to.eventually.equal(true);
        });
      });
    });

    describe('with forceRefresh', () => {
      it('persists the new token', () => {
        const user = new User(auth, {
          _tokenValidity: {
            authTime: new Date(randomPastTimestamp()),
          },
        });
        return expect(user.getIdTokenResult(true)
          .then(_t1 => {
            const t1 = _cloneDeep(_t1);
            return user.getIdTokenResult(false).then(t2 =>
              _isEqual(t1, t2)
            );
          })
        ).to.eventually.equal(true);
      });

      it('should use authTime from previous token', () => {
        const authTime = new Date(randomPastTimestamp());
        const user = new User(auth, {
          _tokenValidity:
            {authTime: authTime},
        });
        return expect(user.getIdTokenResult(true).then(r => r.authTime))
          .to.eventually.equal(authTime.toISOString());
      });

      it('should use current time as issuance time', () => {
        const user = new User(auth, {
          _tokenValidity: {
            authTime: new Date(randomPastTimestamp()),
          }
        });
        return expect(user.getIdTokenResult(true).then(r => r.issuedAtTime))
          .to.eventually.equal(now.toISOString());
      });

      it('should expire one hour after issuance', () => {
        const user = new User(auth, {
          _tokenValidity: {
            authTime: new Date(randomPastTimestamp()),
          },
        });
        const expTime = new Date(now.getTime() + 3600000);
        return expect(user.getIdTokenResult(true).then(r => r.expirationTime))
          .to.eventually.equal(expTime.toISOString());
      });

      it('should generate a new token', () => {
        const user = new User(auth, {_tokenValidity: {},});
        return expect(user.getIdToken(false)
          .then(oldToken => user.getIdTokenResult(true)
            .then(newTokenResult => oldToken === newTokenResult.token)
          )
        ).to.eventually.equal(false);
      });
    });
  });
});

function randomTimestamp() {
  return Math.floor(Math.random() * 4000000000000);
}

function randomPastTimestamp() {
  return Math.floor(Math.random() * Date.now());
}
