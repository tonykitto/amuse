// simple file management system for text files
// used specifically for node-webkit file access
// root directory is the nw.exe home directory
// 2015-06-15 version 0.3 [allows backward or forward slash for pwd
var FSO = {
  valid : false,
  pwd  : "",

  init : function () {
		var epath, fold;
		epath = process.execPath;
    if (epath.indexOf("\\")>=0){
      fold = epath.lastIndexOf("\\");
    }
    else{ fold = epath.lastIndexOf("/"); }
		FSO.pwd = epath.slice(0, fold+1);
    FSO.valid = true;
  },

	folder_exists : function (name) {
		var stats;
		var fs = require('fs');
		try{
			stats = fs.lstatSync(name);
			if (stats.isDirectory()){ return true; }
			return false;
		}
		catch (e){ return false; }
	},

  create_folder : function (name) {
		var fs = require('fs');
		try{ fs.mkdirSync(name, 0777); return true; }
		catch (e){
			alert("failed to create folder: "+name+" : "+e.toString());
			return false;
		}
  },

	get_file_names : function (path) {
		var fs = require('fs');
		try{ return fs.readdirSync(path); }
		catch (e){
			alert("failed to read directory: "+path+" : "+e.toString());
			return false;
		}
	},

  file_exists : function (name) {
		var stats;
		var fs = require('fs');
		try{
			stats = fs.lstatSync(name);
			if (stats.isFile()){ return true; }
			return false;
		}
		catch (e){ return false; }
	},

  create_binary_file : function (name, data) {
		var fs = require('fs');
		try{
			fs.writeFileSync(name, data, 'binary');
			return true;
		}
		catch (e){
			alert("Failed to create file: "+name+" : "+e.toString());
			return false;
		}
  },
  create_file : function (name, data) {
		var fs = require('fs');
		try{
			fs.writeFileSync(name, data, 'utf-8');
			return true;
		}
		catch (e){
			alert("Failed to create file: "+name+" : "+e.toString());
			return false;
		}
  },

  rename : function (name, new_name){
		var fs = require('fs');
		try{
			fs.rename(name, new_name);
			return true;
		}
		catch (e){
			alert("Failed to rename folder / file: "+name+" : "+e.toString());
			return false;
		}
	},

  log_file : function (name, text) {
		var fs = require('fs');
		try{
			fs.appendFileSync(name, text);
			return true;
		}
		catch (e){
			alert("Failed to append data to file: "+name+" : "+e.toString());
			return false;
		}
	},

  read_file : function (name) {
		var fs = require('fs');
		try{
			return fs.readFileSync(name, "utf-8");
		}
		catch (e){
			alert("Failed to read file: "+name+" : "+e.toString());
			return "";
		}
  },

  copy_file : function(src, dest) {
    var content ;
    content = FSO.read_file(src);
		return FSO.create_file(dest, content);
  },

	delete_file : function(name) {
		var fs = require('fs');
		try{
			fs.unlinkSync(name);
			return true;
		}
		catch (e){
			alert("Failed to delete file: "+name+" : "+e.toString());
			return false;
		}
  }

};
