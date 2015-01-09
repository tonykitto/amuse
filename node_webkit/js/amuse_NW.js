// Towneley amuse_um collection editor / archive function
// keep log of changes and avoid closing without saving changes
var NW = {
  version : "2.0",
  date : "2015-01-09",
  win : "",
  log_name : "",
  object : {},
  // adds latest collection property values to the existing archive file
  update_archive: function(collection, archive, update){
    "use strict";
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
    if (update.manual){ current_meta = get_meta(archive); }
    archive.meta[edition] = {};
    archive.meta[edition].author = update.author;
    archive.meta[edition].date = update.date;
    if (update.manual){
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
      if (! (obj in update.objects)){ return "Missing object "+obj+" in "+collection;}
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
    window.FSO.create_file(window.FSO.pwd+"json_archive/"+collection+".arch",
      JSON.stringify(archive, null, "  "));
    return "";
  },
  load_archive: function(collection){
    "use strict";
    var archive_file;
    archive_file = window.FSO.pwd+"json_archive/"+collection+".arch";
    if (! window.FSO.file_exists(archive_file)){ return "Missing "+archive_file; }
    return JSON.parse(window.FSO.read_file(archive_file));
  },
  archive: function(collection, update){
    "use strict";
    var arch;
    arch = NW.load_archive(collection);
    if (typeof arch === "string"){return arch; }
    return NW.update_archive(collection, arch, update);
  },
  archive_check: function(collection){
    "use strict";
    var js_file, js_text, arch, current_edition, list, key, last_edition;
    js_file = window.FSO.pwd+"objects/"+collection+".js";
    if (! window.FSO.file_exists(js_file)){
      return "Missing "+js_file;
    }
    arch = NW.load_archive(collection);
    if (typeof arch === "string"){return arch; }
    js_text = window.FSO.read_file(js_file);
    js_text = js_text.slice(0,js_text.lastIndexOf("}")+1);
    js_text = js_text.slice(js_text.indexOf("{"));
    NW.object = JSON.parse(js_text);
    current_edition = parseInt(NW.object.edition, 10);
    list = [];
    for (key in arch.meta){ list.push(key); }
    last_edition = list.length;
    if (current_edition !== last_edition){
      NW.update_archive(collection, arch, NW.object);
    }
    return "";
  },
  recover_last_session: function(lines){
    "use strict";
    function discard_file(){
      alert("The last session log is corrupt and has been discarded");
      window.FSO.copy_file(NW.log_name,
        NW.log_name.slice(0, NW.log_name.lastIndexOf("."))+".corrupt");
      return "";
    }
    function apply_changes(lines){
      var mandatory, valid_props, props_length, i, lines_length, j, line, parts,
        object, property, value, list;
      mandatory = NW.object.$props[0];
      valid_props = {};
      props_length = NW.object.$props.length;
      for (i=0; i<props_length; i += 1){
        valid_props[NW.object.$props[i]] = true;
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
          if (object in NW.object.objects){
            if (property in valid_props){
              if (property.charAt(0) !== "$"){
                if (! value){
                  if (property !== mandatory){
                    delete NW.object.objects[object][property];
                  }
                  else{ return "empty value for "+object+"."+mandatory; }
                }
                else{ NW.object.objects[object][property] = value; }
              }
              else{
                if (! value){ NW.object.objects[object][property] = []; }
                else{ NW.object.objects[object][property] = list; }
              }
            }
            else{ return "invalid property "+object+"."+property; }
          }
          else{
            if (property && (property === mandatory) && value){
              NW.object.objects[object] = {};
              NW.object.objects[object][property] = value;
              window.VIEW.full_list.push(object);
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
        NW.log_error(report);
        discard_file();
      }
      else{
        window.EDIT.publish();
        alert("Last session has been recovered and published");
      }
      NW.log_start();
      return "";
    }
    
    var line, parts, last_line, report;
    line = lines[0];
    parts = line.split("\t");
    if (! parts[0] && (parts[1] === "open") && (parts[2] === NW.object.edition)){
      last_line = lines[lines.length-1];
      if (! last_line){last_line = lines[lines.length-2]; }
      parts = last_line.split("\t");
      if ( ! parts[0] && (parts[1] === "close")){
        complete_publication(lines);
        return "";
      }
      report = apply_changes(lines);
      if (report){ NW.log_error(report); }
      else{
        alert("Continuing with previous session");
        window.EDIT.show_publishing();
        window.VIEW.reset_collection();
        return ""; 
      }
    }
    discard_file(); 
    NW.log_start();
    return "";
  },
  log_start: function(){
    "use strict";
    var now;
    now = new Date();
    window.FSO.create_file(NW.log_name,
      "\topen\t"+NW.object.edition+"\t"+window.VIEW.author+"\t"+now.toUTCString()+"\n");
    return "";
  },
  log_close: function(){
    "use strict";
    var now;
    now = new Date();
    window.FSO.log_file(NW.log_name, "\tclose\t"+now.toUTCString()+"\n");
    return "";
  },
  log_error: function(report){
    "use strict";
    window.FSO.log_file(NW.log_name, "\terror\t"+report+"\n");
    return "";
  },
  log_check: function(collection){
    "use strict";
    var lines;
    if (! window.VIEW.author){ return ""; }
    NW.log_name = window.FSO.pwd+"json_archive/"+collection+".log";
    if (! window.FSO.file_exists(NW.log_name)){ NW.log_start(); }
    else{
      lines = window.FSO.read_file(NW.log_name).split("\n");
      if (lines.length > 2){ NW.recover_last_session(lines); }
      else{ NW.log_start(); }
    }
    return "";
  },
  log_string: function(object, property, value){
    "use strict";
    window.FSO.log_file(NW.log_name,object+"\t"+property+"\t"+value+"\n");
    return "";
  },
  log_list: function(object, property, list){
    "use strict";
    window.FSO.log_file(NW.log_name,object+"\t"+property+"\t"+list.join("\t")+"\n");  
    return "";
  },
  before_unload: function(){
    var gui;
    gui = require('nw.gui');
    NW.win = gui.Window.get();
    NW.win.on('close', function(){
      if (window.EDIT && window.EDIT.o_publish){
        console.log("not closing before changes published or discarded");
      }
      else{ this.close(true); }
    });
    window.onbeforeunload = 
      function(){
        if (window.EDIT && window.EDIT.o_publish){
          return "Do you want to publish or discard changes before closing";
        }
        else{ return null; }
      };
  },
  start: function(){
    "use strict";
    var select, name, o;
    document.getElementById("report").innerHTML =
      "Version "+NW.version+" ["+NW.date+"]";
    if (! ("root" in window)){alert("Can only run with node-webkit"); return ""; }
    window.FSO.init();
    window.FSO.pwd += "amuse_um\\";
    window.VIEW.author = prompt("Add initials in order to edit");
    if (window.VIEW.author){
      window.VIEW.editor = window.EDIT.setup_EDIT;
      NW.before_unload();
    }
    else{ document.getElementById("headline").innerHTML = "amuse-um viewer only"; }
    select = "<option value=\"\">Select a collection </option>";
    for (name in window.amuse_NAMES){
      if (window.amuse_NAMES[name].charAt(0) !== "*"){
        select += "<option value=\""+name+"\">"+window.amuse_NAMES[name]+"</option>";
      }
    }
    o = document.getElementById("selected_choice");
    o.innerHTML = select;
    o.onchange = function(){NW.do_collection(o.value); };
    return "";
  },
  do_collection: function(collection){
    "use strict";
    var report;
    if (! collection){ return ""; }
    if (window.EDIT && window.EDIT.o_publish){
      document.getElementById("selected_choice").value = "";
      return "";
    }
    NW.object = {};
    report = NW.archive_check(collection);
    if (report){ alert("Error: "+report); }
    else{
      window.VIEW.file_name = collection;
      window.VIEW.start_VIEW(NW.object);
      NW.log_check(collection);
    }
    return "";
  }
};
onload = NW.start;