// support for simple web API
// if query is edit collects author initials for editing
// else does not offer editor function
var amuse = {
  version : "7.0",
  date : "2015-05-28",
  session_init: function(coll, query){
    "use strict";
    var event;
    document.getElementById("report").innerHTML = "amuse: Version "+amuse.version+" ["+amuse.date+"]";
    window.Viewer.start(window[coll]);
    if (query){
      if (query === "edit"){
        window.Editor.edit_prompt(coll, window[coll]);
      }
      else{
        if (query in window[coll].objects){
          window.Viewer.display_object(query);
        }
        else{ // ~ is used at start of search string to indicate search for hash tag
           // instead of # , which in a uri search string is a fragment identifier 
          document.getElementById("filter_box").value = 
            query.replace(/%20/g, " ").replace(/%22/g, "\"").replace(/^~/,"#");
          if (window.event){ event = window.event; }
          else{ event = {}; }
          event.keyCode = 13;
          window.Viewer.filter_list(event);
        }
      }
      return "";
    }
    return "";
  }
};
