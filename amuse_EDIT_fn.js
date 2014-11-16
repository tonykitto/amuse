// amuse_json collection editor special cases
var EDIT_fn = {
  version : "1.0",
  date : "2014-11-16",
  today: function(){
    var now;
    now = new Date();
    now = now.toDateString().split(" ");
    // day month date year
    return now[2]+" "+now[1]+" "+now[3];
  },
  has_prop: function(property){
    "use strict";
    function has_location_history(){
      var length, i;
      length = window.VIEW.collection.$props.length;
      for (i=0; i< length; i += 1){
        if (window.VIEW.collection.$props[i] === "$location_history"){
          return true;
        }
      }
      return false;
    }
    
    switch (property){
      case "current_location":
        if (has_location_history()){ return true; }
        return false;
      case "normal_location":
        return false;
      default: return false;
    }
  },
  current_location: function(term){
    "use strict";
    var edit, loan, html;
    edit = window.EDIT;
    edit.location_from = edit.edit_original;
    edit.location_to = term;
    if (term === "on loan"){ loan = "in the form <b>On loan to X until Y</b>"; }
    else loan = "as appropriate";
    html = "<h3>Movement Control</h3><p>Add reason for movement<br>"+loan+
      "<ul><li>date: "+EDIT_fn.today()+"</li>"+
      "<li>from: "+edit.location_from+"</li>"+
      "<li>to: "+edit.location_to+"</li></ul>"+
      "Reason: <input type=\"text\" id=\"edit_box\" size=\"60\" value=\"\" />"+
      "<span class=\"ebutton\" id=\"save_button\" onclick='EDIT_fn.save_reason(event)'>SAVE</span>"+
      "<span class=\"ebutton\" id=\"cancel_button\" onclick='EDIT.cancel_edit(event)'>CANCEL</span>";
    document.getElementById("edit_props").innerHTML = html;
    return "";
  },
  // save_reason completes current_location update
  save_reason: function(ev){
    "use strict";
    var o, node, reason;
    ev.stopPropagation();
    o = window.VIEW.collection.objects[window.EDIT.o_edit];
    node = document.getElementById("edit_box");
    reason = window.EDIT.rinse(node.value);
    o.current_location = window.EDIT.location_to;
    if (! ("$location_history" in o)){o.$location_history = []; }
    o.$location_history.push("date: "+EDIT_fn.today()+",from: "+window.EDIT.location_from+
      ",to: "+window.EDIT.location_to+",reason: "+reason);
    if (window.EDIT.location_to === "on loan"){ o.exhibit_note = reason; }
    else if (window.EDIT.location_to.search("store") === 0){o.exhibit_note = "stored"; }
    else{o.exhibit_note = "displayed"; }
    window.EDIT.show_publishing();
    window.EDIT.edit_original = "";
    window.EDIT.edit_item = "";
    window.EDIT.editor = "opened";
    if (window.EDIT.o_edit === window.VIEW.list[window.VIEW.number]){
      window.VIEW.display_object(window.EDIT.o_edit);
    }
    window.EDIT.edit_group(window.EDIT.o_group);
    return "";
  } 

};
