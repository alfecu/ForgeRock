/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file is for frontend utilities that are shared across applications.
*/

/**
 * Just a function that adds a prefix to all values in a dictionary.  Only used for frontend actionType making.
 *
 * @param      {string}  prefix_string  The prefix to put in front of each value
 * @param      {array}  list           The list of values
 * @return     {object}  The dictionary of keys and prefixed values
 */
function prefix(prefix_string, list) {
  const action_type_object = {};
  for (let string of list) {
    action_type_object[string] = '' + prefix_string + '/' + string;
  }
  return action_type_object;
}

module.exports = {
  prefix: prefix,
};
