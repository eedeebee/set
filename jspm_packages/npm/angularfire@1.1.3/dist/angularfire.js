/* */ 
(function(process) {
  (function(exports) {
    "use strict";
    angular.module("firebase", []).value("Firebase", exports.Firebase);
  })(window);
  (function() {
    'use strict';
    angular.module('firebase').factory('$firebaseArray', ["$log", "$firebaseUtils", "$q", function($log, $firebaseUtils, $q) {
      function FirebaseArray(ref) {
        if (!(this instanceof FirebaseArray)) {
          return new FirebaseArray(ref);
        }
        var self = this;
        this._observers = [];
        this.$list = [];
        this._ref = ref;
        this._sync = new ArraySyncManager(this);
        $firebaseUtils.assertValidRef(ref, 'Must pass a valid Firebase reference ' + 'to $firebaseArray (not a string or URL)');
        this._indexCache = {};
        $firebaseUtils.getPublicMethods(self, function(fn, key) {
          self.$list[key] = fn.bind(self);
        });
        this._sync.init(this.$list);
        return this.$list;
      }
      FirebaseArray.prototype = {
        $add: function(data) {
          this._assertNotDestroyed('$add');
          var def = $firebaseUtils.defer();
          var ref = this.$ref().ref().push();
          ref.set($firebaseUtils.toJSON(data), $firebaseUtils.makeNodeResolver(def));
          return def.promise.then(function() {
            return ref;
          });
        },
        $save: function(indexOrItem) {
          this._assertNotDestroyed('$save');
          var self = this;
          var item = self._resolveItem(indexOrItem);
          var key = self.$keyAt(item);
          if (key !== null) {
            var ref = self.$ref().ref().child(key);
            var data = $firebaseUtils.toJSON(item);
            return $firebaseUtils.doSet(ref, data).then(function() {
              self.$$notify('child_changed', key);
              return ref;
            });
          } else {
            return $firebaseUtils.reject('Invalid record; could determine key for ' + indexOrItem);
          }
        },
        $remove: function(indexOrItem) {
          this._assertNotDestroyed('$remove');
          var key = this.$keyAt(indexOrItem);
          if (key !== null) {
            var ref = this.$ref().ref().child(key);
            return $firebaseUtils.doRemove(ref).then(function() {
              return ref;
            });
          } else {
            return $firebaseUtils.reject('Invalid record; could not determine key for ' + indexOrItem);
          }
        },
        $keyAt: function(indexOrItem) {
          var item = this._resolveItem(indexOrItem);
          return this.$$getKey(item);
        },
        $indexFor: function(key) {
          var self = this;
          var cache = self._indexCache;
          if (!cache.hasOwnProperty(key) || self.$keyAt(cache[key]) !== key) {
            var pos = self.$list.findIndex(function(rec) {
              return self.$$getKey(rec) === key;
            });
            if (pos !== -1) {
              cache[key] = pos;
            }
          }
          return cache.hasOwnProperty(key) ? cache[key] : -1;
        },
        $loaded: function(resolve, reject) {
          var promise = this._sync.ready();
          if (arguments.length) {
            promise = promise.then.call(promise, resolve, reject);
          }
          return promise;
        },
        $ref: function() {
          return this._ref;
        },
        $watch: function(cb, context) {
          var list = this._observers;
          list.push([cb, context]);
          return function() {
            var i = list.findIndex(function(parts) {
              return parts[0] === cb && parts[1] === context;
            });
            if (i > -1) {
              list.splice(i, 1);
            }
          };
        },
        $destroy: function(err) {
          if (!this._isDestroyed) {
            this._isDestroyed = true;
            this._sync.destroy(err);
            this.$list.length = 0;
          }
        },
        $getRecord: function(key) {
          var i = this.$indexFor(key);
          return i > -1 ? this.$list[i] : null;
        },
        $$added: function(snap) {
          var i = this.$indexFor($firebaseUtils.getKey(snap));
          if (i === -1) {
            var rec = snap.val();
            if (!angular.isObject(rec)) {
              rec = {$value: rec};
            }
            rec.$id = $firebaseUtils.getKey(snap);
            rec.$priority = snap.getPriority();
            $firebaseUtils.applyDefaults(rec, this.$$defaults);
            return rec;
          }
          return false;
        },
        $$removed: function(snap) {
          return this.$indexFor($firebaseUtils.getKey(snap)) > -1;
        },
        $$updated: function(snap) {
          var changed = false;
          var rec = this.$getRecord($firebaseUtils.getKey(snap));
          if (angular.isObject(rec)) {
            changed = $firebaseUtils.updateRec(rec, snap);
            $firebaseUtils.applyDefaults(rec, this.$$defaults);
          }
          return changed;
        },
        $$moved: function(snap) {
          var rec = this.$getRecord($firebaseUtils.getKey(snap));
          if (angular.isObject(rec)) {
            rec.$priority = snap.getPriority();
            return true;
          }
          return false;
        },
        $$error: function(err) {
          $log.error(err);
          this.$destroy(err);
        },
        $$getKey: function(rec) {
          return angular.isObject(rec) ? rec.$id : null;
        },
        $$process: function(event, rec, prevChild) {
          var key = this.$$getKey(rec);
          var changed = false;
          var curPos;
          switch (event) {
            case 'child_added':
              curPos = this.$indexFor(key);
              break;
            case 'child_moved':
              curPos = this.$indexFor(key);
              this._spliceOut(key);
              break;
            case 'child_removed':
              changed = this._spliceOut(key) !== null;
              break;
            case 'child_changed':
              changed = true;
              break;
            default:
              throw new Error('Invalid event type: ' + event);
          }
          if (angular.isDefined(curPos)) {
            changed = this._addAfter(rec, prevChild) !== curPos;
          }
          if (changed) {
            this.$$notify(event, key, prevChild);
          }
          return changed;
        },
        $$notify: function(event, key, prevChild) {
          var eventData = {
            event: event,
            key: key
          };
          if (angular.isDefined(prevChild)) {
            eventData.prevChild = prevChild;
          }
          angular.forEach(this._observers, function(parts) {
            parts[0].call(parts[1], eventData);
          });
        },
        _addAfter: function(rec, prevChild) {
          var i;
          if (prevChild === null) {
            i = 0;
          } else {
            i = this.$indexFor(prevChild) + 1;
            if (i === 0) {
              i = this.$list.length;
            }
          }
          this.$list.splice(i, 0, rec);
          this._indexCache[this.$$getKey(rec)] = i;
          return i;
        },
        _spliceOut: function(key) {
          var i = this.$indexFor(key);
          if (i > -1) {
            delete this._indexCache[key];
            return this.$list.splice(i, 1)[0];
          }
          return null;
        },
        _resolveItem: function(indexOrItem) {
          var list = this.$list;
          if (angular.isNumber(indexOrItem) && indexOrItem >= 0 && list.length >= indexOrItem) {
            return list[indexOrItem];
          } else if (angular.isObject(indexOrItem)) {
            var key = this.$$getKey(indexOrItem);
            var rec = this.$getRecord(key);
            return rec === indexOrItem ? rec : null;
          }
          return null;
        },
        _assertNotDestroyed: function(method) {
          if (this._isDestroyed) {
            throw new Error('Cannot call ' + method + ' method on a destroyed $firebaseArray object');
          }
        }
      };
      FirebaseArray.$extend = function(ChildClass, methods) {
        if (arguments.length === 1 && angular.isObject(ChildClass)) {
          methods = ChildClass;
          ChildClass = function(ref) {
            if (!(this instanceof ChildClass)) {
              return new ChildClass(ref);
            }
            FirebaseArray.apply(this, arguments);
            return this.$list;
          };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseArray, methods);
      };
      function ArraySyncManager(firebaseArray) {
        function destroy(err) {
          if (!sync.isDestroyed) {
            sync.isDestroyed = true;
            var ref = firebaseArray.$ref();
            ref.off('child_added', created);
            ref.off('child_moved', moved);
            ref.off('child_changed', updated);
            ref.off('child_removed', removed);
            firebaseArray = null;
            initComplete(err || 'destroyed');
          }
        }
        function init($list) {
          var ref = firebaseArray.$ref();
          ref.on('child_added', created, error);
          ref.on('child_moved', moved, error);
          ref.on('child_changed', updated, error);
          ref.on('child_removed', removed, error);
          ref.once('value', function(snap) {
            if (angular.isArray(snap.val())) {
              $log.warn('Storing data using array indices in Firebase can result in unexpected behavior. See https://www.firebase.com/docs/web/guide/understanding-data.html#section-arrays-in-firebase for more information.');
            }
            initComplete(null, $list);
          }, initComplete);
        }
        function _initComplete(err, result) {
          if (!isResolved) {
            isResolved = true;
            if (err) {
              def.reject(err);
            } else {
              def.resolve(result);
            }
          }
        }
        var def = $firebaseUtils.defer();
        var created = function(snap, prevChild) {
          waitForResolution(firebaseArray.$$added(snap, prevChild), function(rec) {
            firebaseArray.$$process('child_added', rec, prevChild);
          });
        };
        var updated = function(snap) {
          var rec = firebaseArray.$getRecord($firebaseUtils.getKey(snap));
          if (rec) {
            waitForResolution(firebaseArray.$$updated(snap), function() {
              firebaseArray.$$process('child_changed', rec);
            });
          }
        };
        var moved = function(snap, prevChild) {
          var rec = firebaseArray.$getRecord($firebaseUtils.getKey(snap));
          if (rec) {
            waitForResolution(firebaseArray.$$moved(snap, prevChild), function() {
              firebaseArray.$$process('child_moved', rec, prevChild);
            });
          }
        };
        var removed = function(snap) {
          var rec = firebaseArray.$getRecord($firebaseUtils.getKey(snap));
          if (rec) {
            waitForResolution(firebaseArray.$$removed(snap), function() {
              firebaseArray.$$process('child_removed', rec);
            });
          }
        };
        function waitForResolution(maybePromise, callback) {
          var promise = $q.when(maybePromise);
          promise.then(function(result) {
            if (result) {
              callback(result);
            }
          });
          if (!isResolved) {
            resolutionPromises.push(promise);
          }
        }
        var resolutionPromises = [];
        var isResolved = false;
        var error = $firebaseUtils.batch(function(err) {
          _initComplete(err);
          if (firebaseArray) {
            firebaseArray.$$error(err);
          }
        });
        var initComplete = $firebaseUtils.batch(_initComplete);
        var sync = {
          destroy: destroy,
          isDestroyed: false,
          init: init,
          ready: function() {
            return def.promise.then(function(result) {
              return $q.all(resolutionPromises).then(function() {
                return result;
              });
            });
          }
        };
        return sync;
      }
      return FirebaseArray;
    }]);
    angular.module('firebase').factory('$FirebaseArray', ['$log', '$firebaseArray', function($log, $firebaseArray) {
      return function() {
        $log.warn('$FirebaseArray has been renamed. Use $firebaseArray instead.');
        return $firebaseArray.apply(null, arguments);
      };
    }]);
  })();
  (function() {
    'use strict';
    var FirebaseAuth;
    angular.module('firebase').factory('$firebaseAuth', ['$q', '$firebaseUtils', function($q, $firebaseUtils) {
      return function(ref) {
        var auth = new FirebaseAuth($q, $firebaseUtils, ref);
        return auth.construct();
      };
    }]);
    FirebaseAuth = function($q, $firebaseUtils, ref) {
      this._q = $q;
      this._utils = $firebaseUtils;
      if (typeof ref === 'string') {
        throw new Error('Please provide a Firebase reference instead of a URL when creating a `$firebaseAuth` object.');
      }
      this._ref = ref;
      this._initialAuthResolver = this._initAuthResolver();
    };
    FirebaseAuth.prototype = {
      construct: function() {
        this._object = {
          $authWithCustomToken: this.authWithCustomToken.bind(this),
          $authAnonymously: this.authAnonymously.bind(this),
          $authWithPassword: this.authWithPassword.bind(this),
          $authWithOAuthPopup: this.authWithOAuthPopup.bind(this),
          $authWithOAuthRedirect: this.authWithOAuthRedirect.bind(this),
          $authWithOAuthToken: this.authWithOAuthToken.bind(this),
          $unauth: this.unauth.bind(this),
          $onAuth: this.onAuth.bind(this),
          $getAuth: this.getAuth.bind(this),
          $requireAuth: this.requireAuth.bind(this),
          $waitForAuth: this.waitForAuth.bind(this),
          $createUser: this.createUser.bind(this),
          $changePassword: this.changePassword.bind(this),
          $changeEmail: this.changeEmail.bind(this),
          $removeUser: this.removeUser.bind(this),
          $resetPassword: this.resetPassword.bind(this)
        };
        return this._object;
      },
      authWithCustomToken: function(authToken, options) {
        var deferred = this._q.defer();
        try {
          this._ref.authWithCustomToken(authToken, this._utils.makeNodeResolver(deferred), options);
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      authAnonymously: function(options) {
        var deferred = this._q.defer();
        try {
          this._ref.authAnonymously(this._utils.makeNodeResolver(deferred), options);
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      authWithPassword: function(credentials, options) {
        var deferred = this._q.defer();
        try {
          this._ref.authWithPassword(credentials, this._utils.makeNodeResolver(deferred), options);
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      authWithOAuthPopup: function(provider, options) {
        var deferred = this._q.defer();
        try {
          this._ref.authWithOAuthPopup(provider, this._utils.makeNodeResolver(deferred), options);
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      authWithOAuthRedirect: function(provider, options) {
        var deferred = this._q.defer();
        try {
          this._ref.authWithOAuthRedirect(provider, this._utils.makeNodeResolver(deferred), options);
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      authWithOAuthToken: function(provider, credentials, options) {
        var deferred = this._q.defer();
        try {
          this._ref.authWithOAuthToken(provider, credentials, this._utils.makeNodeResolver(deferred), options);
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      unauth: function() {
        if (this.getAuth() !== null) {
          this._ref.unauth();
        }
      },
      onAuth: function(callback, context) {
        var self = this;
        var fn = this._utils.debounce(callback, context, 0);
        this._ref.onAuth(fn);
        return function() {
          self._ref.offAuth(fn);
        };
      },
      getAuth: function() {
        return this._ref.getAuth();
      },
      _routerMethodOnAuthPromise: function(rejectIfAuthDataIsNull) {
        var ref = this._ref,
            utils = this._utils;
        return this._initialAuthResolver.then(function() {
          var authData = ref.getAuth(),
              res = null;
          if (rejectIfAuthDataIsNull && authData === null) {
            res = utils.reject("AUTH_REQUIRED");
          } else {
            res = utils.resolve(authData);
          }
          return res;
        });
      },
      _initAuthResolver: function() {
        var ref = this._ref;
        return this._utils.promise(function(resolve) {
          function callback() {
            ref.offAuth(callback);
            resolve();
          }
          ref.onAuth(callback);
        });
      },
      requireAuth: function() {
        return this._routerMethodOnAuthPromise(true);
      },
      waitForAuth: function() {
        return this._routerMethodOnAuthPromise(false);
      },
      createUser: function(credentials) {
        var deferred = this._q.defer();
        if (typeof credentials === "string") {
          throw new Error("$createUser() expects an object containing 'email' and 'password', but got a string.");
        }
        try {
          this._ref.createUser(credentials, this._utils.makeNodeResolver(deferred));
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      changePassword: function(credentials) {
        var deferred = this._q.defer();
        if (typeof credentials === "string") {
          throw new Error("$changePassword() expects an object containing 'email', 'oldPassword', and 'newPassword', but got a string.");
        }
        try {
          this._ref.changePassword(credentials, this._utils.makeNodeResolver(deferred));
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      changeEmail: function(credentials) {
        var deferred = this._q.defer();
        if (typeof this._ref.changeEmail !== 'function') {
          throw new Error("$firebaseAuth.$changeEmail() requires Firebase version 2.1.0 or greater.");
        } else if (typeof credentials === 'string') {
          throw new Error("$changeEmail() expects an object containing 'oldEmail', 'newEmail', and 'password', but got a string.");
        }
        try {
          this._ref.changeEmail(credentials, this._utils.makeNodeResolver(deferred));
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      removeUser: function(credentials) {
        var deferred = this._q.defer();
        if (typeof credentials === "string") {
          throw new Error("$removeUser() expects an object containing 'email' and 'password', but got a string.");
        }
        try {
          this._ref.removeUser(credentials, this._utils.makeNodeResolver(deferred));
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      },
      resetPassword: function(credentials) {
        var deferred = this._q.defer();
        if (typeof credentials === "string") {
          throw new Error("$resetPassword() expects an object containing 'email', but got a string.");
        }
        try {
          this._ref.resetPassword(credentials, this._utils.makeNodeResolver(deferred));
        } catch (error) {
          deferred.reject(error);
        }
        return deferred.promise;
      }
    };
  })();
  (function() {
    'use strict';
    angular.module('firebase').factory('$firebaseObject', ['$parse', '$firebaseUtils', '$log', function($parse, $firebaseUtils, $log) {
      function FirebaseObject(ref) {
        if (!(this instanceof FirebaseObject)) {
          return new FirebaseObject(ref);
        }
        this.$$conf = {
          sync: new ObjectSyncManager(this, ref),
          ref: ref,
          binding: new ThreeWayBinding(this),
          listeners: []
        };
        Object.defineProperty(this, '$$conf', {value: this.$$conf});
        this.$id = $firebaseUtils.getKey(ref.ref());
        this.$priority = null;
        $firebaseUtils.applyDefaults(this, this.$$defaults);
        this.$$conf.sync.init();
      }
      FirebaseObject.prototype = {
        $save: function() {
          var self = this;
          var ref = self.$ref();
          var data = $firebaseUtils.toJSON(self);
          return $firebaseUtils.doSet(ref, data).then(function() {
            self.$$notify();
            return self.$ref();
          });
        },
        $remove: function() {
          var self = this;
          $firebaseUtils.trimKeys(self, {});
          self.$value = null;
          return $firebaseUtils.doRemove(self.$ref()).then(function() {
            self.$$notify();
            return self.$ref();
          });
        },
        $loaded: function(resolve, reject) {
          var promise = this.$$conf.sync.ready();
          if (arguments.length) {
            promise = promise.then.call(promise, resolve, reject);
          }
          return promise;
        },
        $ref: function() {
          return this.$$conf.ref;
        },
        $bindTo: function(scope, varName) {
          var self = this;
          return self.$loaded().then(function() {
            return self.$$conf.binding.bindTo(scope, varName);
          });
        },
        $watch: function(cb, context) {
          var list = this.$$conf.listeners;
          list.push([cb, context]);
          return function() {
            var i = list.findIndex(function(parts) {
              return parts[0] === cb && parts[1] === context;
            });
            if (i > -1) {
              list.splice(i, 1);
            }
          };
        },
        $destroy: function(err) {
          var self = this;
          if (!self.$isDestroyed) {
            self.$isDestroyed = true;
            self.$$conf.sync.destroy(err);
            self.$$conf.binding.destroy();
            $firebaseUtils.each(self, function(v, k) {
              delete self[k];
            });
          }
        },
        $$updated: function(snap) {
          var changed = $firebaseUtils.updateRec(this, snap);
          $firebaseUtils.applyDefaults(this, this.$$defaults);
          return changed;
        },
        $$error: function(err) {
          $log.error(err);
          this.$destroy(err);
        },
        $$scopeUpdated: function(newData) {
          var def = $firebaseUtils.defer();
          this.$ref().set($firebaseUtils.toJSON(newData), $firebaseUtils.makeNodeResolver(def));
          return def.promise;
        },
        $$notify: function() {
          var self = this,
              list = this.$$conf.listeners.slice();
          angular.forEach(list, function(parts) {
            parts[0].call(parts[1], {
              event: 'value',
              key: self.$id
            });
          });
        },
        forEach: function(iterator, context) {
          return $firebaseUtils.each(this, iterator, context);
        }
      };
      FirebaseObject.$extend = function(ChildClass, methods) {
        if (arguments.length === 1 && angular.isObject(ChildClass)) {
          methods = ChildClass;
          ChildClass = function(ref) {
            if (!(this instanceof ChildClass)) {
              return new ChildClass(ref);
            }
            FirebaseObject.apply(this, arguments);
          };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseObject, methods);
      };
      function ThreeWayBinding(rec) {
        this.subs = [];
        this.scope = null;
        this.key = null;
        this.rec = rec;
      }
      ThreeWayBinding.prototype = {
        assertNotBound: function(varName) {
          if (this.scope) {
            var msg = 'Cannot bind to ' + varName + ' because this instance is already bound to ' + this.key + '; one binding per instance ' + '(call unbind method or create another FirebaseObject instance)';
            $log.error(msg);
            return $firebaseUtils.reject(msg);
          }
        },
        bindTo: function(scope, varName) {
          function _bind(self) {
            var sending = false;
            var parsed = $parse(varName);
            var rec = self.rec;
            self.scope = scope;
            self.varName = varName;
            function equals(scopeValue) {
              return angular.equals(scopeValue, rec) && scopeValue.$priority === rec.$priority && scopeValue.$value === rec.$value;
            }
            function setScope(rec) {
              parsed.assign(scope, $firebaseUtils.scopeData(rec));
            }
            var send = $firebaseUtils.debounce(function(val) {
              var scopeData = $firebaseUtils.scopeData(val);
              rec.$$scopeUpdated(scopeData)['finally'](function() {
                sending = false;
                if (!scopeData.hasOwnProperty('$value')) {
                  delete rec.$value;
                  delete parsed(scope).$value;
                }
              });
            }, 50, 500);
            var scopeUpdated = function(newVal) {
              newVal = newVal[0];
              if (!equals(newVal)) {
                sending = true;
                send(newVal);
              }
            };
            var recUpdated = function() {
              if (!sending && !equals(parsed(scope))) {
                setScope(rec);
              }
            };
            function watchExp() {
              var obj = parsed(scope);
              return [obj, obj.$priority, obj.$value];
            }
            setScope(rec);
            self.subs.push(scope.$on('$destroy', self.unbind.bind(self)));
            self.subs.push(scope.$watch(watchExp, scopeUpdated, true));
            self.subs.push(rec.$watch(recUpdated));
            return self.unbind.bind(self);
          }
          return this.assertNotBound(varName) || _bind(this);
        },
        unbind: function() {
          if (this.scope) {
            angular.forEach(this.subs, function(unbind) {
              unbind();
            });
            this.subs = [];
            this.scope = null;
            this.key = null;
          }
        },
        destroy: function() {
          this.unbind();
          this.rec = null;
        }
      };
      function ObjectSyncManager(firebaseObject, ref) {
        function destroy(err) {
          if (!sync.isDestroyed) {
            sync.isDestroyed = true;
            ref.off('value', applyUpdate);
            firebaseObject = null;
            initComplete(err || 'destroyed');
          }
        }
        function init() {
          ref.on('value', applyUpdate, error);
          ref.once('value', function(snap) {
            if (angular.isArray(snap.val())) {
              $log.warn('Storing data using array indices in Firebase can result in unexpected behavior. See https://www.firebase.com/docs/web/guide/understanding-data.html#section-arrays-in-firebase for more information. Also note that you probably wanted $firebaseArray and not $firebaseObject.');
            }
            initComplete(null);
          }, initComplete);
        }
        function _initComplete(err) {
          if (!isResolved) {
            isResolved = true;
            if (err) {
              def.reject(err);
            } else {
              def.resolve(firebaseObject);
            }
          }
        }
        var isResolved = false;
        var def = $firebaseUtils.defer();
        var applyUpdate = $firebaseUtils.batch(function(snap) {
          var changed = firebaseObject.$$updated(snap);
          if (changed) {
            firebaseObject.$$notify();
          }
        });
        var error = $firebaseUtils.batch(function(err) {
          _initComplete(err);
          if (firebaseObject) {
            firebaseObject.$$error(err);
          }
        });
        var initComplete = $firebaseUtils.batch(_initComplete);
        var sync = {
          isDestroyed: false,
          destroy: destroy,
          init: init,
          ready: function() {
            return def.promise;
          }
        };
        return sync;
      }
      return FirebaseObject;
    }]);
    angular.module('firebase').factory('$FirebaseObject', ['$log', '$firebaseObject', function($log, $firebaseObject) {
      return function() {
        $log.warn('$FirebaseObject has been renamed. Use $firebaseObject instead.');
        return $firebaseObject.apply(null, arguments);
      };
    }]);
  })();
  (function() {
    'use strict';
    angular.module("firebase").factory("$firebase", function() {
      return function() {
        throw new Error('$firebase has been removed. You may instantiate $firebaseArray and $firebaseObject ' + 'directly now. For simple write operations, just use the Firebase ref directly. ' + 'See the AngularFire 1.0.0 changelog for details: https://www.firebase.com/docs/web/libraries/angular/changelog.html');
      };
    });
  })();
  'use strict';
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
      if (this === undefined || this === null) {
        throw new TypeError("'this' is null or not defined");
      }
      var length = this.length >>> 0;
      fromIndex = +fromIndex || 0;
      if (Math.abs(fromIndex) === Infinity) {
        fromIndex = 0;
      }
      if (fromIndex < 0) {
        fromIndex += length;
        if (fromIndex < 0) {
          fromIndex = 0;
        }
      }
      for (; fromIndex < length; fromIndex++) {
        if (this[fromIndex] === searchElement) {
          return fromIndex;
        }
      }
      return -1;
    };
  }
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== "function") {
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }
      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function() {},
          fBound = function() {
            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
          };
      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();
      return fBound;
    };
  }
  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(predicate) {
        if (this == null) {
          throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;
        for (var i = 0; i < length; i++) {
          if (i in list) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return i;
            }
          }
        }
        return -1;
      }
    });
  }
  if (typeof Object.create != 'function') {
    (function() {
      var F = function() {};
      Object.create = function(o) {
        if (arguments.length > 1) {
          throw new Error('Second argument not supported');
        }
        if (o === null) {
          throw new Error('Cannot set a null [[Prototype]]');
        }
        if (typeof o != 'object') {
          throw new TypeError('Argument must be an object');
        }
        F.prototype = o;
        return new F();
      };
    })();
  }
  if (!Object.keys) {
    Object.keys = (function() {
      'use strict';
      var hasOwnProperty = Object.prototype.hasOwnProperty,
          hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
          dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
          dontEnumsLength = dontEnums.length;
      return function(obj) {
        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }
        var result = [],
            prop,
            i;
        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }
        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }
  if (typeof Object.getPrototypeOf !== "function") {
    if (typeof"test".__proto__ === "object") {
      Object.getPrototypeOf = function(object) {
        return object.__proto__;
      };
    } else {
      Object.getPrototypeOf = function(object) {
        return object.constructor.prototype;
      };
    }
  }
  (function() {
    'use strict';
    angular.module('firebase').factory('$firebaseConfig', ["$firebaseArray", "$firebaseObject", "$injector", function($firebaseArray, $firebaseObject, $injector) {
      return function(configOpts) {
        var opts = angular.extend({}, configOpts);
        if (typeof opts.objectFactory === 'string') {
          opts.objectFactory = $injector.get(opts.objectFactory);
        }
        if (typeof opts.arrayFactory === 'string') {
          opts.arrayFactory = $injector.get(opts.arrayFactory);
        }
        return angular.extend({
          arrayFactory: $firebaseArray,
          objectFactory: $firebaseObject
        }, opts);
      };
    }]).factory('$firebaseUtils', ["$q", "$timeout", "$rootScope", function($q, $timeout, $rootScope) {
      function Q(resolver) {
        if (!angular.isFunction(resolver)) {
          throw new Error('missing resolver function');
        }
        var deferred = $q.defer();
        function resolveFn(value) {
          deferred.resolve(value);
        }
        function rejectFn(reason) {
          deferred.reject(reason);
        }
        resolver(resolveFn, rejectFn);
        return deferred.promise;
      }
      var utils = {
        batch: function(action, context) {
          return function() {
            var args = Array.prototype.slice.call(arguments, 0);
            utils.compile(function() {
              action.apply(context, args);
            });
          };
        },
        debounce: function(fn, ctx, wait, maxWait) {
          var start,
              cancelTimer,
              args,
              runScheduledForNextTick;
          if (typeof(ctx) === 'number') {
            maxWait = wait;
            wait = ctx;
            ctx = null;
          }
          if (typeof wait !== 'number') {
            throw new Error('Must provide a valid integer for wait. Try 0 for a default');
          }
          if (typeof(fn) !== 'function') {
            throw new Error('Must provide a valid function to debounce');
          }
          if (!maxWait) {
            maxWait = wait * 10 || 100;
          }
          function resetTimer() {
            if (cancelTimer) {
              cancelTimer();
              cancelTimer = null;
            }
            if (start && Date.now() - start > maxWait) {
              if (!runScheduledForNextTick) {
                runScheduledForNextTick = true;
                utils.compile(runNow);
              }
            } else {
              if (!start) {
                start = Date.now();
              }
              cancelTimer = utils.wait(runNow, wait);
            }
          }
          function runNow() {
            cancelTimer = null;
            start = null;
            runScheduledForNextTick = false;
            fn.apply(ctx, args);
          }
          function debounced() {
            args = Array.prototype.slice.call(arguments, 0);
            resetTimer();
          }
          debounced.running = function() {
            return start > 0;
          };
          return debounced;
        },
        assertValidRef: function(ref, msg) {
          if (!angular.isObject(ref) || typeof(ref.ref) !== 'function' || typeof(ref.ref().transaction) !== 'function') {
            throw new Error(msg || 'Invalid Firebase reference');
          }
        },
        inherit: function(ChildClass, ParentClass, methods) {
          var childMethods = ChildClass.prototype;
          ChildClass.prototype = Object.create(ParentClass.prototype);
          ChildClass.prototype.constructor = ChildClass;
          angular.forEach(Object.keys(childMethods), function(k) {
            ChildClass.prototype[k] = childMethods[k];
          });
          if (angular.isObject(methods)) {
            angular.extend(ChildClass.prototype, methods);
          }
          return ChildClass;
        },
        getPrototypeMethods: function(inst, iterator, context) {
          var methods = {};
          var objProto = Object.getPrototypeOf({});
          var proto = angular.isFunction(inst) && angular.isObject(inst.prototype) ? inst.prototype : Object.getPrototypeOf(inst);
          while (proto && proto !== objProto) {
            for (var key in proto) {
              if (proto.hasOwnProperty(key) && !methods.hasOwnProperty(key)) {
                methods[key] = true;
                iterator.call(context, proto[key], key, proto);
              }
            }
            proto = Object.getPrototypeOf(proto);
          }
        },
        getPublicMethods: function(inst, iterator, context) {
          utils.getPrototypeMethods(inst, function(m, k) {
            if (typeof(m) === 'function' && k.charAt(0) !== '_') {
              iterator.call(context, m, k);
            }
          });
        },
        defer: $q.defer,
        reject: $q.reject,
        resolve: $q.when,
        promise: angular.isFunction($q) ? $q : Q,
        makeNodeResolver: function(deferred) {
          return function(err, result) {
            if (err === null) {
              if (arguments.length > 2) {
                result = Array.prototype.slice.call(arguments, 1);
              }
              deferred.resolve(result);
            } else {
              deferred.reject(err);
            }
          };
        },
        wait: function(fn, wait) {
          var to = $timeout(fn, wait || 0);
          return function() {
            if (to) {
              $timeout.cancel(to);
              to = null;
            }
          };
        },
        compile: function(fn) {
          return $rootScope.$evalAsync(fn || function() {});
        },
        deepCopy: function(obj) {
          if (!angular.isObject(obj)) {
            return obj;
          }
          var newCopy = angular.isArray(obj) ? obj.slice() : angular.extend({}, obj);
          for (var key in newCopy) {
            if (newCopy.hasOwnProperty(key)) {
              if (angular.isObject(newCopy[key])) {
                newCopy[key] = utils.deepCopy(newCopy[key]);
              }
            }
          }
          return newCopy;
        },
        trimKeys: function(dest, source) {
          utils.each(dest, function(v, k) {
            if (!source.hasOwnProperty(k)) {
              delete dest[k];
            }
          });
        },
        scopeData: function(dataOrRec) {
          var data = {
            $id: dataOrRec.$id,
            $priority: dataOrRec.$priority
          };
          var hasPublicProp = false;
          utils.each(dataOrRec, function(v, k) {
            hasPublicProp = true;
            data[k] = utils.deepCopy(v);
          });
          if (!hasPublicProp && dataOrRec.hasOwnProperty('$value')) {
            data.$value = dataOrRec.$value;
          }
          return data;
        },
        updateRec: function(rec, snap) {
          var data = snap.val();
          var oldData = angular.extend({}, rec);
          if (!angular.isObject(data)) {
            rec.$value = data;
            data = {};
          } else {
            delete rec.$value;
          }
          utils.trimKeys(rec, data);
          angular.extend(rec, data);
          rec.$priority = snap.getPriority();
          return !angular.equals(oldData, rec) || oldData.$value !== rec.$value || oldData.$priority !== rec.$priority;
        },
        applyDefaults: function(rec, defaults) {
          if (angular.isObject(defaults)) {
            angular.forEach(defaults, function(v, k) {
              if (!rec.hasOwnProperty(k)) {
                rec[k] = v;
              }
            });
          }
          return rec;
        },
        dataKeys: function(obj) {
          var out = [];
          utils.each(obj, function(v, k) {
            out.push(k);
          });
          return out;
        },
        each: function(obj, iterator, context) {
          if (angular.isObject(obj)) {
            for (var k in obj) {
              if (obj.hasOwnProperty(k)) {
                var c = k.charAt(0);
                if (c !== '_' && c !== '$' && c !== '.') {
                  iterator.call(context, obj[k], k, obj);
                }
              }
            }
          } else if (angular.isArray(obj)) {
            for (var i = 0,
                len = obj.length; i < len; i++) {
              iterator.call(context, obj[i], i, obj);
            }
          }
          return obj;
        },
        getKey: function(refOrSnapshot) {
          return (typeof refOrSnapshot.key === 'function') ? refOrSnapshot.key() : refOrSnapshot.name();
        },
        toJSON: function(rec) {
          var dat;
          if (!angular.isObject(rec)) {
            rec = {$value: rec};
          }
          if (angular.isFunction(rec.toJSON)) {
            dat = rec.toJSON();
          } else {
            dat = {};
            utils.each(rec, function(v, k) {
              dat[k] = stripDollarPrefixedKeys(v);
            });
          }
          if (angular.isDefined(rec.$value) && Object.keys(dat).length === 0 && rec.$value !== null) {
            dat['.value'] = rec.$value;
          }
          if (angular.isDefined(rec.$priority) && Object.keys(dat).length > 0 && rec.$priority !== null) {
            dat['.priority'] = rec.$priority;
          }
          angular.forEach(dat, function(v, k) {
            if (k.match(/[.$\[\]#\/]/) && k !== '.value' && k !== '.priority') {
              throw new Error('Invalid key ' + k + ' (cannot contain .$[]#)');
            } else if (angular.isUndefined(v)) {
              throw new Error('Key ' + k + ' was undefined. Cannot pass undefined in JSON. Use null instead.');
            }
          });
          return dat;
        },
        doSet: function(ref, data) {
          var def = utils.defer();
          if (angular.isFunction(ref.set) || !angular.isObject(data)) {
            ref.set(data, utils.makeNodeResolver(def));
          } else {
            var dataCopy = angular.extend({}, data);
            ref.once('value', function(snap) {
              snap.forEach(function(ss) {
                if (!dataCopy.hasOwnProperty(utils.getKey(ss))) {
                  dataCopy[utils.getKey(ss)] = null;
                }
              });
              ref.ref().update(dataCopy, utils.makeNodeResolver(def));
            }, function(err) {
              def.reject(err);
            });
          }
          return def.promise;
        },
        doRemove: function(ref) {
          var def = utils.defer();
          if (angular.isFunction(ref.remove)) {
            ref.remove(utils.makeNodeResolver(def));
          } else {
            ref.once('value', function(snap) {
              var promises = [];
              snap.forEach(function(ss) {
                var d = utils.defer();
                promises.push(d.promise);
                ss.ref().remove(utils.makeNodeResolver(def));
              });
              utils.allPromises(promises).then(function() {
                def.resolve(ref);
              }, function(err) {
                def.reject(err);
              });
            }, function(err) {
              def.reject(err);
            });
          }
          return def.promise;
        },
        VERSION: '1.1.3',
        allPromises: $q.all.bind($q)
      };
      return utils;
    }]);
    function stripDollarPrefixedKeys(data) {
      if (!angular.isObject(data)) {
        return data;
      }
      var out = angular.isArray(data) ? [] : {};
      angular.forEach(data, function(v, k) {
        if (typeof k !== 'string' || k.charAt(0) !== '$') {
          out[k] = stripDollarPrefixedKeys(v);
        }
      });
      return out;
    }
  })();
})(require("process"));
