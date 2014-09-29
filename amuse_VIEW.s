// simple amuse_json collection viewer
var VIEW = {
	version : "1.0",
  date : "2014-09-09",
  album_image: -1,
  album: "",
  folder: "",
  collection : {},
  file_name : "",
  full_list : [],
  unsorted_list : [],
  list : [],
  names : {},
  number : 0,
  filter_input : "",
  sort_property : "",
  images : "",
  start_VIEW: function(collection){
    "use strict";
    var objects, id;
    VIEW.collection = collection;
    objects = VIEW.collection.objects;
    VIEW.full_list = [];
    for (id in objects){
      VIEW.full_list.push(id);
    }
    VIEW.unsorted_list = VIEW.full_list;
    VIEW.list =  VIEW.full_list;
    VIEW.update_names();
    VIEW.filter_input = "";
    VIEW.sort_property = "";
    document.getElementById("filter_box").value = ""; 
    document.getElementById("object_number").onkeydown = VIEW.krecord_handle;
    document.getElementById("filter_box").onkeydown = VIEW.frecord_handle;
    document.getElementById("clear_button").onclick = VIEW.find_clear;
    document.getElementById("move_down").onclick = function(){VIEW.krecord_handle(40); };
    document.getElementById("move_up").onclick = function(){VIEW.krecord_handle(38); };   
    VIEW.start_sort_list();
    VIEW.browsing();
    if ("editor" in VIEW){ VIEW.editor(); }
    else{ document.getElementById("report").innerHTML =
      "Version "+VIEW.version+" ["+VIEW.date+"]"; }
    return "";
  },
  display_object: function(object_number){
    "use strict";
    function display_list(prop, list){
      function add_links(list, ref){
        var html, i, link;
        html = [];
        for (i in list){
          link = list[i];
          html.push("<li><a target=\"_blank\" href=\"web/"+ref+".html?"+link+"\">"+link+"</a></li>");
        }
        return html.join(" ");
      }
    
      var html, i;
      if ((prop.charAt(0) !== "$") || (!(length in list))){return "<li>invalid "+prop+"</li>"; }
      html = "<ul><span class=\"centred\">"+prop+"</span>";
      switch (prop){
        case "$doc_links" :
          html += add_links(list, "AZ_viewer");
          break;
        case "$images":
          i = list.length;
          if (i > 3){
            html += "<li>"+list[0]+"</li><li>...</li><li>"+list[i-1]+"</li>";
          }
          else{
            for (i in list){ html += "<li>"+list[i]+"</li>"; }
          }
          break;
        default :
          for (i in list){
            html += "<li>"+list[i]+"</li>";
          }
          break;
      }
      return html+"</ul>";
    }

    var object, content, valid, view_groups, i, group, key_list, group_result, j, prop;
    document.getElementById("object_number").value = object_number;
    VIEW.number = VIEW.names[object_number];
    object = VIEW.collection.objects[object_number];
    if (("image" in object) && (object.image.indexOf(".jpg")>0)){
      content = "<div id=\"img_block\"><p><a target=\"_blank\" href=\""+
      VIEW.images+object.image+"\" ><img id=\"primary\" src=\"../images/"+
      VIEW.images+object.image+"\" /></a><br>"+object.image+"</p></div>";
    }
    else if (("primary_image" in object) && (object.primary_image.indexOf(".jpg")>0) ){
      content = "<div id=\"img_block\"><p><a target=\"_blank\" href=\""+
      object.primary_image+"\" ><img id=\"primary\" src=\""+
      object.primary_image+"\" /></a><br>"+
      object.primary_image.slice(object.primary_image.lastIndexOf("/")+1)+"</p></div>";
    }
    else{ content = ""; }
    content += "<h4>"+object_number+"</h4><ul>";
    valid = false;
    view_groups = VIEW.collection.$groups;
    for (i in view_groups){
      group = view_groups[i];
      key_list = VIEW.collection[group];
      if (key_list.length>0){
        group_result = "";
        for (j in key_list){
          prop = key_list[j];
          if (typeof object[prop] === "string"){
            group_result += "<li>"+prop+" : "+object[prop]+"</li>";
          }
          else if ( typeof object[prop] === "object" ){
            group_result += display_list(prop, object[prop]);
          }
        }
        if (group_result){
          valid = true;
          content += "<b>"+group+"</b><ul>"+group_result+"</ul>";
        }
      }
    }
    if (! valid){content += "<li>No properties to display </li>";}
    content += "</ul>";
    document.getElementById("object").innerHTML = content+VIEW.album_init(object);
    return "";
  },
  browsing: function(){
    "use strict";
    var o, edition, date, html, first_prop, i, object_number;
    o = VIEW.collection;
    if ("edition" in o){ edition = o.edition; } else { edition = ""; }
    if ("date" in o){ date = o.date; } else { date = "undated"; }
    VIEW.images = "../images/";
    if ("image_folder" in o){ VIEW.images+= o.image_folder; }
    html = ["<h3>"+o.name+" "+edition+" "+date+"</h3>"];
    html.push("<p class=\"centred\">listed "+VIEW.list.length+" of "+
    VIEW.full_list.length+" objects</p>");
    first_prop = o.$props[0];
    html.push("<ul>");
    for (i in VIEW.list){
      object_number = VIEW.list[i];
      html.push("<li><b class=\"show\" onclick='VIEW.display_object(\""+object_number+"\")' >"+
        object_number+"</b>: "+o.objects[object_number][first_prop]+"</li>");
    }
    html.push("</ul>");
    document.getElementById("browser").innerHTML = html.join("\r\n");
    object_number = VIEW.list[VIEW.number];
    document.getElementById("object_number").value = object_number;
    VIEW.display_object(object_number);
    return "";
  },
  reset_collection: function(){
    "use strict";
    document.getElementById("filter_box").value = "";
    VIEW.filter_input = "";
    document.getElementById("selected_sort").value = "";
    VIEW.sort_property = "";
    VIEW.unsorted_list = VIEW.full_list;
    VIEW.list = VIEW.full_list;
    VIEW.update_names();
    VIEW.browsing();
    return "";
  },
	krecord_handle: function(e){
    "use strict";
    function trim(text){
      return (text || "").replace(/^\x20+|\x20+$/g,"");
    }

		var keyCode, text, object_number;
    if (typeof e === "number"){keyCode = e; }
    else{
      keyCode = (window.event) ? event.keyCode : e.keyCode;
    }
		if ((keyCode === 9) || (keyCode === 13)){
			text = trim(document.getElementById("object_number").value);
			if (text in VIEW.names){ object_number = text; }
			else{ return ""; }
		}
		else if (keyCode === 40){
			if (VIEW.number < (VIEW.list.length-1)){
				VIEW.number += 1;
				object_number = VIEW.list[VIEW.number];
			}
			else{ return ""; }
		}
		else if (keyCode === 38){
			if (VIEW.number > 0){
				VIEW.number -= 1;
				object_number = VIEW.list[VIEW.number];
			}
			else{ return ""; }
		}
		else{ return ""; }
		document.getElementById("object_number").value = object_number;
		VIEW.display_object(object_number);
		return "";
	},
	frecord_handle: function(e){
    "use strict";
    function trim(text){
      return (text || "").replace(/^\x20+|\x20+$/g,"");
    }
    
    // match_keys returns true if all given keys match any one of a list of values
    function match_keys(values, keys){
      var i, key, match, j, value;
      for (i in keys){
        key = keys[i];
        match = false;
        for (j in values){
          value = values[j].toLowerCase();
          if (value.indexOf(key) >= 0){
            match = true;
            break;
          }
        }
        if (! match){return false; }
      }
      return true;
    }
    
    var keyCode, text, keywords, o, list, i, object_number, values, prop;
    if (typeof e === "number"){keyCode = e; }
    else{
      keyCode = (window.event) ? event.keyCode : e.keyCode;
    }
    if ( (keyCode === 9) || (keyCode === 13) ){
      VIEW.filter_input = document.getElementById("filter_box").value;
      text = trim(VIEW.filter_input.toLowerCase());
      if (! text){
        document.getElementById("filter_box").value = "";
        VIEW.filter_input = "";
        VIEW.unsorted_list = VIEW.full_list;        
        if (VIEW.sort_property){ VIEW.update_sort_record(VIEW.sort_property); }
        else{
          VIEW.list = VIEW.full_list;
          VIEW.update_names();
          VIEW.browsing();
        }
        return ""; 
      }
      keywords = text.match(/\S+/g); // one or more words separated by white space to array
      o = VIEW.collection.objects;
      list = [];
      for (i in VIEW.full_list){
        object_number = VIEW.full_list[i];
        values = [];
        for (prop in o[object_number]){
          if (prop.charAt(0) === "$"){ values.push(o[object_number][prop].join(",").toLowerCase()); }
          else { values.push(o[object_number][prop].toLowerCase()); }
        }
        if (match_keys(values, keywords)){ list.push(object_number); }
      }
      if (list.length >0){
        VIEW.unsorted_list = list;
        if (! VIEW.sort_property){
          VIEW.list = list;
          VIEW.update_names();
          VIEW.browsing();
        }
        else{
          VIEW.update_sort_record(VIEW.sort_property);
        }
      }
      else{
        alert("No records matching "+text+" found");
        document.getElementById("filter_box").value = "";
        VIEW.filter_input = "";
        VIEW.unsorted_list = VIEW.full_list;
        VIEW.update_sort_record(VIEW.sort_property);
      }
    }
    return "";
  },
  find_clear: function(){
    "use strict";
    document.getElementById("filter_box").value = "";
    VIEW.unsorted_list = VIEW.full_list;
    if (VIEW.sort_property){ VIEW.list = VIEW.objects_sorted_list(false); }
    else{ VIEW.list = VIEW.unsorted_list; }
    VIEW.update_names();
    VIEW.browsing();
    return "";
  },
  // nat_sort: return text list sorted according to natural sort numerical sorting
	nat_sort : function(list){
    "use strict";
		var slist, parse_string, a_, b_;
		slist = list;
		parse_string = /(\D*)(\d*)(\D*)(\d*)(\D*)(\d*)(\D*)(\d*)(.*)/;
		slist.sort(function(a,b){ 
			if (a===b) { return 0; }
			a_ = a.match(parse_string);
			b_ = b.match(parse_string);
			if (a_[1]!==b_[1]) { return a_[1] < b_[1] ? -1 : 1; }
			if (a_[2]!==b_[2]) { return (+a_[2]) - (+b_[2]); }
			if (a_[3]!==b_[3]) { return a_[3] < b_[3] ? -1 : 1; }
			if (a_[4]!==b_[4]) { return (+a_[4]) - (+b_[4]); }
			if (a_[5]!==b_[5]) { return a_[5] < b_[5] ? -1 : 1; }
			if (a_[6]!==b_[6]) { return (+a_[6]) - (+b_[6]); }
			if (a_[7]!==b_[7]) { return a_[7] < b_[7] ? -1 : 1; }
			if (a_[8]!==b_[8]) { return (+a_[8]) - (+b_[8]); }
			return a_[9] < b_[9] ? -1 : 1;
		});
		return slist;
	},
	update_names: function(){
    "use strict";
		var i;
		VIEW.names = {};
		for (i in VIEW.list){
			VIEW.names[VIEW.list[i]] = i*1;
		}
    VIEW.number = 0;
		return "";
	},
  objects_sorted_list: function(filter_property){
    "use strict";
    var objects, list, i, name, prop_name, prop, prop_value, sorted_list;
    objects = VIEW.collection.objects;
    list = [];
    for (i in VIEW.unsorted_list){
      name = VIEW.unsorted_list[i];
      prop_name = "";
      prop = VIEW.sort_property;
      if (prop in objects[name]){
        prop_value = objects[name][prop];
        if (prop_value || ! filter_property){ prop_name = prop_value+"\t"+prop_name; }
        else{ prop_name = ""; }
      }
      else{ prop_name = ""; }
      if (prop_name || ! filter_property){ list.push(prop_name+"\t"+name); }
    }
    sorted_list = VIEW.nat_sort(list);
    list = []; // remove property headers
    for (i in sorted_list){
      list.push(sorted_list[i].split("\t").pop());
    }
    return list;
  },
  start_sort_list: function(){
    "use strict";
    
    // sort_properties returns list of properties with string values from objects
    // properties with names beginning $ have array values and are not included
    // the list of properties is in the order of most frequent use
    function sort_properties(objects){
      var prop_counts, name, prop, list, sorted_list, i;
      prop_counts = {};
      for (name in objects){
        for (prop in objects[name]){
          if ((prop.charAt(0) !== "$") && (objects[name][prop])){
            if (! (prop in prop_counts)){ prop_counts[prop] = 1; }
            else{ prop_counts[prop] += 1; }
          }
        }
      }
      list = [];
      for (prop in prop_counts){ list.push("_"+prop_counts[prop]+"\t"+prop); }
      list = VIEW.nat_sort(list).reverse();
      sorted_list = [];
      for (i in list){ sorted_list.push(list[i].split("\t").pop()); }
      return sorted_list;
    }
    
    var property_list, select, i, entry;
    property_list = sort_properties(VIEW.collection.objects);
    select = "<p><b>sort objects by property value</b> <select id=\"selected_sort\" "+
      "onchange=VIEW.update_sort_record(selected_sort.value)>";
    select += "<option value=\"\">object_number only</option>";
    for (i in property_list){
      entry = property_list[i];
      select += "<option value=\""+entry+"\">"+entry+"</options>";
    }
    document.getElementById("sort").innerHTML = select+"</select><p>";
    return "";
  },
  discard_sort: function(){
    "use strict";
    VIEW.sort_property = "";
    document.getElementById("selected_sort").value = "";
    VIEW.list = VIEW.unsorted_list;
    VIEW.update_names();
    VIEW.browsing();
    return "";
  },
  update_sort_record: function(property){
    "use strict";
    var current_filter, old_sort;
    current_filter = document.getElementById("filter_box").value;
    if (current_filter !== VIEW.filter_input){ VIEW.frecord_handle(13); }
    
    if (! property){
      VIEW.discard_sort();
      return "";
    }
    old_sort = VIEW.sort_property;
    VIEW.sort_property = property;
    VIEW.list = VIEW.objects_sorted_list(true);
    if (VIEW.list.length > 0){
      VIEW.update_names();
      VIEW.browsing();
    }
    else{ 
      alert("The currently selected objects have no sort property "+VIEW.sort_property);
      if (old_sort !== VIEW.sort_property){
        document.getElementById("selected_sort").value = old_sort;     
        VIEW.update_sort_record(old_sort);
      }
      else{ VIEW.discard_sort(); }
    }
    return "";
  },
  album_init: function(object){
    "use strict";
    function load_album(list){
      function trio(list){
        var html;
        html = "<p><a id=\"a_album0\" target=\"_blank\" href=\""+VIEW.images+list[0]+"\" >"+
          "<img id=\"i_album0\" src=\""+VIEW.images+list[0]+"\" /></a>"+
          "<a id=\"a_album1\" target=\"_blank\" href=\""+VIEW.images+list[1]+"\" >"+
          "<img id=\"i_album1\" src=\""+VIEW.images+list[1]+"\" /></a>";
        if (list.length >= 3){ html += "<a id=\"a_album2\" target=\"_blank\" href=\""+
          VIEW.images+list[2]+"\" >"+"<img id=\"i_album2\" src=\""+
          VIEW.images+list[2]+"\" /></a>";
        }
        return html+"</p>";
      }
    
      var html;
      if (list.length < 2){ // a single entry should already be displayed as the primary image
        VIEW.album_image = -1;
        VIEW.album = "";
        return ""; 
      }
      VIEW.album_image = 0;
      VIEW.album = list;
      html = trio(list);
      if (list.length > 3){
        html += "<p align=\"center\" ><form oninput=\"amount.value=VIEW.album[rangeInput.value]\" >"+
          "<input onclick=\"VIEW.album_change(this)\" type=\"range\" id=\"rangeInput\" name=\"rangeInput\" min=\"0\" max=\""+
          (list.length-1)+"\" value=\"0\"><output name=\"amount\" id =\"rangeOutput\" for=\"rangeInput\">"+VIEW.album[0]+"</output></form></p>";
      }
      return html;
    }

    var images, i;
    if ("$images" in object){
      images = [];
      for (i in object.$images){ images.push(object.$images[i].replace(/^\x20+/g,"")); }
      return "<hr><div id=\"album\" >"+load_album(images)+"</div>"; 
    }
    else{ return ""; }
  },
  album_change: function(node){
    "use strict";
    var i, bound;
    i = parseInt(node.value, 10);
    bound = VIEW.album.length-3;
    VIEW.album_image = i;
    if (i>bound){ i = bound; }
    document.getElementById("a_album0").href = VIEW.images+VIEW.album[i];
    document.getElementById("a_album1").href = VIEW.images+VIEW.album[i+1];
    document.getElementById("a_album2").href = VIEW.images+VIEW.album[i+2];
    document.getElementById("i_album0").src = VIEW.images+VIEW.album[i];
    document.getElementById("i_album1").src = VIEW.images+VIEW.album[i+1];
    document.getElementById("i_album2").src = VIEW.images+VIEW.album[i+2];
  }
 
};
