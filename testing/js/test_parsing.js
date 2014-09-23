// amuse_um software validation
// testing amuse_PARSE
var TEST = {
	version : "0.0",
	date : "2014-06-09",
  start : "",
  finish : "",
  amuse : {},
  file_name : "",
  handleFiles: function(files){
    var reader;
    TEST.file_name = files[0].name;
    reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = TEST.testing;
  },
  testing: function(evt){
    function test_schema(){
      if (! ("name" in TEST.amuse)){return "no name in amuse"; }
      if (! ("$props" in TEST.amuse)){return "no property list in amuse"; }
      if (TEST.amuse.$props.length < 1){ return "no mandatory property key"; }
      return "completed "+TEST.amuse.name;
    }

    var json, time, error_line;
    json = evt.target.result;
    time = new Date();
    TEST.start = time.getTime();
    try{    
      TEST.amuse = amuse_PARSE(json);
    }
    catch(arg){
      error_line = arg.text.slice(arg.line_start);
      error_line = error_line.slice(0, error_line.indexOf("\n")); 
      document.getElementById("report").innerHTML = "Failed "+
        arg.name+" : "+arg.message+" at line "+arg.line_number+" : "+error_line;
      return ""
    }
    time = new Date();
    TEST.finish = time.getTime();
    alert("Completed Parse");
    document.getElementById("report").innerHTML = test_schema();
    return "";
  },
	start: function(){
		document.getElementById("report").innerHTML = 
			"Version "+TEST.version+" ["+TEST.date+"]";
		return "";
	}
};
      
onload = TEST.start;       
