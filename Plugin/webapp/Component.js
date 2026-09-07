/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/Component",
    "sap/m/Button",
    "sap/m/Bar",
    "sap/m/MessageToast",
    "sap/ui/VersionInfo",
    "sap/ushell/Container"
],
    function (Component, Button, Bar, MessageToast, VersionInfo, Container) {
        "use strict";

        return Component.extend("de.rewag.plugin.clientinfo.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                const rendererPromise = this._getRenderer();

                let metas = document.getElementsByTagName("meta");
                let sTitle;
                for (let meta of metas) {
                    if (meta.name === "sap.ushellConfig.serverSideConfig.1") {
                        let oInfos = JSON.parse(meta.content).startupConfig;
                        sTitle = oInfos.system + " / " + oInfos.client + " / " + sap.ushell.Container.getUser().getFullName();
                    }
                }

                VersionInfo.load().then((version) => {
                    const minorVersion = version.version.split(".").at(1);

                    if (parseInt(minorVersion) >= 120) {
                        Container.getServiceAsync("Extension").then(Extension => {
                            Extension.createHeaderItem({
                                ariaLabel: "headerItemSID-ariaLabel",
                                tooltip: "headerItem-tooltip",
                                text: sTitle !== undefined ? sTitle : "Client Information missing",
                            }, {
                                position: "begin",
                                helpId: "myHeaderItemHelpId"
                            });
                        });

                    } else {

                        rendererPromise.then(function (oRenderer) {

                            if (sTitle !== undefined) {
                                oRenderer.setHeaderTitle(sTitle);
                            } else {
                                oRenderer.setHeaderTitle("Client Information missing");
                            }
                        });
                    }
                });

            },
            /**
         * Returns the shell renderer instance in a reliable way,
         * i.e. independent from the initialization time of the plug-in.
         * This means that the current renderer is returned immediately, if it
         * is already created (plug-in is loaded after renderer creation) or it
         * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
         * before the renderer is created).
         *
         *  @returns {object}
         *      a jQuery promise, resolved with the renderer instance, or
         *      rejected with an error message.
         */
            _getRenderer: function () {
                var that = this,
                    oDeferred = new jQuery.Deferred(),
                    oRenderer;

                that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
                if (!that._oShellContainer) {
                    oDeferred.reject(
                        "Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
                } else {
                    oRenderer = that._oShellContainer.getRenderer();
                    if (oRenderer) {
                        oDeferred.resolve(oRenderer);
                    } else {
                        // renderer not initialized yet, listen to rendererCreated event
                        that._onRendererCreated = function (oEvent) {
                            oRenderer = oEvent.getParameter("renderer");
                            if (oRenderer) {
                                oDeferred.resolve(oRenderer);
                            } else {
                                oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
                            }
                        };
                        that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
                    }
                }
                return oDeferred.promise();
            }
        });
    }
);