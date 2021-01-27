"use strict";

/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, AbstractDelegate, conf, Constants) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/config");

    obj.serviceCall = function (callParams) {

        // we don't want 404 errors to the config store to flash the typical "Not Found" warning to the user,
        // so we override the default 404 behavior with this simple stub handler.
        var defaultErrorsHandlers = {
            "Not found": {
                status: 404
            }
        };

        callParams.errorsHandlers = _.assignIn(callParams.errorsHandlers || {}, defaultErrorsHandlers);

        return Object.getPrototypeOf(obj).serviceCall.call(obj, callParams);
    };

    obj.getConfigList = function (successCallback, errorCallback) {
        return obj.serviceCall({ url: "", type: "GET", success: successCallback, error: errorCallback });
    };

    obj.configQuery = function (queryFilter, successCallback, errorCallback) {
        return obj.serviceCall({ url: "?_queryFilter=" + encodeURIComponent(queryFilter), type: "GET", success: successCallback, error: errorCallback });
    };

    obj.patchEntity = function (queryParameters, patchDefinition, successCallback, errorCallback) {
        return Object.getPrototypeOf(obj).patchEntity.call(obj, queryParameters, patchDefinition, successCallback, errorCallback).always(function () {
            delete conf.delegateCache.config[queryParameters.id];
        });
    };

    obj.readEntity = function (id, successCallback, errorCallback) {
        var promise = $.Deferred(),
            clone;

        if (!conf.delegateCache.config || !conf.delegateCache.config[id]) {
            if (!conf.delegateCache.config) {
                conf.delegateCache.config = {};
            }
            return Object.getPrototypeOf(obj).readEntity.call(obj, id, successCallback, errorCallback).then(function (result) {
                conf.delegateCache.config[id] = result;
                return $.extend(true, {}, result);
            }, function () {
                delete conf.delegateCache.config[id];
            });
        } else {
            clone = $.extend(true, {}, conf.delegateCache.config[id]);
            promise.resolve(clone);

            if (successCallback) {
                successCallback(clone);
            }
            return promise;
        }
    };

    /**
     *
     * @param url {string}
     * @returns promise {object}
     *
     * This should be used as an alternative to a simple readEntity when you need the results back regardless of success or failure.
     */
    obj.readEntityAlways = function (url) {
        var promise = $.Deferred();

        obj.readEntity(url).always(function (result) {
            promise.resolve(result);
        });

        return promise.promise();
    };

    obj.updateEntity = function (id, objectParam, successCallback, errorCallback) {
        // _id is not needed in calls to the config service, and can sometimes cause problems by being there.
        delete objectParam._id;

        return Object.getPrototypeOf(obj).updateEntity.call(obj, id, objectParam, successCallback, errorCallback).always(function () {
            delete conf.delegateCache.config[id];
        });
    };

    obj.deleteEntity = function (id, successCallback, errorCallback) {
        return Object.getPrototypeOf(obj).deleteEntity.call(obj, id, successCallback, errorCallback).always(function () {
            delete conf.delegateCache.config[id];
        });
    };

    obj.clearDelegateCache = function (id) {
        if (id) {
            delete conf.delegateCache.config[id];
        } else {
            conf.delegateCache.config = {};
        }
    };

    return obj;
});
