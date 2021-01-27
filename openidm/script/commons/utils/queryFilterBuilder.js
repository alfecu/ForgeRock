/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file is a place for building blocks that can be combined to create query filters.  By 'query filter', I am referring to the _queryFilter parameter in an IDM url such as http://10.0.51.2:9080/openidm/managed/user?_queryFilter=userName+eq+"m"+and+(accountStatus+eq+"active"+or+accountStatus+eq+"pending").  This file is a place to store commonly used filter pieces such as (accountStatus+eq+"active"+or+accountStatus+eq+"pending").  By convention, filter pieces in this file SHOULD include surrounding parenthesis.
*/

// imports
var _ = require('../lib/lodash4.js');
var __ = require('./jsUtils.js');
var CONSTANT = require('./globalConstants.js');

// core definitions
function _value(value) {
  // Takes in a value and outputs how the value should appear in the query filter.
  if (_.isString(value)) {
    return '"' + value + '"';
  }
  else {
    return value.toString();
  }
}

function _comparator(key, comp, value) {
  return '(' + key + ' ' + comp + ' ' + _value(value) + ')';
}

function _comparatorStringToComparatorFunc(comp) {
  // creates the comparator function for `comp`.
  return function(key, value) {
    return _comparator(key, comp, value);
  };
}
// The 'eq' function below, for example, queries for '(key eq "value")' or similar as appropriate.
var eq = _comparatorStringToComparatorFunc('eq');
var co = _comparatorStringToComparatorFunc('co');
var sw = _comparatorStringToComparatorFunc('sw');
var lt = _comparatorStringToComparatorFunc('lt');
var le = _comparatorStringToComparatorFunc('le');
var gt = _comparatorStringToComparatorFunc('gt');
var ge = _comparatorStringToComparatorFunc('ge');
var pr = _comparatorStringToComparatorFunc('pr');

function _repeated_operator(op, empty_list_value, query_list) {
  // for repeated operators such as 'and' and 'or'
  // queries for '(this op that)' when query_list is ['this', 'that']
  if (query_list === undefined) {
    __.requestError('Missing argument.', 500);
  }
  if (!_.isArray(query_list) && !__.__isArray(query_list)) {
    __.requestError('Bad type. query list must be an array.', 500);
  }
  // if empty list, cannot return '()', as this is an invalid query string
  if (query_list.length === 0) {
    return empty_list_value;
  }
  else {
    // make sure operator has surrounding spaces to avoid syntax error in query
    op = ' ' + op + ' ';
    return '(' + query_list.join(op) + ')';
  }
}

function or(query_list) {
  // queries for '(this or that)' when query_list is ['this', 'that']
  return _repeated_operator('or', CONSTANT.QUERY_FILTER.FALSE, query_list);
}

function and(query_list) {
  // queries for '(this and that)' when query_list is ['this', 'that']
  return _repeated_operator('and', CONSTANT.QUERY_FILTER.TRUE, query_list);
}

function not(query) {
  // note(ML): queries by convention must have enclosing parenthesis, so we assume `query` does.
  return '(' + '!' + query + ')';
}

function isId(id) {
  // queries whether the _id matches the given id
  return eq('_id', id);
}

function isIdIn(ids) {
  // queries whether the _id matches one of the given ids
  var queries = ids.map(isId);
  var query = or(queries);
  return query;
}

function coIn(term, keys) {
  // queries whether the term is `co`ntained `in` one of the keys
  // firstname co John || lastname co John ...
  var queries = _.map(keys, function(key){return co(key, term);});
  return or(queries);
}

function allCoIn(terms, keys) {
  // queries if `all` the terms are `co`ntained `in` one of the keys
  // (firstname co John || lastname co John) && (firstname co John || lastname co John) ...
  var queries = _.map(terms, function(term){return coIn(term, keys);});
  var query = and(queries);
  return query;
}

function swIn(term, keys) {
  // queries whether one of the keys start with the term
  // firstname sw John || lastname sw John ...
  var queries = _.map(keys, function(key){return sw(key, term);});
  return or(queries);
}

function allSwIn(terms, keys) {
  // queries if `all` the keys start with one of the terms
  // (firstname sw John || lastname sw John) && (firstname sw John || lastname sw John) ...
  var queries = _.map(terms, function(term){return swIn(term, keys);});
  var query = and(queries);
  return query;
}

module.exports = {
  // core definitions:
  not: not,
  and: and,
  or: or,
  eq: eq,
  co: co,
  sw: sw,
  lt: lt,
  le: le,
  gt: gt,
  ge: ge,
  pr: pr,
  // extra definitions:
  isId: isId,
  isIdIn: isIdIn,
  coIn: coIn,
  swIn: swIn,
  allCoIn: allCoIn,
  allSwIn: allSwIn,
};
