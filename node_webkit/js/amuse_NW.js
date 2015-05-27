// Towneley amuse collection editor / archive function
var NW = (function(){
  "use strict";
  var version = "0.1",date = "2015-05-27";
  var win = "",
  log_name = "",
  collection = {};
// initialises collections list  
  function start(){
    var select, name, o;
    document.getElementById("report").innerHTML =
      "Version "+version+" ["+date+"]";
    if (! ("root" in window)){alert("Can only run with node-webkit"); return ""; }
    window.FSO.init();
    window.FSO.pwd += "amuse\\";
    select = "<option value=\"\">Select a collection </option>";
    for (name in window.amuse_NAMES){
      if (window.amuse_NAMES[name].charAt(0) !== "*"){
        select += "<option value=\""+name+"\">"+window.amuse_NAMES[name]+"</option>";
      }
    }
    o = document.getElementById("selected_choice");
    o.innerHTML = select;
    o.onchange = function(){NW.load_collection(o.value); };
    return "";
  }
/* load_collection handles onchange for selected_choice, 
 * it first checks the archive is up-to-date, it tries to stop the session
 * from closing before any edits are published, it finally   */
  function load_collection(collection_name){
  /* archive_check tests the current edition of the selected collection to match
   * the last edition archived otherwise it attempts to complete the archive */
    function archive_check(collection_name){
      var js_file, js_text, archive, current_edition, list, key, last_edition;
      js_file = window.FSO.pwd+"objects/"+collection_name+".js";
      if (! window.FSO.file_exists(js_file)){
        return "Missing "+js_file;
      }
      archive = load_archive(collection_name);
      if (typeof archive === "string"){ // failure to find archive
       return archive; 
     }
      js_text = window.FSO.read_file(js_file);
      js_text = js_text.slice(0,js_text.lastIndexOf("}")+1);
      js_text = js_text.slice(js_text.indexOf("{"));
      collection = JSON.parse(js_text);
      current_edition = parseInt(collection.edition, 10);
      list = [];
      for (key in archive.meta){ list.push(key); }
      last_edition = list.length;
      if (current_edition !== last_edition){
        update_archive(collection_name, archive, collection);
      }
      return "";
    }
    function before_unload(){
      var gui;
      gui = window.require('nw.gui');
      win = gui.Window.get();
      win.on('close', function(){
        if (window.Editor && window.Editor.get_o_publish()){
          console.log("not closing before changes published or discarded");
        }
        else{ this.close(true); }
      });
      window.onbeforeunload = 
        function(){
          if (window.Editor && window.Editor.get_o_publish()){
            return "Do you want to publish or discard changes before closing";
          }
          else{ return null; }
        };
    }
    /* log_check, if editing is authorised, examines the log and if the last session 
    *  was not closed by publishing the changes, recovers by applying the log entries */
    function log_check(collection_name){
      function recover_last_session(lines){
        function discard_file(){
          alert("The last session log is corrupt and has been discarded");
          window.FSO.copy_file(log_name,
            log_name.slice(0, log_name.lastIndexOf("."))+".corrupt");
          return "";
        }
        function apply_changes(lines){
          var mandatory, valid_props, props_length, i, lines_length, j, line, parts,
            object, property, value, list;
          mandatory = collection.$props[0];
          valid_props = {};
          props_length = collection.$props.length;
          for (i=0; i<props_length; i += 1){
            valid_props[collection.$props[i]] = true;
          }
          lines_length = lines.length;
          for (j=1; j<lines_length; j += 1){
            line = lines[j];
            parts = line.split("\t");
            if (parts[0]){
              object = parts[0];
              property = parts[1];
              value = parts[2];
              list = parts.slice(2);
              if (object in collection.objects){
                if (property in valid_props){
                  if (property.charAt(0) !== "$"){
                    if (! value){
                      if (property !== mandatory){
                        delete collection.objects[object][property];
                      }
                      else{ return "empty value for "+object+"."+mandatory; }
                    }
                    else{ collection.objects[object][property] = value; }
                  }
                  else{
                    if (! value){ collection.objects[object][property] = []; }
                    else{ collection.objects[object][property] = list; }
                  }
                }
                else{ return "invalid property "+object+"."+property; }
              }
              else{
                if (property && (property === mandatory) && value){
                  collection.objects[object] = {};
                  collection.objects[object][property] = value;
                  window.Viewer.add_object(object);
                }
                else{ return "invalid object "+object; }
              }
            }
          }
          return "";
        }
        function complete_publication(lines){
          var report;
          report = apply_changes(lines);
          if (report){
            log_error(report);
            discard_file();
          }
          else{
            window.Editor.publish();
            alert("Last session has been recovered and published");
          }
          log_start();
          return "";
        }
    
        var line, parts, last_line, report;
        line = lines[0];
        parts = line.split("\t");
        if (! parts[0] && (parts[1] === "open") && (parts[2] === collection.edition)){
          last_line = lines[lines.length-1];
          if (! last_line){last_line = lines[lines.length-2]; }
          parts = last_line.split("\t");
          if ( ! parts[0] && (parts[1] === "close")){
            complete_publication(lines);
            return "";
          }
          report = apply_changes(lines);
          if (report){ log_error(report); }
          else{
            alert("Continuing with previous session");
            window.Editor.show_publishing();
            window.Viewer.display_list();
            window.Viewer.display_object(window.Viewer.last_object_number());
            return ""; 
          }
        }
        discard_file(); 
        log_start();
        return "";
      }
    
      var lines;
      if (window.Editor.get_author() === ""){ return ""; }
      log_name = window.FSO.pwd+"json_archive/"+collection_name+".log";
      if (! window.FSO.file_exists(log_name)){ log_start(); }
      else{
        lines = window.FSO.read_file(log_name).split("\n");
        if (lines.length > 2){ recover_last_session(lines); }
        else{ log_start(); }
      }
      return "";
    }
    
    var report;
    if (! collection_name){ return ""; }
    if (window.Editor && window.Editor.get_o_publish()){ 
      // must not change from a collection that is still being edited
      document.getElementById("selected_choice").value = "";
      return "";
    }
    collection = {};
    report = archive_check(collection_name);
    if (report){ alert("Error: "+report); }
    else{
      window.Viewer.start(collection);
      if (window.Editor){
        window.Editor.edit_prompt(collection_name, collection);
        if (window.Editor.get_author()){
          before_unload();
          log_check(collection_name);
        }
        else{ 
          document.getElementById("headline").innerHTML = "amuse viewer only"; 
        } 
      }
    }
    return "";
  }  
/* complete_archive adds latest collection property values to the existing archive file
 * either called by Editor directly after publishing the changes or 
 * on re-start in the event of a network failure before completion */
  function complete_archive(collection_name, update){
    var archive;
    archive = load_archive(collection_name);
    if (typeof archive === "string"){return archive; }
    return update_archive(collection_name, archive, update);
  }
// log functions called by NW and by Editor 
  function log_start(){
    var now;
    now = new Date();
    window.FSO.create_file(log_name,
      "\topen\t"+collection.edition+"\t"+window.Editor.get_author()+"\t"+now.toUTCString()+"\n");
    return "";
  }
  function log_string(object, property, value){
    window.FSO.log_file(log_name,object+"\t"+property+"\t"+value+"\n");
    return "";
  }
  function log_list(object, property, list){
    window.FSO.log_file(log_name,object+"\t"+property+"\t"+list.join("\t")+"\n");  
    return "";
  }
  function log_error(report){
    window.FSO.log_file(log_name, "\terror\t"+report+"\n");
    return "";
  }
  function log_close(){
    var now;
    now = new Date();
    window.FSO.log_file(log_name, "\tclose\t"+now.toUTCString()+"\n");
    return "";
  }
/* shared functions:  
 * load_archive and update_archive called by load_collection and complete_archive
 *  update_archive called by load_collection and */
  function load_archive(collection_name){
    var archive_file;
    archive_file = window.FSO.pwd+"json_archive/"+collection_name+".arch";
    if (! window.FSO.file_exists(archive_file)){ return "Missing "+archive_file; }
    return JSON.parse(window.FSO.read_file(archive_file));
  }
  function update_archive(collection_name, archive, update){
    function get_meta(archive){
      var meta, list, count, i, key, edition;
      meta = archive.meta["1"];
      list = [];
      for (key in archive.meta){ list.push(key); }
      count = list.length;
      if (count > 1){
        for (i=2; i<= count; i += 1){
          edition = archive.meta[i.toString()];
          for (key in edition){
            if (edition[key] !== ""){ meta[key] = edition[key]; }
            else{ delete meta[key]; }
          }
        }
      }
      return meta;
    }
    function last_value(list){
      var value, colon;
      // expecting array of strings, each containing "number:value"
      if (list.length === 0){ return ""; }
      value = list[list.length-1];
      colon = value.indexOf(":");
      if (colon>0){ return value.slice(colon+1); }
      return "";
    }
      
    var edition, current_meta, key, obj, prop, value, latest;
    edition = update.edition;
    if (update.manual==="yes"){ current_meta = get_meta(archive); }
    archive.meta[edition] = {};
    archive.meta[edition].author = update.author;
    archive.meta[edition].date = update.date;
    if (update.manual==="yes"){
      for (key in update){
        switch (key) {
          case "edition" : break;
          case "author" : break;
          case "date" : break;
          case "objects" : break;
          default:
            if (! (key in current_meta)){
              archive.meta[edition][key] = update[key];
            }
            else{
              if (key.charAt(0) === "$"){
                if (current_meta[key].join("\t") !== update[key].join("\t")){
                  archive.meta[edition][key] = update[key];
                }
              }
              else{
                if (current_meta[key] !== update[key]){
                  archive.meta[edition][key] = update[key];
                }
              }
            }
        }
      }
      for (key in current_meta){
        if (! (key in update)){ archive.meta[edition][key] = ""; }
      }
    }
    for (obj in archive.objects){
      if (! (obj in update.objects)){ return "Missing object "+obj+" in "+collection_name;}
      for (prop in archive.objects[obj]){
        value = last_value(archive.objects[obj][prop]);
        if (prop in update.objects[obj]){
          latest = update.objects[obj][prop];
          if (prop.charAt(0) === "$"){ latest = latest.join("\t"); }
          if (value !== latest){ archive.objects[obj][prop].push(edition+":"+latest); }
        }
        else{  // record change if value has been updated to empty string 
          if (value !== ""){archive.objects[obj][prop].push(edition+":"); }
        }
      }
    }
    for (obj in update.objects){
      if (! (obj in archive.objects)){ archive.objects[obj] = {};}
      for (prop in update.objects[obj]){
        if (! (prop in archive.objects[obj])){
          latest = update.objects[obj][prop];
          if (prop.charAt(0) === "$"){ latest = latest.join("\t"); }
          archive.objects[obj][prop] = [edition+":"+latest];
        }
      }
    }
    window.FSO.create_file(window.FSO.pwd+"json_archive/"+collection_name+".arch",
      JSON.stringify(archive, null, "  "));
    return "";
  }  
  // about for tests  
  function about(){
    return {"version": version, "date": date,
      "win": win, "log_name": log_name, "collection": collection
    };
  }
  
  return {
    "start": start,
    "load_collection": load_collection,
    "complete_archive": complete_archive,
    "log_start": log_start,
    "log_string": log_string,
    "log_list": log_list,
    "log_error": log_error,
    "log_close": log_close,
    "about": about
  };
})();

onload = NW.start;