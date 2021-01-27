"use strict";

/*
 * Copyright 2017-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "jquery", "form2js", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function (_, $, form2js, AdminAbstractView, EventManager, Constants, ConfigDelegate) {

    var WorkflowView = AdminAbstractView.extend({
        template: "templates/admin/settings/WorkflowTemplate.html",
        element: "#workflowContainer",
        noBaseTemplate: true,
        events: {
            "click #saveWorkflow": "saveWorkflow"
        },
        model: {
            defaults: {
                "useDataSource": "default",
                "workflowDirectory": "&{idm.instance.dir}/workflow"
            }
        },
        dataSourceModel: {
            defaults: {
                "driverClass": "org.h2.Driver",
                "jdbcUrl": "jdbc:h2:file:&{idm.install.dir}/db/activiti/database;MVCC=FALSE;DB_CLOSE_DELAY=0",
                "databaseName": "activiti",
                "username": "sa",
                "password": "sa",
                "connectionTimeout": 30000,
                "connectionPool": {
                    "type": "hikari",
                    "minimumIdle": 1,
                    "maximumPoolSize": 5
                }
            }
        },
        data: {},

        render: function render() {
            var _this = this;

            $.when(ConfigDelegate.readEntityAlways("workflow"), ConfigDelegate.readEntityAlways("datasource.jdbc/default")).then(function (workflow, datasource) {
                _this.data.enabled = !_.isUndefined(workflow);
                _this.data.datasourceExists = !_.isUndefined(datasource);
                _this.model.workflow = workflow;

                _this.parentRender();
            });
        },

        saveWorkflow: function saveWorkflow(event) {
            var _this2 = this;

            event.preventDefault();

            var formDetails = form2js("workflowForm");

            if (formDetails.enabled && !this.data.enabled) {
                if (!this.data.datasourceExists) {
                    ConfigDelegate.createEntity("datasource.jdbc/default", this.dataSourceModel.defaults);
                }
                ConfigDelegate.createEntity("workflow", this.model.defaults).then(function () {
                    _this2.data.enabled = true;

                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "workflowSettingsSaveSuccess");
                    EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                });
            } else if (!formDetails.enabled && this.data.enabled) {
                ConfigDelegate.deleteEntity("workflow").then(function () {
                    _this2.data.enabled = false;

                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "workflowSettingsSaveSuccess");
                    EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                });
            }
        }
    });

    return new WorkflowView();
});
