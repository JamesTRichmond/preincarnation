/** Runs before the game module. Does not migrate. Quarantines saves this build must not rewrite. */

export function bootGuardSource(saveMax) {
  const max = Number(saveMax);
  if (!Number.isInteger(max) || max < 1) throw new Error("saveMax must be a positive integer");
  return `(function(){
"use strict";
var KEY="preincarnation.save.v1";
var MAX=${max};
var report={storage:"ok",action:"none",saveMax:MAX};
function finish(action){report.action=action;return report;}
try{
  var raw=localStorage.getItem(KEY);
  if(raw==null||raw==="")return finish("fresh");
  var parsed;
  try{parsed=JSON.parse(raw);}catch(e){
    try{localStorage.setItem(KEY+".unreadable",raw);}catch(ignore){}
    return finish("unreadable-kept");
  }
  var v=parsed&&typeof parsed.version==="number"?parsed.version:1;
  if(v>MAX){
    try{
      localStorage.setItem(KEY+".future",raw);
      localStorage.removeItem(KEY);
      var bak=localStorage.getItem(KEY+".bak");
      if(bak){
        try{
          var b=JSON.parse(bak);
          var bv=b&&typeof b.version==="number"?b.version:1;
          if(bv<=MAX)localStorage.setItem(KEY,bak);
        }catch(ignoreBak){}
      }
      try{localStorage.setItem("preincarnation.release.blocked","future-save");}catch(ignoreFlag){}
    }catch(err){
      try{localStorage.setItem(KEY,raw);}catch(ignoreRestore){}
      report.storage="unavailable";
      report.error=String(err&&err.name||err);
      return finish("untouched");
    }
    return finish("quarantine-future");
  }
  if(v<MAX){
    try{
      if(!localStorage.getItem(KEY+".premigration"))localStorage.setItem(KEY+".premigration",raw);
    }catch(err){
      report.storage="unavailable";
      report.error=String(err&&err.name||err);
      return finish("untouched");
    }
    return finish("snapshot-premigration");
  }
  return finish("current");
}catch(err){
  report.storage="unavailable";
  report.error=String(err&&err.name||err);
  return finish("untouched");
}
})()`;
}

export function runBootGuard(localStorage, saveMax) {
  const src = bootGuardSource(saveMax);
  const fn = new Function("localStorage", `"use strict"; return ${src};`);
  return fn(localStorage);
}
