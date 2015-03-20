// amuse_um revision control
// bug fix to avoid duplicate empty value record
var REV = {
  version : "1.6",
  date : "2015-03-20",
  file_name : "",
  archive_name : "",
  archive : {},
  update : {},
  current : {},
  // adds latest collection property values to the existing archive file
  update_archive: function(collection, archive, update, current){
    "use strict";
    function last_value(list){
      var value, colon;
      value = list[list.length-1];
      colon = value.indexOf(":");
      if (colon>0){ return value.slice(colon+1); }
      return value;
    }
      
    var edition, key, obj, prop, value, latest;
    edition = update.edition;
    archive.meta[edition] = {};
    archive.meta[edition].author = update.author;
    archive.meta[edition].date = update.date;
    for (key in update){
      switch (key) {
        case "edition" : break;
        case "author" : break;
        case "date" : break;
        case "objects" : break;
        default:
          if (! (key in current)){
            archive.meta[edition][key] = update[key];
          }
          else{
            if (key.charAt(0) === "$"){
              if (current[key].join("\t") !== update[key].join("\t")){
                archive.meta[edition][key] = update[key];
              }
            }
            else{
              if (current[key] !== update[key]){
                archive.meta[edition][key] = update[key];
              }
            }
          }
      }
    }
    for (key in current){
      if (! (key in update)){ archive.meta[edition][key] = ""; }
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
        else{ 
          if (value){archive.objects[obj][prop].push(edition+":"); }
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
    REV.update.manual = "no";
    REV.update.date = today();
    text = JSON.stringify(window.REV.update, null, "  ");
    window.FSO.create_file(window.FSO.pwd+"objects/"+REV.archive_name+".js",
      "var "+REV.archive_name+" = "+text+";\n");
    report = REV.update_archive(REV.archive_name, REV.archive, REV.update, REV.current);
    return report;
  },
  handleFiles: function(files){
    "use strict";
    var reader;
    if (! files[0]){return ""; }
    REV.file_name = files[0].name;
    if ((REV.file_name.indexOf("amuse_") === 0) && 
        (REV.file_name.slice(REV.file_name.lastIndexOf(".")) === ".json")){
          REV.archive_name = REV.file_name.slice(0, REV.file_name.lastIndexOf("."));
    }
    else{ REV.archive_name = ""; }
    if (REV.archive_name.length>6){
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
    window.FSO.pwd += "amuse_um\\";
  },
  string_hash: function(string){
    "use strict";
    var hash, length, i, chr;
    hash = 0;
    length = string.length;
    if (length === 0){return 0; }
    for (i=0; i<length; i += 1){
      chr = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // 32-bit integer
    }
    return hash;
  },
  edition_string: function(o){
    return o.edition+o.author+o.date;
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
    
    var file, error_line, check, current_file, text, archive_file, valid_props,
      i, mandatory, obj, prop;
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
    if (REV.update.edition !== REV.current.edition+
      ":"+REV.string_hash(REV.edition_string(REV.current))){
      return "The selected JSON file "+REV.file_name+" has an invalid edition value";
    }
    REV.update.edition = ""+(1+parseInt(REV.current.edition, 10));
    if (REV.update.name !== REV.current.name){
      return "The selected JSON file "+REV.file_name+" name does not match";
    }
    archive_file = window.FSO.pwd+"json_archive/"+REV.archive_name+".arch";
    if (!window.FSO.file_exists(archive_file)){
      return "Missing "+archive_file;
    }
    REV.archive = JSON.parse(window.FSO.read_file(archive_file));
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
    "use strict";      
    var result;
    result = REV.checks(evt);
    if (result){
      document.getElementById("report").innerHTML += "<br>"+result; 
      return ""; 
    }
    result = REV.publish();
    if (result){
      document.getElementById("report").innerHTML += "<br>"+result;
    }
    else{ 
      document.getElementById("report").innerHTML += "<br>Published "+REV.file_name;
    }
    return "";
  }
};
onload = REV.start;