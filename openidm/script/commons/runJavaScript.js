/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

var __ = require('commons/utils/jsUtils.js');

var module_names = ['constraintsConverters', 'globalConstants', 'glossaryConstraints', 'glossaryCRUD', 'glossaryUtils', 'glossaryValidators', 'idmUtils', 'jsUtils', 'queryFilterBuilder', 'validate'];
var module_name_to_module = {};
module_names.forEach(function(module_name){
  var module_file_path = 'commons/utils/' + module_name + '.js';
  module_name_to_module[module_name] = require(module_file_path);
});

run();
function run() {
  /*
    ~~~~~~~~~ USAGE FROM GROOVY ~~~~~~~~
    Use the runJavaScript function in commonMethods.groovy:
        commonMethods.runJavaScript("generalUtilities", "tryMe", [<argument1here>, <argument2here>])

    ~~~~~~~~~ USAGE FROM AN HTTP-METHOD ~~~~~~~~
    method: POST
    URL: openidm/commons/runJavaScript
    body type: raw, JSON (application/json)
    body: {
      "module": "generalUtilities",
      "function": "tryMe",
      "args": [
        <argument1here>,
        <argument2here>
      ]
    }
  */
  var info = getRequestInfo();
  var func = info[0];
  var args = info[1];

  var result = func.apply(this, args);
  return {result: result};
}

function getRequestInfo() {
  // get the appropriate function that the url is asking for as well as the arguments to feed into it.
  // emit an error if this is impossible.

  // body/content
  if (!request.hasOwnProperty('content')) {
    __.requestError('Missing body.  You must send a body in your request.', 400);
  }
  var content = request['content'];

  // module name
  var module_param_name = 'module';
  if (!content.hasOwnProperty(module_param_name)) {
    __.requestError('Missing url parameter "' + module_param_name + '".', 400);
  }
  var module_name = content[module_param_name];

  // function name
  var function_param_name = 'function';
  if (!content.hasOwnProperty(function_param_name)) {
    __.requestError('Missing url parameter "' + function_param_name + '".', 400);
  }
  var function_name = content[function_param_name];

  // module
  if (!module_name_to_module.hasOwnProperty(module_name)) {
    __.requestError('A module by the name of "' + module_name + '" does not exist.', 400);
  }
  var module = module_name_to_module[module_name];

  // function
  if (!module.hasOwnProperty(function_name)) {
    __.requestError('A function by the name of "' + function_name + '" does not exist in the module "' + module_name + '".', 400);
  }
  var func = module[function_name];

  // args
  if (!content.hasOwnProperty('args')) {
    __.requestError('Body must have an "args" key whose value is an array of arguments (even if it\'s an empty array).', 400);
  }
  var args_dict = content['args'];
  var args = [];
  for (var index = 0; args_dict.hasOwnProperty(index.toString()); index++) {
    args.push(args_dict[index.toString()]);
  }

  return [func, args];
}
