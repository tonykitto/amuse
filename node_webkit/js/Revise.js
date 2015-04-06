// amuse_um revision control
var Revise = (function(){
  "use strict";
  var version = "0.0", date = "2015-04-05";
  var file_name, // received by handleFiles (amuse_X.json)
  archive_name, // set by handleFiles (amuse_X)
  update_object = {}, // created by parsing the file_name content
  current_object = {}, // created by parsing the current file json content (objects/amuse_X.js)
  archive_object = {}; // created by parsing archive file (json_archive/amuse_X.arch)
// start initialises FSO  
  function start(){
    document.getElementById("report").innerHTML =
      "Version "+version+" ["+date+"]";
    if (! ("root" in window)){alert("Can only run with node-webkit"); return ""; }
    window.FSO.init();
    window.FSO.pwd += "amuse_um\\";
  }
// handleFiles invoked by onchange for fileInput
  function handleFiles(files){
    var reader;
    if (! files[0]){return ""; }
    file_name = files[0].name;
    if ((file_name.indexOf("amuse_") === 0) && 
        (file_name.slice(file_name.lastIndexOf(".")) === ".json")){
          archive_name = file_name.slice(0, file_name.lastIndexOf("."));
    }
    else{ archive_name = ""; }
    if (archive_name.length>6){
      reader = new FileReader();
      reader.readAsText(files[0]);
      reader.onload = Revise.add_update;
    }
    else{ alert("Selected file "+file_name+" does not have a valid amuse_um JSON file name"); }
    return "";
  }
// add_update invoked when selected file is loaded 
  function add_update(evt){
    // checks validates selected json file against the current object file
    function checks(evt){
      function check_properties(o){
        var number_of_properties, number_of_groups, property_count, properties,
        i, group, j, property, k;
        if (! ("$props" in o)){
          return "The selected JSON file "+file_name+" is missing a property list";
        }
        if (! ("$groups" in o)){
          return "The selected JSON file "+file_name+" is missing a group list";
        }
        number_of_properties = o.$props.length;
        number_of_groups = o.$groups.length;
        property_count = 0;
        properties = {};
        for (i=0; i<number_of_groups; i += 1){
          group = o.$groups[i];
          if (! (group in o)){
            return "The selected JSON file "+file_name+
              " has an missing group name "+group;
          }
          if (typeof o[group] === "string"){
           return "The selected JSON file "+file_name+" has an invalid group "+group;
          }
          property_count += o[group].length;
          for (j=0; j<o[group].length; j += 1){
            property = o[group][j];
            if (property in properties){
              return "The selected JSON file "+file_name+
                " has an invalid duplicate "+ property;
            }
            else{ properties[property] = true; }
          }
        }
        if (number_of_properties !== property_count){
          return "The selected JSON file "+file_name+
            " has an invalid number of properties";
        }
        for (k=0; k<number_of_properties; k += 1){
          if (! (o.$props[k] in properties)){
            return "The selected JSON file "+file_name+
              " has an invalid property "+o.$props[k];
          }
        }
        return "";
      }
      function string_hash(string){
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
      }
      function edition_string(o){
        return o.edition+o.author+o.date;
      }
          
      var file_content, error_line, check, current_file, text, archive_file, valid_props,
        i, mandatory, obj, prop;
      file_content = evt.target.result;
      try{    
        update_object = window.amuse_PARSE(file_content);
      }
      catch(arg){
        error_line = arg.text.slice(arg.line_start);
        error_line = error_line.slice(0, error_line.indexOf("\n")); 
        document.getElementById("report").innerHTML = "<br>Failed "+arg.name+
          " : "+arg.message+" at line "+arg.line_number+" : "+error_line;
        return "selected file is not a valid file";
      }
      if (! ("edition" in update_object)){
        return "The selected JSON file "+file_name+" is missing an edition number";
      }
      if (! ("name" in update_object)){
        return "The selected JSON file "+file_name+" is missing its name property";
      }
      check = check_properties(update_object);
      if (check){ return check; }
      current_file = window.FSO.pwd+"objects/"+archive_name+".js";
      if (!window.FSO.file_exists(current_file)){
        return "Missing "+current_file;
      }
      text = window.FSO.read_file(current_file);
      text = text.slice(0,text.lastIndexOf("}")+1);
      text = text.slice(text.indexOf("{"));
      current_object = JSON.parse(text);
      if (update_object.edition !== current_object.edition+
        ":"+string_hash(edition_string(current_object))){
        return "The selected JSON file "+file_name+" has an invalid edition value";
      }
      update_object.edition = ""+(1+parseInt(current_object.edition, 10));
      if (update_object.name !== current_object.name){
        return "The selected JSON file "+file_name+" name does not match";
      }
      archive_file = window.FSO.pwd+"json_archive/"+archive_name+".arch";
      if (!window.FSO.file_exists(archive_file)){
        return "Missing "+archive_file;
      }
      archive_object = JSON.parse(window.FSO.read_file(archive_file));
      valid_props = {};
      for (i=0; i<update_object.$props.length; i += 1){
        valid_props[update_object.$props[i]] = true;
      }
      mandatory = current_object.$props[0];
      if (update_object.$props[0] !== mandatory){
        return "The selected JSON file "+file_name+" $props[0] must be "+mandatory;
      }
      for (obj in update_object.objects){
        if (! (mandatory in update_object.objects[obj])){
          return "The selected JSON file "+file_name+" missing "+obj+"."+mandatory;
        }
        for (prop in update_object.objects[obj]){
          if (! (prop in valid_props)){
            return "The selected JSON file "+file_name+
              " has invalid property "+obj+"."+prop;
          }
        }
      }
      return "";
    }
    // publish overwrites current object file and then updates the archive file
    function publish(){
      function today(){
        var now;
        now = new Date();
        now = now.toDateString().split(" ");        
        return now[2]+" "+now[1]+" "+now[3]; // day month date year
      }
      // adds latest collection property values to the existing archive file
      function update_archive(collection, archive, update, current){
        function last_value(list){
          var value, colon;
          // expecting array of strings, each containing "number:value"
          if (list.length === 0){ return ""; }
          value = list[list.length-1];
          colon = value.indexOf(":");
          if (colon>0){ return value.slice(colon+1); }
          return "";
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
    }
     
      var text, report;
      update_object.manual = "no";
      update_object.date = today();
      text = JSON.stringify(update_object, null, "  ");
      window.FSO.create_file(window.FSO.pwd+"objects/"+archive_name+".js",
        "var "+archive_name+" = "+text+";\n");
      report = update_archive(archive_name, archive_object, update_object, current_object);
      return report;
    }
  
    var result;
    result = checks(evt);
    if (result){
      document.getElementById("report").innerHTML += "<br>"+result; 
      return ""; 
    }
    result = publish();
    if (result){
      document.getElementById("report").innerHTML += "<br>"+result;
    }
    else{ 
      document.getElementById("report").innerHTML += "<br>Published "+file_name;
    }
    return "";
  }
  function about(){
    return {"version": version, "date": date,
      "file_name": file_name, "archive_name": archive_name,
      "archive_object": archive_object, "update_object": update_object,
      "current_object": current_object};
  }
  
  return {
    "start": start,
    "handleFiles": handleFiles,
    "add_update": add_update,
    "about": about
  };
})();

onload = Revise.start;