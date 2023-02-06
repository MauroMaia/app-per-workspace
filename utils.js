const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function _d(message){
    _log("DEBUG",message)
}

function _i(message){
    _log("INFO",message)
}

function _log(logtype, message) {
    log(`${Me.metadata.uuid}[${logtype}] - ${message}`);
}
