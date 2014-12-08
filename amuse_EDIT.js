// amuse_json collection editor for either HTML5 File API or node-webkit
// files saved as json contain a base edition hash value
var EDIT = {
  version : "2.7",
  date : "2014-12-07",
  original : "", // JSON text for VIEW.collection
  editor : "", // closed | select | opened | active
  o_group : "", // name of property group being edited
  o_edit : "", // name of object being edited
  edit_node : "",
  o_publish : false, // true if collection being edited has changed 
  term_list : {},
  edit_original : "",
  edit_props : "",
  edit_item : "",
  location_from : "",
  location_to : "",
  
  setup_EDIT: function(){
    "use strict";
    var headline;
    headline = document.getElementById("headline");
    if (headline){ headline.innerHTML = "amuse-um viewer / editor"; }
    EDIT.original = JSON.stringify(window.VIEW.collection, null, "  ");
    document.getElementById("report").innerHTML = 
      "<span class=\"ebutton\" id=\"edit_button\" \"></span>"+
      "<span class=\"ebutton\" id=\"add_button\" \"></span>"+
      "<span class=\"ebutton\" id=\"publish_button\" \"></span>"+
      "<span class=\"ebutton\" id =\"discard_button\" \"></span>";
    EDIT.editor = "closed";
    EDIT.o_publish = false;
    document.getElementById("edit_button").onclick = EDIT.show_editor;
    document.getElementById("add_button").onclick = EDIT.add_object;
    document.getElementById("publish_button").onclick = EDIT.publish;
    document.getElementById("discard_button").onclick = EDIT.discard;
    EDIT.set_term_list();
    EDIT.show_editor();
    return "";
  },
  /* rinse text = replaces  symbols '&', '>' and '<' by their html equivalent but avoids duplication
    replaces all whitespace characters by a single space, and trim leading and trailing spaces */
  rinse: function(text){
    "use strict";
    function trim(text){
      return (text || "").replace(/^\x20+|\x20+$/g,"");
    }
      
    var clean, parts, i;
    clean = text.replace(/[\f\n\r\t]/g," ");
    parts = clean.split("&");
    clean = parts[0];
    for (i=1; i<parts.length; i += 1){
      if (/^amp;|^gt;|^lt;|^quot;|^#\d+;/.test(parts[i])){clean += "&"+parts[i]; }
      else{clean += "&amp;"+parts[i]; }
    }
    clean = clean.replace(/</g,"&lt;");
    clean = clean.replace(/>/g,"&gt;");
    return trim(clean);
  },
  set_term_list: function(){
    "use strict";
    var o, prop, prop_tail, dot, prop_head;
    EDIT.term_list = {};
    if (window.amuse_TERMS){
      o = window.amuse_TERMS.objects.terms;
      for (prop in o){
        prop_tail = prop.slice(7); // each property as header $terms_
        dot = prop_tail.indexOf(".");
        if (dot>0){
          prop_head = prop_tail.slice(0, dot);
          if ("amuse_"+prop_head !== window.VIEW.file_name){continue; }
          prop_tail = prop_tail.slice(dot+1);
        }
        EDIT.term_list[prop_tail] = o[prop];
      }
    }
    return "";
  },
  show_editor: function(){
    "use strict";
    if (! EDIT.editor){ return ""; }
    if (EDIT.editor === "closed"){
      document.getElementById("edit_button").innerHTML = "EDIT?";
      document.getElementById("add_button").innerHTML = "ADD OBJECT?";
      document.getElementById("editor").innerHTML = "select object to edit or add new object";
      EDIT.editor = "select";
    }
    else if (EDIT.editor === "select"){ EDIT.editing(); }
    else if (EDIT.editor === "opened"){
      EDIT.editor = "closed";
      EDIT.show_editor();
    }
    return "";
  },
  editing: function(){
    "use strict";
    var object_name, group_header, i, group;
    if (EDIT.editor === "select"){
      object_name = window.VIEW.list[window.VIEW.number];
      EDIT.o_edit = object_name;
      EDIT.editor = "opened";
      document.getElementById("edit_button").innerHTML = "CLOSE?";
      document.getElementById("add_button").innerHTML = "";
      group_header = "<p><b class=\"name\" >"+object_name+"</b>";
      for (i in window.VIEW.collection.$groups){
        group = window.VIEW.collection.$groups[i];
        if (window.VIEW.collection[group].length >0 ){
          group_header += "<span class=\"header\" onclick=\"EDIT.edit_group('"+
          group+"')\")>"+"<b>"+group.slice(1)+"</b></span>";
        }
      }
      group_header += "</p><div id=\"edit_props\"></div>";
      document.getElementById("editor").innerHTML = group_header;
      document.getElementById("edit_props").innerHTML = "select a property group";
    }
    else{
      if (EDIT.editor !== "active"){
        EDIT.editor = "closed";
        EDIT.show_editor();
      }
    }
    return "";
  },
  edit_group: function(group){
    "use strict";
    var object, html, list, i, prop, value;
    if (EDIT.editor === "active"){ return ""; }
    EDIT.o_group = group;
    object = window.VIEW.collection.objects[EDIT.o_edit];
    html = "<ul>"+group.toUpperCase();
    list = window.VIEW.collection[group];
    for (i in list){
      prop = list[i];
      if (prop in object){ 
        if (prop.charAt(0) === "$"){ value = "<strong>[.. edit list ..]</strong>"; }
        else{ value = object[prop]; }
      }
      else{ value = ""; }
      html += "<li onclick=\"EDIT.go_edit(this)\" class=\"editable\" >"+list[i]+" : "+value+"</li>";
    }
    document.getElementById("edit_props").innerHTML = html+"</ul>";
    return "";
  },
  go_edit: function(node){
    "use strict";
    function trim(text){
      return (text || "").replace(/^\x20+|\x20+$/g,"");
    }
    
    var text, colon, term, list, edit_HTML, i, tlist, options, length, entry ;
    if (EDIT.editor === "active"){ return ""; }
    EDIT.editor = "active";
    EDIT.edit_node = node;
    text = node.innerHTML;
    colon = text.indexOf(":");
    term = trim(text.slice(0, colon));
    EDIT.edit_item = EDIT.o_edit;
    EDIT.edit_props = term;
    if (term.charAt(0)==="$"){
      if (term in window.VIEW.collection.objects[EDIT.o_edit]){
        list = window.VIEW.collection.objects[EDIT.o_edit][term];
      }
      else{ list = []; }
      edit_HTML = "<h3 class=list_entry>"+term+": edit list entry / add list entry</h3><ul>";
      if (list.length>0){
        for (i in list){
          edit_HTML += "<li><input type=\"text\" id=\"edit_list"+i+"\" size=\"60\" value=\""+
          list[i]+"\" /></li>";
        }
      }
      edit_HTML += "<li><input type=\"text\" id=\"edit_list"+list.length+"\" size=\"60\" value=\"\" />"+
        "<span class=\"ebutton\" id=\"save_button\" onclick='EDIT.save_list(event)'>SAVE</span>"+
        "<span class=\"ebutton\" id=\"cancel_button\" onclick='EDIT.cancel_edit(event)'>CANCEL</span></li></ul>";
      document.getElementById("edit_props").innerHTML = edit_HTML;
      document.getElementById("edit_list"+list.length).focus();
      return "";
    }
    EDIT.edit_original = trim(text.slice(colon+1));
    if (term in EDIT.term_list){
      tlist = EDIT.term_list[term];
      options = ["<b>Select from the "+
        EDIT.edit_props+" list: </b><select id=\"term\" "+
        "onchange=EDIT.save_term(term.value)>"];
      options.push("<option value=\"none\">select a term</option>");
      options.push("<option value=\"none\">no change</option>");
      length = tlist.length;
      for (i=0; i<length; i+= 1){
        entry = tlist[i];
        options.push("<option value=\""+entry+"\">"+entry+"</option>");
      }
      options.push("</select>");
      node.innerHTML = options.join("\r\n");
      return "";
    }
    if (EDIT.edit_original.length>40){
      edit_HTML = EDIT.edit_props+": <textarea id=\"edit_box\" rows=\"6\" cols=\"80\">"+
        EDIT.edit_original+"</textarea>";
    }
    else{
      edit_HTML = EDIT.edit_props+": <input type=\"text\" id=\"edit_box\" size=\"60\" value=\""+
        EDIT.edit_original+"\" />";
    }
    edit_HTML += 
      "<span class=\"button\" id=\"save_button\" onclick='EDIT.save_edit(event)'>SAVE</span>"+
      "<span class=\"button\" id=\"cancel_button\" onclick='EDIT.cancel_edit(event)'>CANCEL</span>";
    node.innerHTML = edit_HTML;
    document.getElementById("edit_box").focus();
    return "";
  },
  save_edit: function(ev){
    "use strict";
    var node, edit_update;
    ev.stopPropagation();
    node = document.getElementById("edit_box");
    edit_update = EDIT.rinse(node.value);
    if (edit_update !== EDIT.edit_original){
      if (edit_update){
        window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props] = edit_update;
      }
      else{
        if (EDIT.edit_props === window.VIEW.collection.$props[0]){
          window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props] = 
            "brief description to be added here";
        }
        else{ delete window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props]; }
      }
      EDIT.show_publishing();
    }
    EDIT.edit_original = "";
    EDIT.edit_item = "";
    EDIT.editor = "opened";
    if (EDIT.o_edit === window.VIEW.list[window.VIEW.number]){
      window.VIEW.display_object(EDIT.o_edit);
    }
    EDIT.edit_group(EDIT.o_group);
    return "";
  },
  cancel_edit: function(ev){
    "use strict";
    ev.stopPropagation();
    EDIT.edit_original = "";
    EDIT.edit_item = "";
    EDIT.editor = "opened";
    EDIT.edit_group(EDIT.o_group);
    return "";
  },
  save_list: function(ev){
    "use strict";
    var original, length, changed, list, i, entry;
    ev.stopPropagation();
    if (EDIT.edit_props in window.VIEW.collection.objects[EDIT.o_edit]){
      original = window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props];
    }
    else{ original = []; }
    length = original.length;
    changed = false;
    list = [];
    for (i=0; i<length; i += 1){
      entry = EDIT.rinse(document.getElementById("edit_list"+i).value);
      if (! entry){ changed = true; }
      else{ 
        list.push(entry);
        if (entry !== original[i]){ changed = true; }
      }
    }
    entry = EDIT.rinse(document.getElementById("edit_list"+length).value);
    if (entry){list.push(entry); changed = true; }
    if (list.length === 0){
      delete window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props];
    }
    else{
      window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props] = list;
    }
    if (changed){ EDIT.show_publishing(); }
    EDIT.edit_original = "";
    EDIT.edit_item = "";
    EDIT.editor = "opened";
    if (EDIT.o_edit === window.VIEW.list[window.VIEW.number]){
      window.VIEW.display_object(EDIT.o_edit);
    }
    EDIT.edit_group(EDIT.o_group);
    return "";
  },
  save_term: function(term){
    "use strict";
    if ((term !== "none") && (term !== EDIT.edit_original)){
      if (window.EDIT_fn && window.EDIT_fn.has_prop(EDIT.edit_props)){
        window.EDIT_fn[EDIT.edit_props](term);
        return "";
      }
      window.VIEW.collection.objects[EDIT.o_edit][EDIT.edit_props] = term;
      EDIT.show_publishing();
    }
    EDIT.edit_original = "";
    EDIT.edit_item = "";
    EDIT.editor = "opened";
    if (EDIT.o_edit === window.VIEW.list[window.VIEW.number]){
      window.VIEW.display_object(EDIT.o_edit);
    }
    EDIT.edit_group(EDIT.o_group);
    return "";
  },
  show_publishing: function(){
    "use strict";
    var keep;
    if (EDIT.o_publish){ return ""; }
    EDIT.o_publish = true;
    if (window.FSO){ keep = "PUBLISH?"; } else{ keep = "SAVE JSON TO FILE?"; }
    document.getElementById("publish_button").innerHTML = keep;
    document.getElementById("discard_button").innerHTML = "DISCARD?";
    return "";
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
  publish: function(){
    "use strict";
    function today(){
      var now;
      now = new Date();
      now = now.toDateString().split(" ");
      // day month date year
      return now[2]+" "+now[1]+" "+now[3];
    }
    
    var update, keep, o, file_name, textFileAsBlob, downloadLink, report;
    if (EDIT.editor === "active" || EDIT.editor === "opened"){return ""; }
    update = JSON.stringify(window.VIEW.collection, null, "  ");
    if (update === EDIT.original){
      alert("The result of all the changes have been cancelled out - no changes");
    }
    else{
      if (window.FSO){ keep = "publish changes for next edition"; } else{ keep = "save changes to a local file"; }
      if (confirm("Confirm you wish to "+keep)){
        o = window.VIEW.collection;
        if (! ("edition" in o)){ o.edition = "0"; }
        if (! ("manual" in o)){o.manual = "yes"; }
        if (("manual" in o) && o.manual === "no"){
          if (window.FSO && window.FSO.pwd){
            o.manual = "no"; 
            o.edition = ""+(1+parseInt(o.edition, 10)); 
          }
          else{
            o.manual = "yes";
            o.edition += ":"+EDIT.string_hash(EDIT.edition_string(o));
          }
        }
        o.date = today();
        o.author = window.VIEW.author;
        file_name = window.VIEW.file_name+".json";
        update = JSON.stringify(window.VIEW.collection, null, "  ");
        if (! window.FSO || !window.FSO.pwd){ // use File API
          textFileAsBlob = new Blob([update],{type:'text/plain'});
          downloadLink = document.createElement("a");
          downloadLink.download = file_name;
          downloadLink.innerHTML = "Download File";
          if (typeof window.webkitURL === "undefined"){
          // Firefox requires the link to be added to the DOM before it can be clicked
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = EDIT.destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
          }
          else{
          // Chrome allows the link to be clicked even when not added to the DOM
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
          }
          downloadLink.click();
        }
        else{ // use node-webkit
          window.FSO.create_file(window.FSO.pwd+"objects/"+window.VIEW.file_name+".js",
            "var "+window.VIEW.file_name+" = "+update+";\n");
          report = window.NW.archive(window.VIEW.file_name, o);
          if (report){return report; }
        }
      }
    }
    EDIT.o_publish = false;
    document.getElementById("publish_button").innerHTML = "";
    document.getElementById("discard_button").innerHTML = "";
    EDIT.editor = "closed";
    window.VIEW.start_VIEW(window.VIEW.collection);
    return "";
  },
  // destroyClickedElement required for Firefox
  destroyClickedElement: function(event){
      "use strict";
    document.body.removeChild(event.target);
  }, 
  discard: function(){
    "use strict";
    if (EDIT.editor === "active" || EDIT.editor === "opened"){return ""; }
    if (confirm("Confirm you wish to discard changes")){
      window.VIEW.collection = JSON.parse(EDIT.original);
      window.VIEW.start_VIEW(window.VIEW.collection);
    }
    return "";
  },
  add_object: function(){
    "use strict";
    function next_object(){
      var object_name, list, last, parse_string, last_, choice;
      list = [];
      for (object_name in window.VIEW.collection.objects){
        list.push(object_name);
      }
      last = window.VIEW.nat_sort(list)[list.length-1];
      parse_string = /(\D*)(\d*)(.*)/;
      last_ = last.match(parse_string);
      choice = [];
      if (last_[3]){
        choice.push(last_[1]+last_[2]+"."+(1+parseInt(last_[3].slice(1),10)));
      }
      else{
        choice.push(last_[1]+last_[2]+".1");
      }
      choice.push(last_[1]+(1+parseInt(last_[2],10)));
      choice.push(last_[1]+(1+parseInt(last_[2],10))+".1");  
      return choice;
    }
    
    var choice, select, i, name;
    if ((EDIT.editor === "opened") || (EDIT.editor === "active")){ return ""; }
    document.getElementById("edit_button").innerHTML = "";
    choice = next_object();
    select = "<p><b>Choose next object name from this list </b>"+
      "<select id=\"selected_name\" onchange=EDIT.object_choice(selected_name.value)>";
    select += "<option value=\"\">one of</option>";
    for (i in choice){
      name = choice[i];
      select += "<option value=\""+name+"\">"+name+"</options>";
    }
    select += "<option value=\"\">none</options>";
    document.getElementById("editor").innerHTML = select+"</select><p>";
    return "";
  },
  object_choice: function(object_name){
    "use strict";
    var first_property;
    EDIT.editor = "closed";
    EDIT.show_editor();
    if (object_name){
      EDIT.show_publishing();
      window.VIEW.collection.objects[object_name] = {};
      first_property = window.VIEW.collection.$props[0];   
      window.VIEW.collection.objects[object_name][first_property] = "entry to be added here";
      window.VIEW.full_list.push(object_name);
      window.VIEW.reset_collection();
      window.VIEW.display_object(object_name);
    }
    return "";
  }

};
