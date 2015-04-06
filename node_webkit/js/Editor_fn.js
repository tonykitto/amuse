/* amuse_json collection editor special cases
 * if a property has a trigger function, the trigger function controls any change of property value */
var Editor_fn = (function(){
  "use strict";
  var version = "0.0", date = "2015-04-04";
  var collection, // the museum collection object
    fn = { "current_location" : movement_control }, // maps property to trigger function
    location_from, // set by movement_control
    location_to; // set by movement_control
    
// has_trigger called by Editor
    function has_trigger(property){
    if (property in fn){ return true; }
    return false;
  }
// trigger called by Editor
  function trigger(property, value, a_collection){
    collection = a_collection;
    fn[property](value);
    return "";
  }
/* movement control is triggered by a change to current_location
 * if the collection has a $location_history property, the  */
  function movement_control(term){
    function has_location_history(){
      var length, i;
      length = collection.$props.length;
      for (i=0; i< length; i += 1){
        if (collection.$props[i] === "$location_history"){
          return true;
        }
      }
      return false;
    }
    
    var loan, html;
    if ( has_location_history() &&  window.Editor.get_edit_original() ){
      location_from = window.Editor.get_edit_original();
      location_to = term;
      if (term === "on loan"){ loan = "in the form <b>On loan to X until Y</b>"; }
      else loan = "as appropriate";
      html = "<h3>Movement Control</h3><p>Add reason for movement<br>"+loan+
        "<ul><li>date: "+today()+"</li>"+
        "<li>from: "+location_from+"</li>"+
        "<li>to: "+location_to+"</li></ul>"+
        "Reason: <input type=\"text\" id=\"edit_box\" size=\"60\" value=\"\" />"+
        "<span class=\"ebutton\" id=\"save_button\" onclick='Editor_fn.save_movement_control(event)'>SAVE</span>"+
        "<span class=\"ebutton\" id=\"cancel_button\" onclick='Editor.cancel_edit(event)'>CANCEL</span>";
      document.getElementById("edit_props").innerHTML = html;
    }
    else{ // only the current_location is updated
      collection.objects[window.Editor.get_o_edit()].current_location = term;
      if (window.FSO){
        window.NW.log_string(window.Editor.get_o_edit(),"current_location",term);
      }
      window.Editor.show_publishing();
      window.Editor.edit_done();
    }
    return "";
  }
  
/* save_movement_control handles the onclick save button to update
 *  the location_history records */
  function save_movement_control(ev){
    var o, node, reason;
    ev.stopPropagation();
    o = collection.objects[window.Editor.get_o_edit()];
    node = document.getElementById("edit_box");
    reason = window.Editor.rinse(node.value);
    o.current_location = location_to;
    if (window.FSO){ 
      window.NW.log_string(window.Editor.get_o_edit(),"current_location",o.current_location);
    }
    if (! ("$location_history" in o)){o.$location_history = []; }
    o.$location_history.push("date: "+today()+",from: "+location_from+
      ",to: "+location_to+",reason: "+reason);
    if (window.FSO){
      window.NW.log_list(window.Editor.get_o_edit(),"$location_history",o.$location_history);
    }    
    if (location_to === "on loan"){ o.exhibit_note = reason; }
    else if (location_to.search("store") === 0){o.exhibit_note = "stored"; }
    else{o.exhibit_note = "displayed"; }
    if (window.FSO){ window.NW.log_string(window.Editor.get_o_edit(),"exhibit_note",o.exhibit_note); }
    window.Editor.show_publishing();
    window.Editor.edit_done();
    return "";
  }  
  function today(){
    var now;
    now = new Date();
    now = now.toDateString().split(" ");
    // day month date year
    return now[2]+" "+now[1]+" "+now[3];
  }
  function about(){
    return {"version": version, "date": date,
      "collection": collection, "fn" : fn,
      "location_from": location_from, "location_to": location_to
    };
  }
  
  return {
    "has_trigger": has_trigger,
    "trigger": trigger,
    "save_movement_control": save_movement_control,
    "about": about
  };
})();
