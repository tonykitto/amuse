// support for simple web API 
var amuse_um = {
	version : "4.3",
	date : "2014-10-31",
	session_init: function(coll, query){
    "use strict";
    var event;
    if (window.EDIT && ("setup_EDIT" in window.EDIT)){
      if (! query){ window.VIEW.editor = window.EDIT.setup_EDIT; }
    }
    window.VIEW.file_name = coll;
    window.VIEW.start_VIEW(window[coll]);
    if (query){
      if (query in window[coll].objects){
        window.VIEW.display_object(query);
      }
      else{
        document.getElementById("filter_box").value = query.replace(/%20/g, " ").replace(/%22/g, "\"");
        if (window.event){ event = window.event; }
        else{ event = {}; }
        event.keyCode = 13;
        window.VIEW.frecord_handle(event);
      }
      return "";
    }
    return "";
	}
};
