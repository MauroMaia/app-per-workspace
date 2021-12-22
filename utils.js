const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function _log(message) {
    log(`${Me.metadata.uuid} - ${message}`);
}
