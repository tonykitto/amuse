// Towneley amuse_um collection editor / archive function
var NW = {
  version : "1.0",
  date : "2014-11-22",
  object : {},
  // adds latest collection property values to the existing archive file
  update_archive: function(collection, archive, update){
    "use strict";
    function last_value(list){
      var value, colon;
      value = list[list.length-1];
      colon = value.indexOf(":");
      if (colon>0){ return value.slice(colon+1); }
      return value;
    }
      
    var edition, obj, prop, value, latest;
    edition = update.edition;
    archive.meta[edition] = {};
    archive.meta[edition].author = update.author;
    archive.meta[edition].date = update.date;
    archive.meta[edition].name = update.name;
    archive.meta[edition].$props = update.$props;
    for (obj in archive.objects){
      if (! (obj in update.objects)){ return "Missing object "+obj+" in "+collection;}
      for (prop in archive.objects[obj]){
        value = last_value(archive.objects[obj][prop]);
        if (prop in update.objects[obj]){
          latest = update.objects[obj][prop];
          if (prop.charAt(0) === "$"){ latest = latest.join("\t"); }
          if (value !== latest){ archive.objects[obj][prop].push(edition+":"+latest); }
        }
        else{ archive.objects[obj][prop].push(edition+":"); }
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
  start: function(){
    "use strict";
    var select, name, o;
    document.getElementById("report").innerHTML =
      "Version "+NW.version+" ["+NW.date+"]";
    if (! ("root" in window)){alert("Can only run with node-webkit"); return ""; }
    window.FSO.init();
    window.FSO.pwd += "amuse_um/node_webkit/";
    window.VIEW.author = prompt("Add initials for editing");
    if (window.VIEW.author){ window.VIEW.editor = window.EDIT.setup_EDIT; }
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
    }
    return "";
  }
};
onload = NW.start;