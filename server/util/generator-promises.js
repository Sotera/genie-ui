'use strict';
// def: use promise values within ES6 generators.
// see https://www.promisejs.org/generators/
module.exports = function generatorPromises(generatorFunc) {
  return function() {
    var generator = generatorFunc.apply(this, arguments);

    function handle(result) {
      // result => { done: [Boolean], value: [Object] }
      if (result.done) return Promise.resolve(result.value);

      return Promise.resolve(result.value)
      .then(function(res) {
        return handle(generator.next(res));
      }, function(err) {
        return handle(generator.throw(err));
      });
    }

    try {
      return handle(generator.next());
    } catch(ex) {
      return Promise.reject(ex);
    }
  };
};
