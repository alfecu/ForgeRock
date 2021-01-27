/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

(function () {
    exports.preserveLastSync = function (object, oldObject, request) {
        if (request.getResourcePath !== "managed/user"
            && request.method === "update"
            && object.lastSync === undefined
            && oldObject.lastSync) {
            object.lastSync = oldObject.lastSync;
        }
    };
}());
