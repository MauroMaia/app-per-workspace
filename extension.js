/* extension.js
 *
 * Copyright (c) <year> <copyright holders>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/

/* exported init */

const { GLib, Meta, Shell, Notify } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Mainloop = imports.mainloop;

const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.utils;
//const extensionName = Me.metadata.name;
//const extensionUUID = Me.metadata.uuid;

const APP_STATES = [
    "0 - STOPPED",
    "1 - STARTING",
    "2 - RUNNING"
];

const IGNORE_THIS_APPS = [
    "Screenshot"
];

class Extension {
    constructor() {
        Lib._log(`initializing`);

        let { workspaceManager } = global;

        this._appSys = Shell.AppSystem.get_default();
        this._appStateChangedId = 0;
        this._last_app_id = "";
        this._workspaceManager = workspaceManager;
    }

    enable() {
        Lib._log(`enabling`);

        this._appStateChangedId = this._appSys.connect('app-state-changed',
            (appSys, app) => {

                //log(`App state change ${app.get_name()} ${APP_STATES[app.state]}`);

                if (app.state !== Shell.AppState.RUNNING)
                    return;
                
                if (app.is_on_workspace(this._workspaceManager.get_workspace_by_index(this._workspaceManager.get_n_workspaces() - 1))) 
                    return;

                if (app.get_id() === this._last_app_id){
                    Lib._log(`Removing source: ${this.last_timeout}`);
                    Mainloop.source_remove(this.last_timeout);
                }
                    
                Lib._log(`App ${app.get_name()} changed to required state: ${APP_STATES[app.state]}`);
                
                this._last_app_id = app.get_id();
                this.last_timeout = Mainloop.timeout_add(500, () => this._move_app_to_last_windows(app));
            });
    }

    _move_app_to_last_windows(app) {

        if (IGNORE_THIS_APPS.includes(app.get_name(), 0))
        {
            return;
        }

        Meta.later_add(Meta.LaterType.BEFORE_REDRAW, () => {
            if (app.state !== Shell.AppState.RUNNING)
                return;
            
            this._last_app_id = "";

            // TODO - handle drag
            let ws = this._workspaceManager.get_workspace_by_index(
                this._workspaceManager.get_n_workspaces() - 1
            );

            Lib._log(`Moving app ${app.get_name()} to worksapce ${ws.index()}`);

            let windows = app.get_windows();
            windows.forEach(w => {
                w.maximize(Meta.MaximizeFlags.BOTH);
                if (ws.index() != this._workspaceManager.get_active_workspace_index()) {
                    w.change_workspace(ws);
                }
            });
            ws.activate_with_focus(windows[0], global.get_current_time());

            return GLib.SOURCE_REMOVE;
        });
    }

    disable() {
        Lib._log(`disabling`);

        this._appSys.disconnect(this._appStateChangedId);
        this._appStateChangedId = 0;
    }
}

function init() {
    return new Extension();
}

