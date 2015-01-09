// support for simple web API
// if query is edit collects author initials for editing
// else does not offer editor function
var amuse_um = {
  version : "5.0",
  date : "2014-12-29",
  session_init: function(coll, query){
    "use strict";
    var event;
    if (window.EDIT && ("setup_EDIT" in window.EDIT)){
      if (query === "edit"){
        window.VIEW.author = prompt("Add initials for editing");
        if (window.VIEW.author){
          window.VIEW.editor = window.EDIT.setup_EDIT;
        }
      }
    }
    window.VIEW.file_name = coll;
    window.VIEW.start_VIEW(window[coll]);
    if (query && query !== "edit"){
      if (query in window[coll].objects){
        window.VIEW.display_object(query);
      }
      else{ // ~ is used at start of search string to indicate search for hash tag
            // instead of # , which in a uri search string is a fragment identifier 
        document.getElementById("filter_box").value = 
          query.replace(/%20/g, " ").replace(/%22/g, "\"").replace(/^~/,"#");
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
