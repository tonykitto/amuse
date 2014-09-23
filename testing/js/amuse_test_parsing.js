// amuse_um software validation
// testing amuse_PARSE
var TEST = {
  version : "0.0",
  date : "2014-08-09",
  tests : [
    // meta level tests
    "", // test0
    "x\n", // test1
    "{\n", // test2
    "{}\n", // test3
    "{x}\n", // test4
    "{\"x\"}\n", // test5
    "{\"x\" : y}\n", // test6
    "{\"x\" : true}\n", // test7
    "{\"x\" : false}\n", // test8
    "{\"x\" : null}\n", // test9
    "{\"x\" : [\"y\"]}\n", // test10
    "{\"x\" : {\"x\" : \"y\"}}\n", // test11
    "{\"x\" : \"y\",\n\"x\" : \"y\"}\n", // test12
    "{\"x\" : \"y\"}\n", // test13
    "{\"x\" : \"y\",}\n", // test14
    "{\"$x\" : \"y\"}\n", // test 15
    "{\"$x\" : []}\n", // test16
    "{\"$x\" : [\"y\"]}\n", // test 17
    "{\"$x\" : [\"y\",]}\n", // test 18
    "{\"$x\" : [[\"y\"]]}\n", // test 19
    "{\"$x\" : [{\"x\" : \"y\"}]}\n", // test 20
    // objects level tests
    "{\"objects\": {}}\n", // test21
    "{\"objects\": \"y\"}\n", // test22
    "{\"objects\": [\"y\"]}\n", // test23
    "{\"objects\": {\"x\" : \"y\"}\n},", // test 24
    "{\"objects\": {\"x\" : [\"y\"]}\n", // test 25
    "{\"objects\": {\"x\" : {}}\n", // test 26
    "{\"objects\": {\"x\" : {\"x\" : \"y\"}}}\n", // test 27
    "{\"objects\": {\"x\" : {\"x\" : \"y\"},}}\n", // test 28
    "{\"objects\": {\n\"x\" : {\"x\" : \"y\",\"x\" : \"y\"}\n}\n}\n", // test 29
    "{\"objects\": {\n\"x\" : {\"$x\" : [\"y\"]}\n}\n}\n", // test 30
    "{\"objects\": {\n\"x\" : {\"$x\" : \"y\"}\n}\n}\n", // test 31
    "{\"objects\": {\n\"x\" : {\"x\" : \"y\"}\n},\n}\n", // test 32
    "{\"objects\": {\n\"x\" : {\"x\" : \"y\"},\n\"x1\" : {\"x\" : \"y\"}\n}\n}", //test 33
    // amuse_um extra tests
    "{\"\" : \"y\"}", // test 34
    "{\"x\" : \"y\",\n\"objects\" : {\"x\" : {\"x\" : \"y\"}\n},\n\"x1\" : \"y\"}\n", //test 35
    // short multi-line test 36
    "{\"name\": \"set of tests for amuse_PARSE\",\n"+
    "\"$props\": [\"test\",\"$list\",\"apple\",\"orange\"],\n"+
    "\"$groups\": [\"$basic\", \"$fruit\"],\n"+
    "\"$basic\": [\"test\",\"$list\"],\n"+
    "\"$fruit\": [\"apple\",\"orange\"],\n"+
    "\"test\": \"16\",\n"+
    "\"edition\": \"1\",\n"+
    "\"date\": \"10 Jun 2014\",\n"+
    "\"$list\": [\"a\"],\n"+
    "\"objects\": {\n"+
    "\"ob1\":{\n"+
    "\"test\": \"string\",\n"+
    "\"$list\": [\"a\", \"b\"]\n"+
    "},\n"+
    "\"ob3\":{\n"+
    "\"test\": \"string\",\n"+
    "\"$list\": [\"a\", \"b\"]\n"+
    "}\n"+
    "},"+
    "\"meta\": \"string\"\n"+
    "}\n"    
  ],
  results : [
    "SyntaxError : "+ // test0 = empty string test
      "Unexpected '' at line 1 : ",
    "SyntaxError : "+ // test1 = invalid character
      "Unexpected 'x' at line 1 : x",
    "SyntaxError : "+ // test2 = unclosed object
      "Bad object at line 2 : ",
    "SyntaxError : "+ // test3 = empty object
      "no empty objects in amuse_um at line 1 : {}",
    "SyntaxError : "+ // test4 invalid character in object
      "Bad string at line 1 : {x}",
    "SyntaxError : "+  // test5 missing value
      "Expected ':' instead of '}' at line 1 : {\"x\"}",
    "SyntaxError : "+ // test 6 value is invalid character
      "Unexpected 'y' at line 1 : {\"x\" : y}", 
    "SyntaxError : "+ // test 7 true not allowed
      "true invalid in amuse_um at line 1 : {\"x\" : true}", 
    "SyntaxError : "+ // test 8 false not allowed
      "false invalid in amuse_um at line 1 : {\"x\" : false}", 
    "SyntaxError : "+ // test 9 null not allowed
      "null invalid in amuse_um at line 1 : {\"x\" : null}", 
    "SyntaxError : "+ // test 10 value is invalid array
      "only keys starting with $ may have an array value at line 1 : {\"x\" : [\"y\"]}", 
    "SyntaxError : "+ // test 11 only objects key allowed object value
      "only 'objects' key allowed object value at line 1 : {\"x\" : {\"x\" : \"y\"}}",
    "SyntaxError : "+ // test 12 duplicate meta-data key
      "Duplicate key \"x\" at line 2 : \"x\" : \"y\"}",
    "test13 is valid object", // test 13 valid meta-data key-value pair
    "SyntaxError : "+ // test 14 invalid trailing comma
      "Bad string at line 1 : {\"x\" : \"y\",}",
    "SyntaxError : "+ // test 15 value is invalid string 
      "key starting with $ requires an array value at line 1 : {\"$x\" : \"y\"}",
    "test16 is valid object", // test 16 valid meta-data $key with empty array
    "test17 is valid object", // test 17 valid meta-data $key with non-empty array
    "SyntaxError : "+ // test 18 invalid trailing comma
      "Unexpected ']' at line 1 : {\"$x\" : [\"y\",]}",
    "SyntaxError : "+ // test 19 invalid array value - array
      "no array allowed within array at line 1 : {\"$x\" : [[\"y\"]]}",
    "SyntaxError : "+ // test 20 invalid array value - object
      "no object allowed within array at line 1 : {\"$x\" : [{\"x\" : \"y\"}]}",
    "SyntaxError : "+ // test 21 objects object is empty
      "no empty objects in amuse_um at line 1 : {\"objects\": {}}",
    "SyntaxError : "+ // test 22 invalid objects value - string
      "'objects' key only used for objects at line 1 : {\"objects\": \"y\"}",
    "SyntaxError : "+ // test 23 invalid objects value - array
      "only keys starting with $ may have an array value at line 1 : {\"objects\": [\"y\"]}",
    "SyntaxError : "+ // test 24 'objects' object value must be an object not a string
      "only 'objects' key allowed object value at line 1 : {\"objects\": {\"x\" : \"y\"}",
    "SyntaxError : "+ // test 25 'objects' object value must be an object not an array
      "objects level objects only at line 1 : {\"objects\": {\"x\" : [\"y\"]}",
    "SyntaxError : "+ // test 26 'objects' object value must not be an empty object
      "no empty objects in amuse_um at line 1 : {\"objects\": {\"x\" : {}}",
    "test27 is valid object", // test 27 valid objects object value valid properties object
    "SyntaxError : "+ // test 28 invalid trailing comma
      "Bad string at line 1 : {\"objects\": {\"x\" : {\"x\" : \"y\"},}}",
    "SyntaxError : "+ // test 29 duplicate property key
      "Duplicate key \"x\" at line 2 : \"x\" : {\"x\" : \"y\",\"x\" : \"y\"}",
    "test30 is valid object", // test 30 object properties object with valid array value
    "SyntaxError : "+ // test 31 object properties object with invalid string value
      "key starting with $ requires an array value at line 2 : \"x\" : {\"$x\" : \"y\"}",
    "SyntaxError : "+ // test 32 invalid trailing comma
      "Bad string at line 4 : }",
    "test33 is valid object", // test 33 object properties values valid
    "SyntaxError : "+ // test 34 invalid empty key
      "empty key invalid in amuse_um at line 1 : {\"\" : \"y\"",
    "test35 is valid object", // test 35 valid meta-data following after 'objects'
    "test36 is valid object" // test 36 valid multi-object text
  ],
  "basic_testing" : true,
  amuse : {},
  testing: function(i){
    function test_schema(){
      if (! ("name" in TEST.amuse)){return "no name in amuse"; }
      if (! ("$props" in TEST.amuse)){return "no property list in amuse"; }
      if (TEST.amuse.$props.length < 1){ return "no mandatory property key"; }
      return "completed "+TEST.amuse.name;
    }

    var error_line;
    try{    
      TEST.amuse = amuse_PARSE(TEST.tests[i]);
    }
    catch(arg){
      error_line = arg.text.slice(arg.line_start);
      error_line = error_line.slice(0, error_line.indexOf("\n")); 
      return arg.name+" : "+arg.message+" at line "+arg.line_number+" : "+error_line;
    }
    if (TEST.basic_testing){ return "test"+i+" is valid object"; }
    return test_schema();
  },
  start: function(){
    var i, result;
    document.getElementById("report").innerHTML = "Version "+TEST.version+" ["+TEST.date+"]";
    for (i=0; i<TEST.tests.length; i+= 1){
      result = TEST.testing(i);
      if (result !== TEST.results[i]){
        document.getElementById("result").innerHTML = "Failed test "+i+" returned "+result+
          " expected "+TEST.results[i];
        return "";
      }
    }
    document.getElementById("result").innerHTML = "Successfully completed all tests";
    return "";
	}
};
      
onload = TEST.start;       
