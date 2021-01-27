/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/* global logger, request, openidm */
execute();

function execute() {

  //If this is a create(POST)
  if(request.method.equalsIgnoreCase('create')){
    // delete old repo object if it exists
    var searchResult = openidm.query('repo/idg/configmenu',{_queryFilter:'true', _fields:['_id','_rev']});
    if(searchResult.result && searchResult.result.length && searchResult.result[0]._id) {
      var id = searchResult.result[0]._id;
      var rev = searchResult.result[0]._rev;
      openidm.delete('repo/idg/configmenu/'+id, rev);
    }
    // create new repo object
    var fullObject = openidm.create('repo/idg/configmenu',null,request.content);
    return {definition:fullObject,fullId:fullObject._id};
  }
  //If this is a get of form idg/config/menu
  else if(request.method.equalsIgnoreCase('read')){
    var searchResult1 = openidm.query('repo/idg/configmenu',{_queryFilter:'true', _fields:['urls']});
    if(searchResult1.result !== null && searchResult1.result.length !== 0) {
      return searchResult1.result[0];
    }
    return {'urls':''};
  }
  var error = {code: 404, message:'No such method type supported'};

  throw error;
}

