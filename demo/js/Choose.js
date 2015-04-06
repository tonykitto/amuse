// simple amuse_um json viewer
// added author check for editing
var CHOOSE = {
  start: function(){
    "use strict";
    var version = "1.0",
      date = "2015-04-03";
    document.getElementById("report").innerHTML = "CHOOSE Version "+version+" ["+date+"]";
    return "";
  },
  file_name : "",
  collection : {}, 
  handleFiles: function(files){
    "use strict";
    var reader;
    CHOOSE.file_name = files[0].name;
    reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = CHOOSE.checks;
  },
  checks: function(evt){
    "use strict";
    function check_schema(){
      if (! ("name" in CHOOSE.collection)){CHOOSE.collection.name = "A selected json file"; }
      if (! ("$props" in CHOOSE.collection)){return "no property list in json"; }
      if (CHOOSE.collection.$props.length < 1){ return "no mandatory property key"; }
      return CHOOSE.collection.name+" loaded";
    }
    function file_name_stem(file){
      var tag, name, under;
      tag = file.lastIndexOf(".");
      if (tag>0){ name = file.slice(0, tag); }
      else{ name = file; }
      under = name.lastIndexOf("_");
      if (under>0){
        if ( /^\d*$/.test(name.slice(under+1))){
          return name.slice(0, under);
        }
      }
      return name;
    }
    
    var file, error_line;
    file = evt.target.result;
    try{    
      CHOOSE.collection = window.amuse_PARSE(file);
    }
    catch(arg){
      alert("arg name is "+arg.name+" and message is "+arg.message);
      error_line = arg.text.slice(arg.line_start);
      error_line = error_line.slice(0, error_line.indexOf("\n")); 
      document.getElementById("report").innerHTML = "Failed "+
        arg.name+" : "+arg.message+" at line "+arg.line_number+" : "+error_line;
      return "";
    }
    document.getElementById("report").innerHTML = check_schema();
    document.getElementById("choice").innerHTML = "<h2>"+CHOOSE.collection.name+"</h2>";
    if (! ("edition" in CHOOSE.collection)){
      CHOOSE.collection.edition = "0";
    }
    window.Viewer.start(CHOOSE.collection);
    if (window.Editor){
      window.Editor.edit_prompt(file_name_stem(CHOOSE.file_name),CHOOSE.collection);
    }
    return "";
  }
};
      
onload = CHOOSE.start;       
