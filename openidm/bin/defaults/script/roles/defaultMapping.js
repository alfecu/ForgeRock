/*
 * Copyright 2014-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/* global openidm, config, target, source, oldSource, existingTarget, linkQualifier */

/*
 * Default mapping script for processing effectiveAssignments.
 *
 */
(function () {
    var map = {"result": true},
            mappingName = config.name,
            assignmentOperations = require('roles/assignmentOperations'),
            effectiveAssignments = source.effectiveAssignments,
            defaultAssignmentOperation = "replaceTarget",
            defaultUnassignmentOperation = "removeFromTarget";

    // A map of operation aliases to their corresponding assignment operation functions
    var operationAliases = {
        "replaceTarget": assignmentOperations.replaceValues,
        "mergeWithTarget": assignmentOperations.mergeValues,
        "removeFromTarget": assignmentOperations.removeValues,
        "noOp": assignmentOperations.noOp
    };

    /**
     * Executes a script from the given configurations.
     *
     * @param {object} scriptConfig the script configuration
     */
    function execScript(scriptConfig) {
        // Check if the script is an alias or a full configuration
        if (!scriptConfig instanceof Object) {
            throw "Invalid script configuration: " + scriptConfig;
        }

        // Add additional scope fields
        var scope = {
            "sourceObject" : source,
            "targetObject" : target,
            "existingTargetObject" : existingTarget,
            "linkQualifier" : linkQualifier
        };
        for (var key in scriptConfig) {
            scope[key] = scriptConfig[key];
        }
        return openidm.action("script", "eval", scope, {});
    }

    /**
     * Overwrite the content of toObject with the content of fromObject.
     *
     * @param {Object} toObject the target object
     * @param {Object} fromObject the source object
     */
    function overwriteObject(toObject, fromObject) {
        for (var key in toObject) {
            delete toObject[key];
        }
        for (key in fromObject) {
            toObject[key] = fromObject[key];
        }
    }

    /**
     * Invoke an assignment operation for the provided target object, attribute name and value.
     *
     * @param {string} operation the assignment operation alias
     * @param {Object} target the existing target object
     * @param {string} name the target object attribute
     * @param {Object} value the new target object value
     * @param {Object} [attributesInfo] the optional attributesInfo state
     * @returns {unresolved}
     */
    function invokeOperation(operation, target, name, value, attributesInfo) {
        if (typeof attributesInfo === "undefined" || attributesInfo === null) {
             // Initialize if it has not already been defined for this attribute
             attributesInfo = {};
        }
        if (operation instanceof Object) {
            // script configuration
            var config = operation;
            config.attributeName = name;
            config.attributeValue = value;
            config.attributesInfo = attributesInfo;
            return execScript(config);
        } else if (operation instanceof String || typeof (operation) === 'string') {
            // assignment operation alias
            if (operationAliases.hasOwnProperty(operation)) {
                // Always provide the existingTarget object to assignment operations if available
                return operationAliases[operation](existingTarget || target, name, value, attributesInfo);
            } else {
                throw "Unsupported operation alias " + operation;
            }
        }
    }

    /**
     * Converts a List of effective assignments into a Map Object.
     *
     * @param {Object[]} effectiveAssignmentsList a list of assignments
     * @return {Object} the map object
     */
    function effectiveAssignmentsMap(effectiveAssignmentsList) {
        var eam = {};
        if (!effectiveAssignmentsList) {
            return eam;
        }
        for (var i = 0; i < effectiveAssignmentsList.length; i++) {
            eam[effectiveAssignmentsList[i]._id] = effectiveAssignmentsList[i];
        }
        return eam;
    }

    /**
     *
     * @param {object} source the existing source object
     * @returns {Object[]} the list of old effectiveAssignments
     */
    function oldAssignments(source) {
        return (typeof source.lastSync[mappingName] !== 'undefined')
                ? source.lastSync[mappingName].effectiveAssignments
                : null;
    }

    /**
     * Determine if the old source object has been provided.
     * @returns {Boolean} true if provided, otherwise false
     */
    function oldValueProvided() {
        return (typeof oldSource !== 'undefined' && oldSource !== null);
    }

    /**
     * Determine if the lastSync has been provided.
     * @param {Object} managedObject the source managed object
     * @returns {Boolean} true if provided, otherwise false
     */
    function lastSyncProvided(managedObject) {
        return (typeof managedObject.lastSync !== 'undefined' && managedObject.lastSync !== null);
    }

    // Check for any assignments that have been removed or modified
    if (lastSyncProvided(source) || oldValueProvided() && lastSyncProvided(oldSource)) {
        // Assignments from the last syncd snapshot
        var oldAssignments = oldValueProvided() && lastSyncProvided(oldSource)
                ? oldAssignments(oldSource)
                : oldAssignments(source);
        var effectiveAssignmentsMap = effectiveAssignmentsMap(source.effectiveAssignments);
        // Loop through old assignments
        if (typeof oldAssignments !== 'undefined' && oldAssignments !== null) {
            for (var x = 0; x < oldAssignments.length; x++) {
                var oldAssignment = oldAssignments[x];
                // Check that this assignment is relevant to this mapping
                if ((oldAssignment !== null) && (mappingName === oldAssignment.mapping)) {
                    var assignmentRemoved = false;
                    // Get the Current assignment, may be null if it has been removed/unassigned
                    var currentAssignment = effectiveAssignmentsMap[oldAssignment._id];
                    if (currentAssignment === null || (typeof currentAssignment === 'undefined')) {
                        // This assignment has been unassigned
                        // unAssignment included here as an option to support assignments that
                        // were mistakenly created with an incorrect name
                        var onUnassignment = oldAssignment.onUnassignment || oldAssignment.unAssignment;
                        // Check if an onUnassignment script is configured
                        if (typeof onUnassignment !== 'undefined' && onUnassignment !== null) {
                            onUnassignment.attributes = oldAssignment.attributes;
                            var result = execScript(onUnassignment);
                            if (result && (typeof result === 'object')) {
                                overwriteObject(target, result);
                            }
                        }
                        assignmentRemoved = true;
                    }
                    // Get the Old assignment's attributes
                    var oldAttributes = oldAssignment.attributes;
                    if (oldAttributes === null || (typeof oldAttributes === 'undefined')) {
                        oldAttributes = [];
                    }
                    // Loop through old attributes and execute the unassignmentOperation on any that were removed or updated
                    for (var i = 0; i < oldAttributes.length; i++) {
                        var oldAttribute = oldAttributes[i];
                        var removedOrUpdated = true;
                        // If the assignment has not been removed, then we need to check if the attribute has been removed or updated.
                        if (!assignmentRemoved && currentAssignment !== null) {
                            var currentAttributes = currentAssignment.attributes;
                            // Loop through attributes to check if they have been removed/updated
                            for (var j = 0; j < currentAttributes.length; j++) {
                                var currentAttribute = currentAttributes[j];
                                if (oldAttribute.name === currentAttribute.name) {
                                    if (JSON.stringify(oldAttribute) === JSON.stringify(currentAttribute)) {
                                        // attribute was found and not updated
                                        removedOrUpdated = false;
                                    }
                                    break;
                                }
                            }
                        }
                        // Check if the old attribute has been removed
                        if (removedOrUpdated) {
                            var assignmentResult = invokeOperation(
                                    oldAttribute.unassignmentOperation || defaultUnassignmentOperation,
                                    target,
                                    oldAttribute.name,
                                    oldAttribute.value);
                            target[oldAttribute.name] = assignmentResult.value;
                        }
                    }

                }
            }
        }
    }

    // Process effective assignments, if any
    if (typeof effectiveAssignments !== 'undefined' && effectiveAssignments !== null) {
        // Used to carry information across different assignmentOperations
        var attributesInfoMap = {};
        for (var x = 0; x < effectiveAssignments.length; x++) {
            assignment = effectiveAssignments[x];
            // Check that this assignment is relevant to this mapping
            if ((assignment !== null) && (mappingName === assignment.mapping)) {
                var attributes = assignment.attributes;
                if (attributes === null || (typeof attributes === 'undefined')) {
                    attributes = [];
                }
                var onAssignment = assignment.onAssignment;
                var linkQualifiers = assignment.linkQualifiers;

                // Only map if no linkQualifiers were specified or the current linkQualifier is in the list of linkQualifiers
                // specified in the assignment
                if (typeof linkQualifiers === 'undefined' || linkQualifiers === null
                        || linkQualifiers.indexOf(linkQualifier) > -1) {

                    // Check if an onAssignment script is configured
                    if (typeof onAssignment !== 'undefined' && onAssignment !== null) {
                        onAssignment.attributes = attributes;
                        var result = execScript(onAssignment);
                        if (result && (typeof result === 'object')) {
                            overwriteObject(target, result);
                        }
                    }

                    // Loop through attributes, performing the assignmentOperations
                    for (var i = 0; i < attributes.length; i++) {
                        var attribute = attributes[i];
                        var assignmentOperation = attribute.assignmentOperation || defaultAssignmentOperation;
                        var value = attribute.value;
                        var name = attribute.name;

                        var assignmentResult = invokeOperation(
                                assignmentOperation,
                                target,
                                name,
                                value,
                                attributesInfoMap[name]);
                        // Set the new target field's value
                        target[name] = assignmentResult.value;
                        // Update any passed back attributesInfo
                        if (assignmentResult.hasOwnProperty("attributesInfo")) {
                            attributesInfoMap[name] = assignmentResult.attributesInfo;
                        }
                    }
                }
            }
        }
    }

    // Return the resulting map
    return map;
}());