// simple amuse_json collection viewer
// changed match_property_keys to property=key where key is start of property value
var Viewer = (function(){
    "use strict";
    var version = "1.1", version_date = "2015-06-04";
    var collection, // the museum collection object 
      edition, // museum collection edition
      date, // date when museum collection edition was published
      mandatory, // property required for every object in the museum collection
      full_list, // a list of object numbers for all objects in the museum collection
      filtered_list, // subset of full_list according to value of filter_box
      working_list, // filtered_list sorted according to sort_property value
      filter_input, // filter box value
      sort_property, // update_selected_sort handles change of property value list
      names, // object maps object_number to position in working_list
      working_list_number, // points to object_number to be displayed by Viewer
      images, // name of directory containing museum object images
      album, // the list of museum object images for object being displayed (property $images)
      frozen = "", // when not empty, viewed object_number cannot change (used by Editor)
      frozen_filter = "", // set to filter_input when frozen 
      frozen_sort = "", // set to sort_property when frozen
      view_extension = "";
/*  start must be the first Viewer function called and expects, as a parameter,
 *  a validated museum collection object
 *  all the shared variables other than album are initialised in start */
    function start(a_collection){
      function start_sort_list(){
        // sort_properties returns list of properties from objects
        // the list of properties is in the order of most frequent use
        function sort_properties(objects){
          var prop_counts, name, prop, list, sorted_list;
          prop_counts = {};
          for (name in objects){
            for (prop in objects[name]){
              if (! (prop in prop_counts)){ prop_counts[prop] = 1; }
              else{ prop_counts[prop] += 1; }
            }
          }
          list = [];
          for (prop in prop_counts){list.push("_"+prop_counts[prop]+"\t"+prop); }
          list = nat_sort(list).reverse();
          sorted_list = [];
          for (var i=0; i<list.length; i++){ sorted_list.push(list[i].split("\t").pop()); }
          return sorted_list;
        }
    
        var property_list, select, entry;
        property_list = sort_properties(collection.objects);
        select = "<p><b>sort objects by property value</b> <select id=\"selected_sort\" "+
          "onchange=Viewer.update_sort_record(selected_sort.value)>";
        select += "<option value=\"\">object_number only</option>";
        for (var i=0; i<property_list.length; i++ ){
          entry = property_list[i];
          select += "<option value=\""+entry+"\">"+entry+"</options>";
        }
        document.getElementById("sort").innerHTML = select+"</select><p>";
        return "";
      }
    
      var id;
      collection = a_collection;
      if ("edition" in collection){
        edition = collection.edition;
      }
      else{ edition = ""; }
      if ("date" in collection){
        date = collection.date;
      }
      else{ date = "undated"; }
      if ("$props" in collection){
        mandatory = collection.$props[0];
      }
      else{ return "invalid collection"; }
      full_list = [];
      if ("objects" in collection){
        for (id in collection.objects){
          full_list.push(id);
        }
        full_list = nat_sort(full_list);
      }
      filtered_list = full_list;
      working_list =  full_list;
      filter_input = "";
      sort_property = "";
      names = {};
      for (var i=0; i<working_list.length; i++){
        names[working_list[i]] = i*1;
      }
      working_list_number = 0;
      if ("image_folder" in collection){
        images = "../images/"+collection.image_folder;
      }
      else{ images = "../images/"; }     
      document.getElementById("filter_box").value = ""; 
      document.getElementById("object_number").onkeydown = Viewer.choose_object;
      document.getElementById("filter_box").onkeydown = Viewer.filter_list;
      document.getElementById("clear_button").onclick = Viewer.filter_clear;
      document.getElementById("move_down").onclick = function(){Viewer.choose_object(40); };
      document.getElementById("move_up").onclick = function(){Viewer.choose_object(38); };   
      start_sort_list();
      display_list();
      document.getElementById("object_number").value = 
        working_list[working_list_number];
      if (! window.Editor){ 
        document.getElementById("report").innerHTML =
          "Viewer version "+version+" ["+version_date+"]"; 
      }
      frozen = false;
      display_object(working_list[working_list_number]);
      return "";
    }
/*  display_list sets up list of museum object numbers when called by start,
 *  the display is changed whenever a filter or property sort event occurs 
 *  (via browsing function)or an object is added */
    function display_list(){
      var html, length, object_number;
      html = "<h3>"+collection.name+" "+edition+" "+date+"</h3>"+
      "<p class=\"centred\">listed "+working_list.length+" of "+full_list.length+
      " objects</p><ul>";
      length = working_list.length;
      for (var i=0; i<length; i++){
        object_number = working_list[i];
        html+= "<li><b class=\"show\" onclick='Viewer.display_object(\""+object_number+"\")' >"+
          object_number+"</b>: "+collection.objects[object_number][mandatory]+"</li>";
      }
      document.getElementById("browser").innerHTML = html+"</ul>";
      return "";
    }
//  display_object shows all the properties of the museum object plus any related images
    function display_object(object_number){
      function display_object_list(prop, list){
        function add_links(list, ref){
          var html, link;
          html = "";
          for (var i=0; i<list.length; i++ ){
            link = list[i];
            html += "<li><a target=\"_blank\" href=\"../DOCS/"+ref+".html?"+link+"\">"+link+"</a></li>";
          }
          return html;
        }
    
        var html, i;
        if (list.length === 0){return ""; }
        html = "<li><span class=\"centred\">"+prop+"</span><ul>";
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
              for (i=0; i<list.length; i++ ){ html += "<li>"+list[i]+"</li>"; }
            }
            break;
          default :
            for (i=0; i<list.length; i++ ){ html += "<li>"+list[i]+"</li>"; }
            break;
        }
        return html+"</ul></li>";
      }
      function has_value(object, property){
        if (typeof object[property] === "string"){
          return "<li>"+property+" : "+object[property]+"</li>";
        }
        else if (typeof object[property] === "object"){
          return display_object_list(property, object[property]);
        }
        return "";
      }
      function is_a_part(object_number){
        var part_of;
        if ("part_of" in collection.objects[object_number]){
          part_of = collection.objects[object_number].part_of;
          if ((part_of in collection.objects) && 
              ("has_parts" in collection.objects[part_of])){
            return part_of;
          }
        }
        return "";
      }
      function get_key_values(object, key_list, part_of, parts){
        var values, prop, value;
        values = "";
        for (var i=0; i<key_list.length; i++ ){
          prop = key_list[i];
          if (! part_of){
            value = has_value(object, prop);
          } 
          else{
            if (prop === "part_of"){ value = parts; }
            else{ value = has_value(object, prop); }
            if (value === "" && prop !== "has_parts"){
              value = has_value(collection.objects[part_of], prop);
            }
          }
          values += value;
        }
        return values;
      }
      function album_init(object){
        function load_album(list){
          function trio(list){
            var html;
            html = "<p><a id=\"a_album0\" target=\"_blank\" href=\""+images+
              list[0]+"\" >"+"<img id=\"i_album0\" alt=\""+list[0]+"\" src=\""+images+list[0]+
              "\" /></a>"+"<a id=\"a_album1\" target=\"_blank\" href=\""+images+
              list[1]+"\" >"+"<img id=\"i_album1\" alt=\""+list[1]+"\" src=\""+images+list[1]+
              "\" /></a>";
            if (list.length >= 3){ html += "<a id=\"a_album2\" target=\"_blank\" href=\""+
              images+list[2]+"\" >"+"<img id=\"i_album2\" alt=\""+list[2]+"\" src=\""+
              images+list[2]+"\" /></a>";
            }
            return html+"</p>";
          }
    
          var html;
          if (list.length < 2){ // a single entry is displayed as the primary image
            album = "";
            return ""; 
          }
          album = list;
          html = trio(list);
          if (list.length > 3){
            html += "<p class=\"centred\" >"+
              "<form oninput=\"amount.value=Viewer.album_list()[rangeInput.value]\" >"+
              "<input onclick=\"Viewer.album_change(this)\" type=\"range\""+
              " id=\"rangeInput\" name=\"rangeInput\" min=\"0\" max=\""+
              (list.length-1)+"\" value=\"0\">"+
              "<output name=\"amount\""+" id =\"rangeOutput\" for=\"rangeInput\">"+
              album[0]+"</output></form></p>";
          }
          return html;
        }

        var object_images;
        if ("$images" in object){
          object_images = [];
          for (var i=0; i<object.$images.length; i++ ){
            object_images.push(object.$images[i].replace(/^\x20+/g,"")); 
          }
          return "<hr><div id=\"album\" >"+load_album(object_images)+"</div>"; 
        }
        else{ return ""; }
      }

      var object, content, valid, part_of, parts, view_groups, key_list, group_result;
      if (frozen){
        if (object_number !== frozen){ return ""; }
      }
      document.getElementById("object_number").value = object_number;
      working_list_number = names[object_number];
      object = collection.objects[object_number];
      if (("image" in object) && (object.image.toLowerCase().indexOf(".jpg")>0)){
        content = "<div id=\"img_block\"><p><a target=\"_blank\" href=\""+
        images+object.image+"\" ><img id=\"primary\" alt=\"thumbnail\" src=\"../images/"+
        images+object.image+"\" /></a><br>"+object.image+"</p></div>";
      }
      else if (("primary_image" in object) &&
              (object.primary_image.toLowerCase().indexOf(".jpg")>0) ){
        content = "<div id=\"img_block\"><p><a target=\"_blank\" href=\""+
        object.primary_image+"\" ><img id=\"primary\" alt=\"thumbnail\" src=\""+
        object.primary_image+"\" /></a><br>"+
        object.primary_image.slice(object.primary_image.lastIndexOf("/")+1)+"</p></div>";
      }
      else{ content = ""; }
      content += "<h4>"+object_number+"</h4><ul>";
      valid = false;
      part_of = is_a_part(object_number);
      if (part_of){ 
        parts = "<li>part_of : "+collection.objects[part_of].has_parts+"</li>";
      }
      else{ parts = ""; }
      view_groups = collection.$groups;
      for (var i=0; i<collection.$groups.length; i++ ){
        key_list = collection[view_groups[i]];
        if (key_list.length>0){
          group_result = get_key_values(object, key_list, part_of, parts);
          if (group_result){
            valid = true;
            content += "<li><b>"+view_groups[i]+"</b><ul>"+group_result+"</ul></li>";
          }
        }
      }
      if (! valid){content += "<li>No properties to display </li>";}
      content += "</ul>";
      document.getElementById("object").innerHTML = content+album_init(object);
      if (view_extension){ view_extension(object_number); }
      return "";
    }
// choose_object handles user input to select the next museum object to display    
    function choose_object(e){
      var keyCode, text, object_number;
      if (frozen){ return ""; }
      if (typeof e === "number"){keyCode = e; }
      else{
        keyCode = (window.event) ? event.keyCode : e.keyCode;
      }
      if ((keyCode === 9) || (keyCode === 13)){
        text = trim(document.getElementById("object_number").value);
        if (text in names){ object_number = text; }
        else{ return ""; }
      }
      else if (keyCode === 40){
        if (working_list_number < (working_list.length-1)){
          working_list_number += 1;
          object_number = working_list[working_list_number];
        }
        else{ return ""; }
      }
      else if (keyCode === 38){
        if (working_list_number > 0){
          working_list_number -= 1;
          object_number = working_list[working_list_number];
        }
        else{ return ""; }
      }
      else{ return ""; }
      document.getElementById("object_number").value = object_number;
      display_object(object_number);
      return "";
    }
// filter_list handles the filter box to select which objects to retain in the display list  
    function filter_list(e){
      // match_tags returns list of object_numbers where $tags matches a list of tags
      function match_tags(objects, candidates, tags){
        var list, i, values, j, tag, match, k, value;
        list = [];
        for (i=0; i<candidates.length; i += 1){
          if ("$tags" in objects[candidates[i]]){
            values = objects[candidates[i]].$tags;
            for (j=0; j<tags.length; j += 1){
              tag = tags[j];
              match = false;
              for (k=0; k<values.length; k += 1){
                value = values[k].toLowerCase();
                if (value === tag){
                  match = true;
                  break;
                }
              }
              if (! match){ break; }
            }
            if (match){ list.push(candidates[i]); }
          }
        }
        return list;
      }
      // match_property_keys returns list of object_numbers where keys match start of property values
      // match is case sensitive
      function match_property_keys(objects, candidates, keys){
        function is_match(object, property_key){
          var equal, property, key, match;
          equal = property_key.indexOf("=");
          if (equal<1){ return false; }
          property = property_key.slice(0, equal);
          key = property_key.slice(equal+1);
          if (! (property in object)){ return false; }
          if (property.charAt(0) === "$"){
            match = false;
            for (var i=0; i<object[property].length; i++){
              if (object[property][i].indexOf(key) === 0){ 
                match = true;
                break;
              }
            }
            return match; 
          }
          else{
            if ( object[property].indexOf(key)!== 0){ return false; }
          }
          return true;
        }
           
        var list, number_of_candidates, number_of_keys, i, object, match, j;
        list = [];
        number_of_candidates = candidates.length;
        number_of_keys = keys.length;
        for (i=0; i<number_of_candidates; i++){
          object = candidates[i];
          match = true;
          for (j=0; j<number_of_keys; j++){
            if (! is_match(objects[object], keys[j])){
              match = false;
              break; 
            }
          }
          if (match){ list.push(object); }
        }
        return list;
      }
      // match_string returns object_numbers where string matches a property value
      // if lower_case is true, match is case insensitive
      function match_string(objects, list, string, lower_case){
        var matches, list_length, i, object, property, value;
        matches = [];
        list_length = list.length;
        for (i=0; i<list_length; i++){
          object = objects[list[i]];
          for (property in object){
            if (property.charAt(0) !=="$"){
              value = object[property];
            }
            else{ value = object[property].join("\t"); }
            if (lower_case){ value = value.toLowerCase(); }
            if (value.indexOf(string)>=0){
              matches.push(list[i]);
              break;
            }
          }
        }
        return matches;
      }
      // extract_quotes removes quoted strings from text and returns both in object
      function extract_quotes(text){
        var quotes, input, strings, quote, endquote, string;
        quotes = true;
        input = text;
        strings = [];
        while (quotes){
          quote = input.indexOf("\"");
          if (quote<0){ quotes = false; }
          else{
            endquote = input.slice(quote+1).indexOf("\"");
            if (endquote<0){
              string = input.slice(quote+1);
              if (string){ strings.push(string); }
              input = input.slice(0, quote);
              quotes = false;
            }
            else{
              string = input.slice(quote+1, quote+endquote+1);
              if (string){
                strings.push(string);
                input = input.slice(0, quote)+" "+input.slice(quote+endquote+2);
              }
            }
          }
        }
        return {"quoted": strings, "remainder": input};
      }
      // is_listed returns true if value is in list
      function is_listed(value, list){
        var list_length, i;
        list_length = list.length;
        for (i=0; i<list_length; i++){
          if (value === list[i]){ return true; }
        }
        return false;
      }
    
      var keyCode, text, strings, quotes, keywords, tags, property_keys, keys, local_list;
      if (frozen){return ""; }
      if (typeof e === "number"){keyCode = e; }
      else{
        keyCode = (window.event) ? event.keyCode : e.keyCode;
      }
      if ( (keyCode === 9) || (keyCode === 13) ){
        filter_input = document.getElementById("filter_box").value;
        text = trim(filter_input);
        if (! text){
          document.getElementById("filter_box").value = "";
          filter_input = "";
          filtered_list = full_list;        
          if (sort_property){ update_sort_record(sort_property); }
          else{
            working_list = full_list;
            browsing();
          }
          return ""; 
        }
        strings = extract_quotes(text);
        quotes = strings.quoted;
        keywords = strings.remainder.match(/\S+/g); // words separated by white space to array
        if (! keywords){ keywords = []; }
        tags = [];
        property_keys = [];
        keys = [];
        for (var i=0; i<keywords.length; i += 1){
          if (keywords[i].charAt(0) === "#"){
            tags.push(keywords[i].slice(1).toLowerCase()); // remove # prefix
          }
          else if (keywords[i].indexOf("=")>0){
            if (is_listed(keywords[i].slice(0,keywords[i].indexOf("=")),collection.$props)){
              property_keys.push(keywords[i]);
            }
          }
          else{ keys.push(keywords[i].toLowerCase()); }
        }
        if (tags.length > 0){
          local_list = match_tags(collection.objects, full_list, tags);
        }
        else{ local_list = full_list; }
        if (property_keys.length> 0){
          local_list = match_property_keys(collection.objects, local_list, property_keys);
        }
        if ((local_list.length > 0) && (keys.length > 0)){
          for (var j=0; j<keys.length; j+= 1){
            local_list = match_string(collection.objects, local_list, keys[j], true);
          }
        }
        if ((local_list.length >0) && (quotes.length>0)){
          for (var k=0; k<quotes.length; k += 1){
            local_list = match_string(collection.objects, local_list, quotes[k], false);
          }
        }
        if (local_list.length >0){
          filtered_list = local_list;
          if (! sort_property){
            working_list = local_list;
            browsing();
          }
          else{
            update_sort_record(sort_property);
          }
        }
        else{
          alert("No records matching "+text+" found");
          document.getElementById("filter_box").value = "";
          filter_input = "";
          filtered_list = full_list;
          update_sort_record(sort_property);
        }
      }
      return "";
    }
/*  filter_clear handles the onclick clear button to display all objects
 *  but does not change any sort property order. This causes those objects that 
 *  have no value for the sort property to appear at the top of the list. */    
    function filter_clear(){
      if (frozen){ return ""; }
      document.getElementById("filter_box").value = "";
      filter_input = "";
      filtered_list = full_list;
      if (sort_property){ working_list = objects_sorted_list(false); }
      else{ working_list = full_list; }
      browsing();
      return "";
    }
/*  update_sort_record first processes any outstanding filter_box value, then
 *  the filtered_list is filtered and sorted according to the sort_property.
 *  If the resulting sorted list is empty, the sort property reverts to the
 *  previous sort property value or discards the sort */  
    function update_sort_record(property){
      function discard_sort(){
        sort_property = "";
        document.getElementById("selected_sort").value = "";
        working_list = filtered_list;
        browsing();
        return "";
      }
    
      var current_filter, old_sort;
      if (frozen){ return ""; }
      current_filter = document.getElementById("filter_box").value;
      if (current_filter !== filter_input){ filter_list(13); }
      if (! property){ // object_number only
        discard_sort();
        return "";
      }
      old_sort = sort_property;
      sort_property = property;
      working_list = objects_sorted_list(true);
      if (working_list.length > 0){ browsing(); }
      else{ 
        alert("The currently selected objects have no sort property "+sort_property);
        if (old_sort !== sort_property){
          document.getElementById("selected_sort").value = old_sort;     
          update_sort_record(old_sort);
        }
        else{ discard_sort(); }
      }
      return "";
    }
//  add_object called by Editor to add a new museum object to the collection
    function add_object(object_number){
      if (typeof full_list === "object"){      
        full_list.push(object_number); // object_number already chosen to be last in sorted list
        document.getElementById("filter_box").value = "";
        filter_input = "";
        document.getElementById("selected_sort").value = "";
        sort_property = "";
        filtered_list = full_list;
        working_list = full_list;
        browsing();
        display_object(object_number);
      }
      return "";
    }
// album_change required for form value, used when the museum object has more than 3 images        
    function album_change(node){
      var i, bound;
      i = parseInt(node.value, 10);
      bound = album.length-3;
      if (i>bound){ i = bound; }
      document.getElementById("a_album0").href = images+album[i];
      document.getElementById("a_album1").href = images+album[i+1];
      document.getElementById("a_album2").href = images+album[i+2];
      document.getElementById("i_album0").src = images+album[i];
      document.getElementById("i_album1").src = images+album[i+1];
      document.getElementById("i_album2").src = images+album[i+2];
    }
// album_list required for form input, used when the museum object has more than 3 images
    function album_list(){
      return album;
    }
// current_object_number returns the object_number of the museum object being display       
    function current_object_number(){
      return working_list[working_list_number];
    }
// last_object_number returns the value to be logical increased by the next object added    
    function last_object_number(){
      if (typeof full_list === "object"){
        return full_list[full_list.length-1];
      }
      return "";
    }   
// common internal functions
    function trim(text){
      return (text || "").replace(/^\x20+|\x20+$/g,"");
    }
/*  nat_sort takes an array of strings and returns a new array formed by 
 *  sorting a copy of the parameter using the built-in sort function to 
 *  generate alphanumeric strings in natural order. */
    function nat_sort(list){
      var slist, parse_string, a_, b_;
      slist = list.slice(0); // copy rather than reference
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
    } 
/*  browsing resets names whenever working_list changes and updates 
 *  the list and object displays to show the first object in the list */                
    function browsing(){
      names = {};
      for (var i=0; i<working_list.length; i++){
        names[working_list[i]] = i*1;
      }
      working_list_number = 0;
      display_list();
      document.getElementById("object_number").value = working_list[working_list_number];
      display_object(working_list[working_list_number]);
      return "";
    }    
/* objects_sorted_list returns the filtered_list sorted according to the sort_property
 * value. If filter_property is true, objects without the sort_property are omitted 
 * but if filter_property is false, all the filtered list are returned with 
 * the objects without the sort property at the head of the list */   
    function objects_sorted_list(filter_property){
      var list, prop_name, prop_value, sorted_list;
      list = [];
      for (var i=0; i<filtered_list.length; i++ ){
        prop_name = "";
        if (sort_property in collection.objects[filtered_list[i]]){
          prop_value = collection.objects[filtered_list[i]][sort_property];
          if (prop_value || ! filter_property){ prop_name = prop_value+"\t"+prop_name; }
          else{ prop_name = ""; }
        }
        else{ prop_name = ""; }
        if (prop_name || ! filter_property){ list.push(prop_name+"\t"+filtered_list[i]); }
      }
      sorted_list = nat_sort(list);
      list = []; // remove property headers
      for (var j=0; j<sorted_list.length; j++ ){
        list.push(sorted_list[j].split("\t").pop());
      }
      return list;
    }
// extend_view is set by the controller to add information to the object display
    function extend_view(f){
      view_extension = f;
      return "";
    }
// freeze_viewer is called by Editor at start and end of editing
    function freeze_viewer(object_number){
      if (object_number){
        frozen = object_number;
        frozen_filter = filter_input;
        frozen_sort = sort_property; 
      }
      else{
        frozen = "";
        document.getElementById("filter_box").value = frozen_filter;
        document.getElementById("selected_sort").value = frozen_sort;
      }
      return "";
    }
// about for tests
    function about(){
      return { "version": version, "version_date": version_date,
        "collection": collection, "edition": edition, "date": date,
        "mandatory": mandatory, "full_list": full_list,
        "filtered_list": filtered_list, "working_list": working_list,
        "filter_input": filter_input, "sort_property": sort_property,
        "names": names, "working_list_number": working_list_number,
        "images": images, "album": album
      };
    }
    
    return {
      "start": start,
      "display_list": display_list,
      "display_object": display_object,
      "choose_object": choose_object,
      "filter_list": filter_list,
      "filter_clear": filter_clear,
      "update_sort_record": update_sort_record,
      "add_object": add_object,
      "album_change": album_change,
      "album_list": album_list,
      "current_object_number": current_object_number,
      "last_object_number": last_object_number,
      "extend_view": extend_view,
      "freeze_viewer": freeze_viewer,
      "about": about
    };
  })();
