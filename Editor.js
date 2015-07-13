// amuse_json collection editor for either HTML5 File API or node-webkit
// allows term list drop-down option to delete property value 
var Editor = (function(){
  "use strict";
  var version = "1.1", date = "2015-07-13";
  var collection, // the museum collection object, provided by edit_prompt
    file_name, // name provided by edit_prompt, to be used when saving results of edit
    author, // alphanumeric string, authority to edit, or empty string - edit denied 
    original, // JSON text for collection, created by setup_EDIT
    editor, // controls edit functions -"closed" | "selection" | "opened" | "active"
    o_group, // name of property group being edited
    o_edit = "", // name of object being edited
    o_publish, // true if collection being edited has changed 
    edit_original, // set by go_edit, reset by edit_done and cancel_edit
    edit_property, // set by go_edit
    term_list; // set by set_term_list and read by go_edit
/* edit_prompt must be the first Editor function called and expects a file name
 * beginning amuse_ and validated museum collection object */  
  function edit_prompt(name, content){
    author = prompt("Add initials for editing");
    if (author){
      file_name = name;
      collection = content;
      setup_EDIT(); 
    }
    else{ 
      author = "";
      document.getElementById("editor").innerHTML = "";
    }
    return "";
  }
// show_editor handles edit button onclick
  function show_editor(){
    function editing(){
      var object_name, group_header, group;
      if (editor === "selection"){
        object_name = window.Viewer.current_object_number();
        o_edit = object_name;
        window.Viewer.freeze_viewer(o_edit);
        editor = "opened";
        document.getElementById("edit_button").innerHTML = "CLOSE?";
        document.getElementById("add_button").innerHTML = "";
        document.getElementById("publish_button").innerHTML = "";
        document.getElementById("discard_button").innerHTML = "";
        group_header = "<p><b class=\"name\" >"+object_name+"</b>";
        for (var i=0; i<collection.$groups.length; i++ ){
          group = collection.$groups[i];
          if (collection[group].length >0 ){
            group_header += "<span class=\"header\" onclick=\"Editor.edit_group('"+
            group+"')\")>"+"<b>"+group.slice(1)+"</b></span>";
          }
        }
        group_header += "</p><div id=\"edit_props\"></div>";
        document.getElementById("editor").innerHTML = group_header;
        document.getElementById("edit_props").innerHTML = "select a property group";
      }
      else{
        if (editor !== "active"){
          editor = "closed";
          show_editor();
        }
      }
      return "";
    }
    
    var keep;
    if (! editor){ return ""; }
    if (editor === "closed"){
      window.Viewer.freeze_viewer("");
      document.getElementById("edit_button").innerHTML = "EDIT?";
      document.getElementById("add_button").innerHTML = "ADD OBJECT?";
      if (o_publish){
        if (window.FSO){ keep = "PUBLISH?"; } else{ keep = "SAVE JSON TO FILE?"; }
        document.getElementById("publish_button").innerHTML = keep;
        document.getElementById("discard_button").innerHTML = "DISCARD?";
      }
      document.getElementById("editor").innerHTML = "select object to edit or add new object";
      editor = "selection";
    }
    else if (editor === "selection"){ editing(); }
    else if (editor === "opened"){
      editor = "closed";
      show_editor();
    }
    return "";
  }
// edit_group handles editor span onclick
  function edit_group(group){
    var object, html, list, prop, value;
    if (editor === "active"){ return ""; }
    o_group = group;
    object = collection.objects[o_edit];
    html = "<ul>"+group.toUpperCase();
    list = collection[group];
    for (var i=0; i<list.length; i++ ){
      prop = list[i];
      if (prop in object){ 
        if (prop.charAt(0) === "$"){ value = "<strong>[.. edit list ..]</strong>"; }
        else{ value = object[prop]; }
      }
      else{ value = ""; }
      html += "<li onclick=\"Editor.go_edit(this)\" class=\"editable\" >"+list[i]+" : "+value+"</li>";
    }
    document.getElementById("edit_props").innerHTML = html+"</ul>";
    return "";
  }
// go_edit handles edit_props line onclick
  function go_edit(node){
    var text, colon, term, list, edit_HTML, tlist, options;
    if (editor === "active"){ return ""; }
    editor = "active";
    text = node.innerHTML;
    colon = text.indexOf(":");
    term = trim(text.slice(0, colon));
    edit_property = term;
    if (term.charAt(0)==="$"){
      if (term in collection.objects[o_edit]){
        list = collection.objects[o_edit][term];
      }
      else{ list = []; }
      edit_HTML = "<h3 class=list_entry>"+term+": edit list entry / add list entry</h3><ul>";
      if (list.length>0){
        for (var i=0; i<list.length; i++ ){
          edit_HTML += "<li><input type=\"text\" id=\"edit_list"+i+"\" size=\"60\" value=\""+
          list[i]+"\" /></li>";
        }
      }
      edit_HTML += "<li><input type=\"text\" id=\"edit_list"+list.length+"\" size=\"60\" value=\"\" />"+
        "<span class=\"ebutton\" id=\"save_button\" onclick='Editor.save_list(event)'>SAVE</span>"+
        "<span class=\"ebutton\" id=\"cancel_button\" onclick='Editor.cancel_edit(event)'>CANCEL</span></li></ul>";
      document.getElementById("edit_props").innerHTML = edit_HTML;
      document.getElementById("edit_list"+list.length).focus();
      return "";
    }
    edit_original = trim(text.slice(colon+1));
    if (term in term_list){
      tlist = term_list[term];
      options = ["<b>Select from the "+
        edit_property+" list: </b><select id=\"term\" "+
        "onchange=Editor.save_term(term.value)>"];
      options.push("<option value=\"none\">select a term</option>");
      options.push("<option value=\"none\">no change</option>");
      options.push("<option value=\"\">remove property</option>");
      for (var j=0; j<tlist.length; j+= 1){
        options.push("<option value=\""+tlist[j]+"\">"+tlist[j]+"</option>");
      }
      options.push("</select>");
      node.innerHTML = options.join("\r\n");
      return "";
    }
    if (edit_original.length>40){
      edit_HTML = edit_property+": <textarea id=\"edit_box\" rows=\"6\" cols=\"80\">"+
        edit_original+"</textarea>";
    }
    else{
      edit_HTML = edit_property+": <input type=\"text\" id=\"edit_box\" size=\"60\" value=\""+
        edit_original+"\" />";
    }
    edit_HTML += 
      "<span class=\"button\" id=\"save_button\" onclick='Editor.save_edit(event)'>SAVE</span>"+
      "<span class=\"button\" id=\"cancel_button\" onclick='Editor.cancel_edit(event)'>CANCEL</span>";
    node.innerHTML = edit_HTML;
    document.getElementById("edit_box").focus();
    return "";
  }
// save_edit handles save_button onclick for string properties
  function save_edit(ev){
    var node, edit_update;
    ev.stopPropagation();
    node = document.getElementById("edit_box");
    edit_update = rinse(node.value);
    if (edit_update !== edit_original){
      if (window.Editor_fn && window.Editor_fn.has_trigger(edit_property)){
        window.Editor_fn.trigger(edit_property,edit_update,collection);
        return "";
      }
      if (edit_update){
        collection.objects[o_edit][edit_property] = edit_update;
        if (edit_property === collection.$props[0]){
          window.Viewer.display_list();
        }
        if (window.FSO){ window.NW.log_string(o_edit,edit_property,edit_update); }
      }
      else{
        if (edit_property === collection.$props[0]){
          collection.objects[o_edit][edit_property] = "add value";
          window.Viewer.display_list();
          if (window.FSO){
            window.NW.log_string(o_edit,edit_property,edit_update,"add value");
          } 
        }
        else{
          delete collection.objects[o_edit][edit_property];
          if (window.FSO){ window.NW.log_string(o_edit,edit_property,""); }
        }
      }
      show_publishing();
    }
    edit_done();
    return "";
  }
// save_term handles onchange for term_list properties
  function save_term(term){
    if (! term){ // empty string, delete the selected property
      if (edit_property in collection.objects[o_edit]){
        delete collection.objects[o_edit][edit_property];
        if (window.FSO){ window.NW.log_string(o_edit,edit_property,""); }
        show_publishing();
      }
      edit_done();
      return "";
    }
    if ((term !== "none") && (term !== edit_original)){
      if (window.Editor_fn && window.Editor_fn.has_trigger(edit_property)){
        window.Editor_fn.trigger(edit_property,term,collection);
        return "";
      }
      collection.objects[o_edit][edit_property] = term;
      if (window.FSO){ window.NW.log_string(o_edit,edit_property,term); }      
      show_publishing();
    }
    edit_done();
    return "";
  }
// save_list handles save_button onclick for list properties
  function save_list(ev){
    var original, length, changed, list, i, entry;
    ev.stopPropagation();
    if (window.Editor_fn && window.Editor_fn.has_trigger(edit_property)){
      window.Editor_fn.trigger(edit_property,o_edit,collection);
      return "";
    }
    if (edit_property in collection.objects[o_edit]){
      original = collection.objects[o_edit][edit_property];
    }
    else{ original = []; }
    length = original.length;
    changed = false;
    list = [];
    for (i=0; i<length; i += 1){
      entry = rinse(document.getElementById("edit_list"+i).value);
      if (! entry){ changed = true; }
      else{ 
        list.push(entry);
        if (entry !== original[i]){ changed = true; }
      }
    }
    entry = rinse(document.getElementById("edit_list"+length).value);
    if (entry){list.push(entry); changed = true; }
    if (list.length === 0){
      delete collection.objects[o_edit][edit_property];
    }
    else{
      collection.objects[o_edit][edit_property] = list;
    }
    if (changed){
      if (window.FSO){
        window.NW.log_list(o_edit,edit_property,list);
      }
      show_publishing();
    }
    edit_done();
    return "";
  }
/* rinse is called by save_edit, save_list and Editor_fn to clean up user text.
 * It replaces  symbols '&', '>' and '<' by their html equivalent
 * but avoids duplication. Replaces all white space characters by a single space,
 * and trim leading and trailing spaces */
  function rinse(text){
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
  }
// edit_done called by save_edit, save_term, save_list and Editor_fn
  function edit_done(){
    edit_original = "";
    editor = "opened";
    if (o_edit === window.Viewer.current_object_number()){
      window.Viewer.display_object(o_edit);
    }
    edit_group(o_group);
    return "";
  }
// cancel_edit handles cancel button for all edited properties
  function cancel_edit(ev){
    ev.stopPropagation();
    edit_original = "";
    editor = "opened";
    edit_group(o_group);
    return "";
  }
// add_object handles add object button onclick
  function add_object(){
    function next_object(){
      var object_name, list, last, parse_string, last_, choice;
      list = [];
      for (object_name in collection.objects){
        list.push(object_name);
      }
      last = window.Viewer.last_object_number();
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
    
    var choice, select;
    if ((editor === "opened") || (editor === "active")){ return ""; }
    document.getElementById("edit_button").innerHTML = "";
    choice = next_object();
    select = "<p><b>Choose next object name from this list </b>"+
      "<select id=\"selected_name\" onchange=Editor.object_choice(selected_name.value)>";
    select += "<option value=\"\">one of</option>";
    for (var i=0; i<choice.length; i++){
      select += "<option value=\""+choice[i]+"\">"+choice[i]+"</options>";
    }
    select += "<option value=\"\">none</options>";
    document.getElementById("editor").innerHTML = select+"</select><p>";
    return "";
  }
// object_choice handles onchange for added object selected_name
  function object_choice(object_name){
    var first_property;
    if (object_name){
      show_publishing();
      collection.objects[object_name] = {};
      first_property = collection.$props[0];   
      collection.objects[object_name][first_property] = "add value";
      window.Viewer.add_object(object_name);
      if (window.FSO){
        window.NW.log_string(object_name,first_property,"add value");
      }         
    }
    editor = "closed";
    show_editor();
    return "";
  }
// show_publishing called by save_edit, save_term, save_list, object_choice and Editor_fn
  function show_publishing(){
    o_publish = true;
    return "";
  }
// publish handles publish_button onclick
  function publish(){
    function today(){
      var now;
      now = new Date();
      now = now.toDateString().split(" ");
      // day month date year
      return now[2]+" "+now[1]+" "+now[3];
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
    
    var update, keep, o, file, textFileAsBlob, downloadLink, report;
    if (editor === "active" || editor === "opened"){return ""; }
    update = JSON.stringify(collection, null, "  ");
    if (update === original){
      alert("The result of all the changes have been cancelled out - no changes");
      if (window.FSO){ window.NW.log_start(); }
    }
    else{
      if (window.FSO){ keep = "publish changes for next edition"; } else{ keep = "save changes to a local file"; }
      if (confirm("Confirm you wish to "+keep)){
        o = collection;
        if (! ("edition" in o)){ o.edition = "0"; }
        if (! ("manual" in o)){o.manual = "yes"; }
        if (("manual" in o) && o.manual === "no"){
          if (window.FSO && window.FSO.pwd){
            o.manual = "no"; 
            o.edition = ""+(1+parseInt(o.edition, 10)); 
          }
          else{
            o.manual = "yes";
            o.edition += ":"+string_hash(edition_string(o));
          }
        }
        o.date = today();
        o.author = author;
        file = file_name+".json";
        update = JSON.stringify(collection, null, "  ");
        if (! window.FSO || !window.FSO.pwd){ // use File API
          textFileAsBlob = new Blob([update],{type:'text/plain'});
          downloadLink = document.createElement("a");
          downloadLink.download = file;
          downloadLink.innerHTML = "Download File";
          if (typeof window.webkitURL === "undefined"){
          // Firefox requires the link to be added to the DOM before it can be clicked
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = Editor.destroyClickedElement;
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
          window.NW.log_close();
          window.FSO.create_file(window.FSO.pwd+"objects/"+file_name+".js",
            "var "+file_name+" = "+update+";\n");
          report = window.NW.complete_archive(file_name, o);
          if (report){
            window.NW.log_error(report);
            return report; 
          }
          window.NW.log_start();
        }
      }
    }
    o_publish = false;
    document.getElementById("publish_button").innerHTML = "";
    document.getElementById("discard_button").innerHTML = "";
    editor = "closed";
    window.Viewer.start(collection);
    restart_edit();
    return "";
  }
// destroyClickedElement required only for Firefox publish code
  function destroyClickedElement(event){
    document.body.removeChild(event.target);
  }
// discard handles discard_button onclick
  function discard(){
    if (editor === "active" || editor === "opened"){return ""; }
    if (confirm("Confirm you wish to discard changes")){
      collection = JSON.parse(original);
      window.Viewer.start(collection);
      if (window.FSO){ window.NW.log_start(); }
      restart_edit();
    }
    return "";
  }
// get_edit_original only required by Editor_fn
  function get_edit_original(){
    return edit_original;
  }
// get_o_edit only required by Editor_fn
  function get_o_edit(){
    return o_edit;
  }
// get_author called by NW applications
  function get_author(){
    return author;
  }
// get_o_publish called by NW applications
  function get_o_publish(){
    return o_publish;
  }  
// setup_EDIT initialises all shared variables other than collection, file name and author
  function setup_EDIT(){
    function set_term_list(){
      var o, prop, prop_tail, dot, prop_head;
      term_list = {};
      if (window.amuse_TERMS){
        o = window.amuse_TERMS.objects.terms;
        for (prop in o){
          prop_tail = prop.slice(7); // each property as header $terms_
          dot = prop_tail.indexOf(".");
          if (dot>0){
            prop_head = prop_tail.slice(0, dot);
            if ("amuse_"+prop_head !== file_name){continue; }
            prop_tail = prop_tail.slice(dot+1);
          }
          term_list[prop_tail] = o[prop];
        }
      }
      return "";
    }
    
    var headline;
    headline = document.getElementById("headline");
    if (headline){ headline.innerHTML = "amuse viewer / editor"; }
    original = JSON.stringify(collection, null, "  ");
    document.getElementById("report").innerHTML = 
      "<span class=\"ebutton\" id=\"edit_button\" \"></span>"+
      "<span class=\"ebutton\" id=\"add_button\" \"></span>"+
      "<span class=\"ebutton\" id=\"publish_button\" \"></span>"+
      "<span class=\"ebutton\" id =\"discard_button\" \"></span>";
    editor = "closed";
    o_group = "";
    o_edit = "";
    o_publish = false;
    edit_original = "";
    edit_property = "";
    document.getElementById("edit_button").onclick = Editor.show_editor;
    document.getElementById("add_button").onclick = Editor.add_object;
    document.getElementById("publish_button").onclick = Editor.publish;
    document.getElementById("discard_button").onclick = Editor.discard;
    set_term_list();
    show_editor();
    return "";
  }
// restart_edit is called after publishing or discarding edited changes
  function restart_edit(){
    if (author){ setup_EDIT(); }
    return "";
  }
// shared functions 
  function trim(text){
    return (text || "").replace(/^\x20+|\x20+$/g,"");
  } 
// about for tests
  function about(){
    return {"version": version, "date": date,
      "collection": collection, "file_name": file_name,
      "author": author, "original": original,
      "editor": editor, "o_group": o_group,
      "o_edit": o_edit, "o_publish": o_publish,
      "edit_original": edit_original, "edit_property": edit_property,
      "term_list": term_list
    };
  }

  return {
    "edit_prompt": edit_prompt, // used by loader
    "show_editor": show_editor, // onclick
    "edit_group": edit_group, // onclick
    "go_edit": go_edit, // onclick
    "save_edit": save_edit, // onclick
    "save_term": save_term, // onchange
    "save_list": save_list, // onclick
    "rinse": rinse, // used by Editor_fn
    "edit_done": edit_done, // used by Editor_fn
    "cancel_edit": cancel_edit, // onclick
    "add_object": add_object, // onclick
    "object_choice": object_choice, // onchange
    "show_publishing": show_publishing, // used by Editor_fn
    "publish": publish, // onclick
    "destroyClickedElement": destroyClickedElement, // onclick
    "discard": discard, // onclick
    "get_edit_original": get_edit_original, // used by Editor_fn
    "get_o_edit": get_o_edit, // used by Editor_fn
    "get_author": get_author, // used by NW
    "get_o_publish": get_o_publish, // used by NW
    "about": about // optional use  
  };
})();
