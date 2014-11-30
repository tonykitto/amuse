// amuse_um revision control
// check latest edition matches archive
var REV = {
  version : "1.2a", // node_webkit demo
  date : "2014-11-30",
  file_name : "",
  archive_name : "",
  archive : {},
  update : {},
  current : {},
  base : 0,
  latest : 0,
  // base is an edition number, list is the list from an archive property value
  get_base: function(base, list){
    var latest, list_length, i, entry, colon, edition;
    latest = "";
    list_length = list.length;
    for (i=0; i<list_length; i += 1){
      entry = list[i];
      colon = entry.indexOf(":");
      edition = parseInt(entry.slice(0,colon),10);
      if (edition > base){ return latest; }
      latest = entry.slice(colon+1);
    }
    return latest;
  },
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
  publish: function(){
    "use strict";
    function today(){
      var now;
      now = new Date();
      now = now.toDateString().split(" ");
      // day month date year
      return now[2]+" "+now[1]+" "+now[3];
    }
    
    var text, report;
    REV.update.date = today();
    text = JSON.stringify(window.REV.update, null, "  ");
    window.FSO.create_file(window.FSO.pwd+"objects/"+REV.archive_name+".js",
      "var "+REV.archive_name+" = "+text+";\n");
    report = REV.update_archive(REV.archive_name, REV.archive, REV.update);
    return report;
  },
// creates next edition by combining off-line update with current edition
  revise: function(){
    function last_edition(list){
      var entry, colon;
      entry = list[list.length-1];
      colon = entry.indexOf(":");
      return parseInt(entry.slice(0,colon), 10);
    }
    function same_objects(current, update){
      var obj, prop;
      for (obj in update){
        if (! (obj in current)){ return false; }
        for (prop in update[obj]){
          if (! (prop in current[obj])){ return false; }
          else{
            if (prop.charAt(0)==="$"){
              if (current[obj][prop].join("\t") !== update[obj][prop].join("\t")){
                return false;
              }
            }          
            else{ 
              if (current[obj][prop] !== update[obj][prop]){ return false; }
            }
          }
        }
      }
      return true;
    }
    
    var obj, prop, update_value, current_value, base_value, retained, meta;
    for (obj in REV.archive.objects){
      if (! (obj in REV.update.objects)){
        REV.update.objects[obj] = {};
      }
      for (prop in REV.archive.objects[obj]){
        if (! (prop in REV.update.objects[obj])){ update_value = ""; }
        else{ update_value = REV.update.objects[obj][prop]; }
        if (! (prop in REV.current.objects[obj])){ current_value = ""; }
        else{ current_value = REV.current.objects[obj][prop]; }
        base_value = REV.get_base(REV.base, REV.archive.objects[obj][prop]);
        if (update_value !== current_value){
          if (update_value === base_value){
            if (current_value){ REV.update.objects[obj][prop] = current_value; }
            else{ delete REV.update.objects[obj][prop]; }
          }
          else{
            if (last_edition(REV.archive.objects[obj][prop]) > REV.base){
              return "revision not allowed for "+obj+"."+prop+" due to subsequent baseline change";
            }
          }
        }
      }
    }
    if (! same_objects(REV.current.objects, REV.update.objects)){
    // overwrite all top level properties except the retained ones in update
    // with properties from current, delete all top level properties not present in current
      retained = {"edition":"", "author":"", "date":"","manual":"", "name":"","objects":""};
      for (meta in REV.current){
        if (! (meta in retained)){
          REV.update[meta] = REV.current[meta];
        }
      }
      for (meta in REV.update){
        if ((! (meta in REV.current)) && (! (meta in retained))){ delete REV.update[meta]; }
      }
      REV.update.edition = (REV.latest+1).toString();
      return REV.publish();
    }
    return "No change required for "+REV.file_name;
  },
  handleFiles: function(files){
    "use strict";
    var reader;
    if (! files[0]){return ""; }
    REV.file_name = files[0].name;
    if ((REV.file_name.indexOf("amuse_") === 0) && 
        (REV.file_name.slice(REV.file_name.lastIndexOf(".")) === ".json")){
          REV.archive_name = REV.file_name.slice(0, REV.file_name.lastIndexOf("_"));
    }
    else{ REV.archive_name = ""; }
    if (REV.archive_name.length>7){
      reader = new FileReader();
      reader.readAsText(files[0]);
      reader.onload = REV.add_update;
    }
    else{ alert("Selected file "+REV.file_name+" does not have a valid amuse_um JSON file name"); }
    return "";
  },
  start: function(){
    "use strict";
    document.getElementById("report").innerHTML =
      "Version "+REV.version+" ["+REV.date+"]";
    if (! ("root" in window)){alert("Can only run with node-webkit"); return ""; }
    window.FSO.init();
    window.FSO.pwd += "node_webkit/";
  },
  checks: function(evt){
    "use strict";
    function check_properties(o){
      var number_of_properties, number_of_groups, property_count, properties,
      i, group, j, property, k;
      if (! ("$props" in o)){
        return "The selected JSON file "+REV.file_name+" is missing a property list";
      }
      if (! ("$groups" in o)){
        return "The selected JSON file "+REV.file_name+" is missing a group list";
      }
      number_of_properties = o.$props.length;
      number_of_groups = o.$groups.length;
      property_count = 0;
      properties = {};
      for (i=0; i<number_of_groups; i += 1){
        group = o.$groups[i];
        if (! (group in o)){
            return "The selected JSON file "+REV.file_name+" has an missing group name "+group;
        }
        if (typeof o[group] === "string"){
           return "The selected JSON file "+REV.file_name+" has an invalid group "+group;
       }
        property_count += o[group].length;
        for (j=0; j<o[group].length; j += 1){
          property = o[group][j];
          if (property in properties){
            return "The selected JSON file "+REV.file_name+" has an invalid duplicate "+property;
          }
          else{ properties[property] = true; }
        }
      }
      if (number_of_properties !== property_count){
       return "The selected JSON file "+REV.file_name+
        " has an invalid number of properties";
      }
      for (k=0; k<number_of_properties; k += 1){
        if (! (o.$props[k] in properties)){
          return "The selected JSON file "+REV.file_name+
            " has an invalid property "+o.$props[k];
        }
      }
      return "";
    }
    
    var file, error_line, check, current_file, text, archive_file, list, key,
      valid_props, i, mandatory, obj, prop;
    file = evt.target.result;
    try{    
      REV.update = window.amuse_PARSE(file);
    }
    catch(arg){
      error_line = arg.text.slice(arg.line_start);
      error_line = error_line.slice(0, error_line.indexOf("\n")); 
      document.getElementById("report").innerHTML = "<br>Failed "+
        arg.name+" : "+arg.message+" at line "+arg.line_number+" : "+error_line;
      return "selected file is not a valid file";
    }
    if (! ("edition" in REV.update)){
      return "The selected JSON file "+REV.file_name+" is missing an edition number";
    }
    REV.base =parseInt(REV.update.edition, 10)-1;
    if (REV.base < 1){
      return REV.file_name+" edition "+REV.update.edition+" must be greater than 1";
    }
    if (! ("name" in REV.update)){
      return "The selected JSON file "+REV.file_name+" is missing its name property";
    }
    check = check_properties(REV.update);
    if (check){ return check; }
    current_file = window.FSO.pwd+"objects/"+REV.archive_name+".js";
    if (!window.FSO.file_exists(current_file)){
      return "Missing "+current_file;
    }
    text = window.FSO.read_file(current_file);
    text = text.slice(0,text.lastIndexOf("}")+1);
    text = text.slice(text.indexOf("{"));
    REV.current = JSON.parse(text);
    REV.latest = parseInt(REV.current.edition, 10);
    if (REV.latest < REV.base){
      return REV.file_name+" edition "+REV.update.edition+
        " is more than the base edition +1";
    }
    if (REV.update.name !== REV.current.name){
      return "The selected JSON file "+REV.file_name+" name does not match";
    }
    archive_file = window.FSO.pwd+"json_archive/"+REV.archive_name+".arch";
    if (!window.FSO.file_exists(archive_file)){
      return "Missing "+archive_file;
    }
    REV.archive = JSON.parse(window.FSO.read_file(archive_file));
    list = [];
    for (key in REV.archive.meta){ list.push(key); }
    if (REV.latest !== list.length){
      return "Cannot complete revision, latest edition does not match archive";
    }
    valid_props = {};
    for (i=0; i<REV.update.$props.length; i += 1){
      valid_props[REV.update.$props[i]] = true;
    }
    mandatory = REV.current.$props[0];
    if (REV.update.$props[0] !== mandatory){
      return "The selected JSON file "+REV.file_name+" $props[0] must be "+mandatory;
    }
    for (obj in REV.update.objects){
      if (! (mandatory in REV.update.objects[obj])){
        return "The selected JSON file "+REV.file_name+" missing "+obj+"."+mandatory;
      }
      for (prop in REV.update.objects[obj]){
        if (! (prop in valid_props)){
          return "The selected JSON file "+REV.file_name+
            " has invalid property "+obj+"."+prop;
        }
      }
    }
    return "";
  },
  add_update: function(evt){
    var result;
    result = REV.checks(evt);
    if (result){
      document.getElementById("report").innerHTML += "<br>"+result; 
      return ""; 
    }
    if (REV.base === REV.latest){
      result = REV.publish();
      if (result){
        document.getElementById("report").innerHTML += "<br>"+result;
      }
      else{ document.getElementById("report").innerHTML += "<br>Published "+REV.file_name; }
      return "";
    }
    else{
      result = REV.revise();
      if (result){
        document.getElementById("report").innerHTML += "<br>"+result; 
        return ""; 
      }
      document.getElementById("report").innerHTML += "<br>Completed revision for "+REV.file_name;
    }
    return "";
  }
};
onload = REV.start;