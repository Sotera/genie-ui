'use strict';
var async = require('async');
var deepExtend = require('deep-extend');
var log = require('debug')('routes');
var testDataLoaded = false;
var createdTestUsers = null;
var wordList = require('word-list-json');

for (var i = 0; i < wordList.length; ++i) {
  wordList[i] = wordList[i].charAt(0).toUpperCase() + wordList[i].slice(1);
}
module.exports = function (app) {

  app.get('/test', function (req, res) {
    res.end(generateHtml());
  });
  app.get('/load-test-data', function (req, res) {
    if (testDataLoaded) {
      res.end('<h1>Test Data Created!</h2>');
      return;
    }
    testDataLoaded = true;
    var AminoUser = app.models.AminoUser;
    async.series([createTestUsers], function (err, result) {
        if (err) {
          log(err);
          res.end('<h1>Test Data Created!</h2>');
          return;
        }
        createdTestUsers = result[2];
      }
    );
    function createCollectionEntry(objectTemplate, collection, minCount, maxCount, cb) {
      var numberOfEntries = randomInt(minCount, maxCount);
      var words = getWords(numberOfEntries);
      var users = [];
      var functionArray = [];
      for (var i = 0; i < words.length; ++i) {
        var moniker = words[i];
        var searchProperty = '';
        var searchPropertyValue = '';
        var objectToInsert = {};
        deepExtend(objectToInsert, objectTemplate);
        for (var property in objectToInsert) {
          if (typeof objectToInsert[property] == 'string') {
            if (objectToInsert[property].indexOf('__search-moniker__') != -1) {
              objectToInsert[property] = objectToInsert[property].replace('__search-moniker__', moniker);
              searchProperty = property;
              searchPropertyValue = objectToInsert[property];
            } else if (objectToInsert[property].indexOf('__aWord__') != -1) {
              objectToInsert[property] = getWords(10)[5];
            } else if (objectToInsert[property].indexOf('__htmlContent__') != -1) {
              objectToInsert[property] = generateHtml();
            } else if (objectToInsert[property].indexOf('__commentsContent__') != -1) {
              objectToInsert[property] = getSentence(40);
            } else {
              objectToInsert[property] = objectToInsert[property].replace('__moniker__', moniker);
            }
          }
        }
        var filter = {};
        filter['where'] = {};
        filter['where'][searchProperty] = searchPropertyValue;
        functionArray.push(async.apply(findOrCreateObj, collection, filter, objectToInsert));
      }
      async.series(functionArray, function (err, results) {
        var retVal = [];
        results.forEach(function (result) {
          if (result) {
            retVal.push(result);
          }
        });
        cb(err, retVal);
      });
    }

    function linkSomeHasAndBelongsToMany(firstArray, firstProperty, secondArray, cb) {
      var functionArray = [];
      firstArray.forEach(function (firstArrayElement) {
        //Get random half of the second array
        var randomHalfSecondArray = shuffle(secondArray).slice(0, secondArray.length / 2);
        //Add each second array element to firstArray[firstProperty]
        randomHalfSecondArray.forEach(function (randomHalfSecondArrayElement) {
          functionArray.push(async.apply(addObjectToEmbeddedList,
            firstArrayElement[firstProperty],
            randomHalfSecondArrayElement));
        });
      });
      async.series(functionArray, function (err, results) {
        cb(err, results);
      });
    }

    function addObjectToEmbeddedList(list, obj, cb) {
      list.add(obj, function (err, results) {
        cb(err, results);
      });
    }

    function createTestUsers(cb) {
      createCollectionEntry({
        firstName: '__moniker___first',
        lastName: '__moniker___last',
        email: '__moniker__@user.com',
        username: '__moniker__@user.com',
        password: 'password'
      }, AminoUser, 5, 10, function (err, result) {
        cb(err, result);
      });
    }

    function findOrCreateObj(model, query, objToCreate, cb) {
      try {
        model.findOrCreate(
          query,
          objToCreate, // create
          function (err, createdObj, created) {
            if (err) {
              log(err);
            }
            cb(err, created ? createdObj : null);
          });
      } catch (err) {
        log(err);
      }
    }
  });
};
function getSentence(numberOfWords, minWordLength, maxWordLength) {
  return getWords(numberOfWords, minWordLength, maxWordLength).join(' ') + '.';
}
var thousandSixLetterWords = [];
function getWords(numberOfWords, minWordLength, maxWordLength) {
  if(!thousandSixLetterWords.length){
    var wordListCursor = 0;
    while (wordList[++wordListCursor].length < 6);
    var startWordIdx = wordListCursor;
    while (wordList[++wordListCursor].length <= 6);
    var endWordIdx = wordListCursor;
    thousandSixLetterWords = shuffle(wordList.slice(startWordIdx, endWordIdx)).slice(0, 1000);
  }
  return shuffle(thousandSixLetterWords).slice(0, numberOfWords);
  //Use them all
/*  numberOfWords = numberOfWords || 250;
  minWordLength = minWordLength || 5;
  maxWordLength = maxWordLength || 7;
  var wordListCursor = 0;
  while (wordList[++wordListCursor].length < minWordLength);
  var startWordIdx = wordListCursor;
  while (wordList[++wordListCursor].length <= maxWordLength);
  var endWordIdx = wordListCursor;
  var words = [];
  for (var i = 0; i < numberOfWords; ++i) {
    words.push(wordList[randomInt(startWordIdx, endWordIdx)]);
  }
  return words;*/
}
function sometimes(howOftenOneToFifty) {
  howOftenOneToFifty = howOftenOneToFifty || 100;
  for (var i = 0; i < howOftenOneToFifty; ++i) {
    if (randomInt(0, 100) === 0) {
      return true;
    }
  }
  return false;
}
function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}
function generateHtml(wordCount) {
  wordCount = wordCount || 900;
  var words = getWords(wordCount);
  var html = '<html><head><h1>'
  html += getSentence(randomInt(4, 8));
  html += '</h1></head><body>';
  var para = '';
  for (var i = 0; i < wordCount; ++i) {
    para += words[i] + ' ';
    if (sometimes(2)) {
      html += '<p>' + para + '</p>';
      para = '';
    }
  }
  html += '</body></html>';
  return html;
}
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

