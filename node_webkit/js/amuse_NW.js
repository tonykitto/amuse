// Towneley amuse_um collection editor
// archive folder is json_archive
var NW = {
  version : "0.1a",
  date : "2014-10-12",
  object : {},
  archive: function(files, latest_edition){
    "use strict";
		function archive_json(coll, edition){
			function add_value(o, object, prop, number, value){
				// records each change of property value or property deletion
				// the number gives date of change recorded in the meta.date property
				var length, last_value;
				if (! (object in o)){ o[object] = {}; }
				if (! (prop in o[object])){o[object][prop] = []; }
				if (value === ""){ // records property has been deleted 
					o[object][prop].push(number+":");
				}
				else{
					if (typeof value !== "string"){ // array rather than string
						value = value.join("\t");
					}
					length = o[object][prop].length;
					if (length === 0){ o[object][prop].push(number+":"+value); }
					else{
						last_value = o[object][prop][length-1];
						// remove '#:' at front of value
						last_value = last_value.slice(last_value.indexOf(":")+1);
						if (value !== last_value){ o[object][prop].push(number+":"+value); }
					}
				}
				return "";
			}
			
			var archive_file, archive, n, file, next_file, x, y, object, prop, text;
      // load or create archive file
      archive_file = window.FSO.pwd+"json_archive\\"+coll+".arch";
      if (window.FSO.file_exists(archive_file)){
        archive = JSON.parse(window.FSO.read_file(archive_file));
      }
      else{ archive = {"meta":{}}; }
			n = parseInt(edition, 10);
			file = coll+"_"+edition+".json";
			next_file = coll+"_"+(n+1)+".json";
			if (! window.FSO.file_exists(window.FSO.pwd+"json\\"+next_file)){
				return "Cannot find "+next_file+", failed to complete archive";
			}
			x = JSON.parse(window.FSO.read_file(window.FSO.pwd+"json\\"+file));
			y = JSON.parse(window.FSO.read_file(window.FSO.pwd+"json\\"+next_file));
			archive.meta[edition] = x.date;
			for (object in x.objects){
				for (prop in x.objects[object]){
					add_value(archive,object,prop,n,x.objects[object][prop]);
					if (! (object in y.objects) || (! (prop in y.objects[object]))){
						// if property deleted in next edition, record now as it will be ignored 
						add_value(archive,object,prop,n+1,"");
					}
				}
			}
      text = JSON.stringify(archive, null, " ");
      window.FSO.create_file(archive_file, text);
      window.FSO.delete_file(window.FSO.pwd+"json\\"+file);
			return "";
		}

		var length, i, file, coll, edition, report;
		length = files.length;
		for (i=0; i<length; i += 1){
			file = files[i];
			coll = file.slice(0,file.lastIndexOf("_"));
			edition = file.slice(file.lastIndexOf("_")+1,-5);
			if (edition !== latest_edition){
				report = archive_json(coll, edition);
				if (report){return report; }
			}
		}
		return "";
	},
  // js_update updates web\objects padded json 
  js_update: function(collection, latest_edition){
    var json_file_name, js_file_name, text;
    json_file_name = window.FSO.pwd+"json\\"+collection+"_"+latest_edition+".json";
    js_file_name = window.FSO.pwd+"web\\objects\\"+collection+".js";
    if (! window.FSO.file_exists(json_file_name)){
      return "Missing "+json_file_name;
    }
    text = window.FSO.read_file(json_file_name);
    window.FSO.create_file(js_file_name,"var "+collection+" = "+text+";\n");
    return "";
  },
  list_amuse_files: function(collection, folder,  tag){
    var files, selected, len, i, file;
    files = window.FSO.get_file_names(window.FSO.pwd+folder);
    selected = [];
    len =files.length;
    for (i=0; i<len; i += 1){
      file = files[i];
      if (file.indexOf(collection) === 0){
        if ((file.slice(file.lastIndexOf(".")+1)) === tag){
          selected.push(file);
        }
      }
    }
    return selected;
  },
  json_checks: function(collection){
    "use strict";
    function content_same(js_name, edition){
      var json_text, js_file, js_text, o_json, o_js, report;
      json_text = window.FSO.read_file(window.FSO.pwd+"json\\"+js_name+"_"+edition+".json");
      // first remove any leading or trailing white space
      json_text = json_text.slice(0,json_text.lastIndexOf("}")+1);
      json_text = json_text.slice(json_text.indexOf("{"));
      // if EOL is CRLF, remove CR
      if (json_text.slice(0,3) === "{\r\n"){
        json_text = json_text.split("\r\n").join("\n");
      }
      js_file = window.FSO.pwd+"web\\objects\\"+js_name+".js";
      if (! window.FSO.file_exists(js_file)){
        alert("Missing "+js_file);
        return false;
      }
      js_text = window.FSO.read_file(js_file);
      // first remove var name and ending semi-colon
      js_text = js_text.slice(0,js_text.lastIndexOf("}")+1);
      js_text = js_text.slice(js_text.indexOf("{"));
      if (json_text === js_text){
        NW.object = JSON.parse(js_text);
        return true;
      }
      o_json = window.amuse_PARSE(json_text);
      if (o_json.manual === "true"){
        o_js = JSON.parse(js_text);
        if ( parseInt(o_json.edition, 10) === (parseInt(o_js.edition, 10)+1)){
          report = NW.js_update(js_name, edition);
          if (report){
            alert(report);
            return false;
          }
          alert("updated "+js_name+" with manual edition "+js_name+"_"+edition+".json");
          NW.object = o_json;
          return true;
        }
      }
      if (json_text.length === js_text.length){
        for (var i=0; i<json_text.length; i += 1){
          if (json_text.charAt(i) !== js_text.charAt(i)){
            alert(js_name+": Char at "+i+" is different ["+
              json_text.charAt(i)+":"+js_text.charAt(i)+"]");
            break;
          }
        }
      }
      else{
        alert(js_name+": json_text has "+json_text.length+
          " characters and js_text has "+js_text.length+" characters");
      }
      return false;
    }
    
    var files, length, latest, edition;
    files = window.VIEW.nat_sort(NW.list_amuse_files(collection, "json\\", "json"));
    length = files.length;
    if (length === 0){
      return "No "+collection+".json files";
    }
    latest = files[length-1];
    edition = latest.slice(latest.lastIndexOf("_")+1,-5);
    if (! content_same(collection, edition)){
      return collection+"_"+edition+".json does not match "+collection+".js";
    }
    return NW.archive(files, edition);
  },
  start: function(){
    "use strict";
    var select, name, o;
    document.getElementById("report").innerHTML =
      "Version "+NW.version+" ["+NW.date+"]";
    if (! ("root" in window)){alert("Can only run with node-webkit"); return ""; }
    window.FSO.init();
    window.FSO.pwd += "amuse_um\\node_webkit\\";
    window.VIEW.editor = window.EDIT.setup_EDIT;
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
    report = NW.json_checks(collection);
    if (report){ alert("Error: "+report); }
    else{
      window.VIEW.file_name = collection;
      window.VIEW.start_VIEW(NW.object);
    }
    return "";
  }
};
onload = NW.start;