// simple amuse_um json viewer
// added author check for editing
var CHOOSE = {
	version : "1.2",
  date : "2014-12-05",
  file_name : "",
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
      if (! ("name" in window.VIEW.collection)){window.VIEW.collection.name = "A selected json file"; }
      if (! ("$props" in window.VIEW.collection)){return "no property list in json"; }
      if (window.VIEW.collection.$props.length < 1){ return "no mandatory property key"; }
      return "completed "+window.VIEW.collection.name;
    }
    function file_name_stem(file_name){
      var tag, name, under;
      tag = file_name.lastIndexOf(".");
      if (tag>0){ name = file_name.slice(0, tag); }
      else{ name = file_name; }
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
      window.VIEW.collection = window.amuse_PARSE(file);
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
    document.getElementById("choice").innerHTML = "<h2>"+window.VIEW.collection.name+"</h2>";
    window.VIEW.file_name = file_name_stem(CHOOSE.file_name);
    if (! ("edition" in window.VIEW.collection)){
      window.VIEW.collection.edition = "0";
    }
    if (window.EDIT && ("setup_EDIT" in window.EDIT)){
      if (! window.VIEW.author){
        window.VIEW.author = prompt("Add initials for editing");
        if (window.VIEW.author){
          window.VIEW.editor = window.EDIT.setup_EDIT;
        }
      }
    }
    window.VIEW.start_VIEW(window.VIEW.collection);
    return "";
  },
	start: function(){
    "use strict";
		document.getElementById("report").innerHTML = "Version "+CHOOSE.version;
    CHOOSE.author = "";
		return "";
	}
};
      
onload = CHOOSE.start;       
