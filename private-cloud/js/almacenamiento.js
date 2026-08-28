(function(){"use strict";
const PREFIX="santivanez_private_";
const KEYS={patients:PREFIX+"patients_v1",doctors:PREFIX+"doctors_v1",appointments:PREFIX+"appointments_v1",records:PREFIX+"records_v1",audit:PREFIX+"audit_v1"};
function clone(value){return JSON.parse(JSON.stringify(value));}
function parse(value,fallback){try{return JSON.parse(value)||fallback;}catch(_){return fallback;}}
function initialize(){Object.keys(KEYS).forEach((name)=>{if(!localStorage.getItem(KEYS[name]))localStorage.setItem(KEYS[name],JSON.stringify(clone(window.SantivanezPrivateSeed[name])));});}
function list(name){initialize();return parse(localStorage.getItem(KEYS[name]),[]);}
function save(name,value){if(!KEYS[name])throw new Error("Colección no permitida.");localStorage.setItem(KEYS[name],JSON.stringify(value));return value;}
function reset(){Object.keys(KEYS).forEach((name)=>localStorage.setItem(KEYS[name],JSON.stringify(clone(window.SantivanezPrivateSeed[name]))));}
window.PrivateStorage={KEYS,initialize,list,save,reset};initialize();
})();
