// CSV to amuse_JSON
// 2014-09-29 v0.1 no longer includes primary key from $props
var CSV = {
  version : "0.1",
  csv_split: function(str){
    "use strict";
    function unquote(text){ // remove all quotes used to create the CSV string
      if (/^".*"$/.test(text)){ return text.slice(1,-1).replace(/""/g,'"') ; }
      return text;
    }
    
    var cs, len, i, ch, comma, quote;
    cs = [];
    len = str.length;
    comma = 0;
    quote = false;
    for(i=0; i<len; i += 1){
      ch = str.charAt(i);
      if (ch === "\""){
        if (quote){ quote = false; }
        else {quote = true; }
      }
      else{
        if ((ch === ",") && (! quote)){
          cs.push(unquote(str.slice(comma, i)));
          comma = i+1;
        }
      }
    }
    if (comma<len){ cs.push(unquote(str.slice(comma))); }
    else{ cs.push(""); }
    return cs;
  },
  table_to_json: function(table, uid){
    "use strict";
    var header, uid_column, columns, i, rows, json, j, row, key, k;
    header = table[0];
    columns = header.length;
    if (uid){
      uid_column = 0;
      for (i=0; i <columns; i+= 1){
        if (header[i] === uid){
          uid_column = i;
          break;
        }
      }
    }
    else{ uid_column = -1;}
    rows = table.length;
    json = {};
    for (j=1; j<rows; j += 1){
      row = table[j];
      if (uid_column<0){ key = "row"+j; }
      else{ key = row[uid_column]; }
      json[key] = {};
      for (k=0; k<columns; k += 1){
        if (row[k] && (k !== uid_column)){ json[key][header[k]] = row[k]; }
      }
    }
    return json;
  },
  has_primary_key: function(table){
    var header, columns, rows, i, uid, values, j, row;
    header = table[0];
    columns = header.length;
    rows = table.length;
    for (i=0; i<columns; i += 1){
      uid = header[i];
      if (uid.length<25){ // very long primary key names are hard to read
        values = {};
        for (j=1; j<rows; j += 1){
          row = table[j];
          if (! row[i]){ 
            uid = "";
            break;
          }
          if (row[i] in values){
            uid = "";
            break;
          }
          values[row[i]] = true;
        }
        if (uid){ return uid; }
      }
    }
    return "";
  },
  csv_to_amuse: function(text){
    "use strict";
// expects file lines separated by CRLF or LF with comma separated headers on line 0
// keys in header must be between 1 and 80 characters in length
    var lines, line_count, headers, header_count, i,
    rows, j, key, line, row, pkey, json, header1, k;
    lines = text.split("\r\n");
    if (lines.length<2){lines = text.split("\n"); }
    line_count = lines.length;
    if (! lines[0]){return "FAILED : empty first line"; }
    if (line_count<3){return "FAILED : no rows"; }
    headers = CSV.csv_split(lines[0]);
    header_count = headers.length;
    if (header_count<2){return "FAILED : only one column"; }
    for (i=0; i<header_count; i += 1){
      key = headers[i];
      if ((key.length === 0)||(key.length>80)){
        return "FAILED : all keys in header must be between 1 and 80 characters in length";
      }
    }
    rows = [];
    rows.push(headers);
    for (j=1; j<line_count; j += 1){
      line = lines[j];
      if (line){
        row = CSV.csv_split(line);
        if (row.length !== header_count){
          return "FAILED : incorrect number of values in row "+j+" : "+lines[j];
        }
        else{ // if all values in row are empty, discard row
          if (row.join("").length>0){ rows.push(row); }
        }
      }
    }
    pkey = CSV.has_primary_key(rows);
    json = CSV.table_to_json(rows,pkey);
    if (typeof json === "string"){return json; }
    CSV.result = {};
    CSV.result.objects = json;
    // do not include the primary key in the copy of the headers list 
    if (pkey){
      header1 = [];
      for (k in headers){
        if (headers[k] !== pkey){ header1.push(headers[k]); }
      }
      headers = header1;
    }
    CSV.result.$props = headers;
    CSV.result.$groups = ["$props"];
    return CSV.result;
  }
  
};
