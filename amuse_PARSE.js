var amuse_PARSE = function () {
// This is a function that parses a defined sub-set of JSON text, producing 
// an amuse_um JavaScript data structure that only allows non-empty string values.
// It is based on Douglas Crockford's JSOn parser in JavaScript: The Good Parts.
"use strict";
var at,   // The index of the current character
  line,
  line_start,
  ch,   // The current character
  level,
  current_key,
  meta,
  is_array,
  escapee = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  },
    text,

  error = function (m) {
    // Call error when something is wrong.
    throw {
      name:    'SyntaxError',
      message: m,
      at:      at,
      line_number: line,
      line_start: line_start,
      text:    text
    };
  },

  next = function (c) {
    // If a c parameter is provided, verify that it matches the current character.
    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }
  // Get the next character. When there are no more characters,
  // return the empty string.
      ch = text.charAt(at);
      at += 1;
      return ch;
  },
  
  number = function () {
    // a number value is not valid in amuse_um
    error("Bad number");
  },
  
  string = function () {
    // Parse a string value.
    var hex, i, string, uffff;
    if ((level !== 2) && (current_key === "objects")){
      error("'objects' key only used for objects");
    }
    if ((level === 2) && (current_key !=="objects")){
      error("only 'objects' key allowed object value");
    }
    if (! is_array && current_key.charAt(0) === "$"){
      error("key starting with $ requires an array value");
    }
    string = '';
    // When parsing for string values, we must look for " and \ characters.
    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next();
          return string;
        }
        if (ch === '\\') {
          next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) { break; }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          }
          else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } 
          else { break; }
        }
        else { string += ch; }
      }
    }
    error("Bad string");
  },

  white = function () {
    // Skip whitespace.
    while (ch && ch <= ' ') { 
      if (ch === "\n"){
      line_start = at;
      line += 1; 
      }
      next(); 
    }
  },
  
  word = function () {
    // true, false, or null are invalid in amuse_um
    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        error("true invalid in amuse_um");
        break;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        error("false invalid in amuse_um");
        break;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        error("null invalid in amuse_um");
     }
   error("Unexpected '" + ch + "'");
 },

  value,  // Place holder for the value function.

  array = function () {
    // Parse an array value.
    if (is_array){ error("no array allowed within array"); }
    if (level === 2){ error("objects level objects only"); }
    if (current_key.charAt(0) !== "$"){
      error("only keys starting with $ may have an array value");
    }
    var array = [];
    is_array = true;
    if (ch === '[') {
      next('[');
      white();
      if (ch === ']') {
        next(']');
        is_array = false;
        current_key = "";
        return array;  // empty array
      }
      while (ch) {
        array.push(value());
        white();
        if (ch === ']') {
          next(']');
          is_array = false;
          current_key = "";
          return array;
        }
        next(',');
        white();
      }
    }
    error("Bad array");
  },

  object = function () {
    // Parse an object value.
    var key, object = {};
    if (is_array){ error("no object allowed within array"); }
    if (ch === '{') {
      next('{');
      white();
      if (ch === '}') {
        next('}');
        error("no empty objects in amuse_um");   // empty object
      }
      level += 1;
      while (ch) {
        key = string();
        white();
        next(':');
        if (key === ""){
          error("empty key invalid in amuse_um");
        }
        if (Object.hasOwnProperty.call(object, key)){
          error('Duplicate key "' + key + '"');
        }
        current_key = key;
        if (key === "objects"){ meta = false; }
        if (meta && (level > 1)){
          error("second level of meta data keys");
        }
        if (level >3){ error("second level of object_name keys"); }
        object[key] = value();
        white();
        if (ch === '}') {
          next('}');
          level += -1;
          if (level === 1){ meta = true; current_key = "";}
          if (level === 2){current_key = "objects"; }
          return object;
        }
        next(',');
        white();
      }
    }
    error("Bad object");
  };

  value = function () {
    // Parse a JSON value. It could be an object or an array or a string.
    // amuse_um does not allow numbers or the words true, false and null.
    var part;
    white();
    switch (ch) {
      case '{': return object();
      case '[': return array();
      case '"': part = string();
                if (part.length === 0){ error("empty string"); }
                return part;
      case '-': return number();
      default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
  };

// Return the json_parse function. It will have access to all of the above
// functions and variables.

  return function (source) {
    var result; 
    text = source;
    at = 0;
    line = 1;
    line_start = 0;
    ch = ' ';
    level = 0;
    current_key = "";
    meta = true;
    is_array = false;
    result = value();
    white();
    if (ch) { error("Syntax error"); }
    return result;
    };
}();    