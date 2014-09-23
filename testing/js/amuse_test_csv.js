// amuse_um software validation
// testing CSV
var TEST_CSV = {
  version : "0.0",
  date : "2014-09-02",
  tests : [
    // meta level tests
    "", // test0
    "only one column\n", // test1
    "only one column\n only one row\n", // test2
    "col1,col2\nno comma or tab\n", // test3
    "col1,col2\nval1, val2, val3\n", // test4
    "A,B,C\n1,1,1\n1,1,1\n", // test5
    "A,B,C\na1,1,1\na2,2,2\n", // test6
    "A,,C\na1,1,1\na2,2,2\n", // test7
    "A,long string abcdefghijklmnopqrstuvwxyz 0123456789 abcdefghijklmnopqrstuvwxyz 0123456789,C\na1,1,1\na2,2,2\n", // test8
    "pk,B,C\na,\"1,2\",1\n", // test9
    "pk,B,C\na,\"\"\"1,2\"\"\",1\n", // test10
    "pk,B\na,\"1 \"\"2\"\" 3\"\n", // test11
    "pk,B\na,\"\"\"1\"\",\"\"2\"\"\"\n", // test12
    "pk,B\na,\"\"\"\"\"1\"\",\"\"2\"\"\"\"\"\n", // test13
    "pk,B\na,\"\"\"\"\n", // test 14
    "pk,B\na,\"\"\"\"\"\"\n", // test15
    "pk,B\na,\"\"\"\"\"\"\"\"\n", // test16
    "pk,B\na,\",,,\"\n", // test17
    "pk,B\na,\"\"\",\"\"\"\",\"\"\"\",\"\"\"\n" // test18
  ],
  results : [
    "FAILED : "+ // test0 = empty string test
      "empty first line",
    "FAILED : "+ // test1 = single line test
      "no rows",
    "FAILED : "+ // test2 = single column test
      "only one column",
    "FAILED : "+ // test3 = missing row element
      "incorrect number of values in row 1 : no comma or tab",
    "FAILED : "+ // test4 = too many row elements
      "incorrect number of values in row 1 : val1, val2, val3",
    "OK : "+ // test 5 valid csv file with no primary key
      "{\"row1\":{\"A\":\"1\",\"B\":\"1\",\"C\":\"1\"},\"row2\":{\"A\":\"1\",\"B\":\"1\",\"C\":\"1\"}}", 
    "OK : "+ // test 6 valid csv file with primary key in column A
      "{\"a1\":{\"B\":\"1\",\"C\":\"1\"},\"a2\":{\"B\":\"2\",\"C\":\"2\"}}", 
    "FAILED : "+ // test 7 = header value zero length
      "all keys in header must be between 1 and 80 characters in length", 
    "FAILED : "+ // test 8 = header value greater than 80 characters
      "all keys in header must be between 1 and 80 characters in length",
    "OK : "+ // test 9 valid csv file with value containing a comma
      "{\"a\":{\"B\":\"1,2\",\"C\":\"1\"}}", 
    "OK : "+ // test 10 valid csv file with value containing a comma and surrounded by quotes
      "{\"a\":{\"B\":\"\\\"1,2\\\"\",\"C\":\"1\"}}",
    "OK : "+ // test 11 valid csv file with value containing a number surrounded by quotes
      "{\"a\":{\"B\":\"1 \\\"2\\\" 3\"}}",
    "OK : "+ // test 12 valid csv file with two number each surrounded by quotes, separated by a comma
      "{\"a\":{\"B\":\"\\\"1\\\",\\\"2\\\"\"}}",
    "OK : "+ // test 13 valid csv file as test 12 but the whole surrounded by quotes
      "{\"a\":{\"B\":\"\\\"\\\"1\\\",\\\"2\\\"\\\"\"}}",
    "OK : "+ // test 14 valid csv file with value containing single quotes character 
      "{\"a\":{\"B\":\"\\\"\"}}",
    "OK : "+ // test 15 valid csv file with value containing two quotes characters 
      "{\"a\":{\"B\":\"\\\"\\\"\"}}",
    "OK : "+ // test 16 valid csv file with value containing three quotes characters 
      "{\"a\":{\"B\":\"\\\"\\\"\\\"\"}}",
    "OK : "+ // test 17 valid csv file with value containing three commas
      "{\"a\":{\"B\":\",,,\"}}",
    "OK : "+ // test 18 valid csv file with value containing three commas, each surrounded by quotes
      "{\"a\":{\"B\":\"\\\",\\\"\\\",\\\"\\\",\\\"\"}}"
  ],
  amuse : {},
  testing: function(i){
    var result;
    result = CSV.csv_to_amuse(TEST_CSV.tests[i]);
    if (typeof result === "string"){ return result; }
    return "OK : "+JSON.stringify(result.objects);
  },
  start: function(){
    var i, result;
    document.getElementById("report").innerHTML = "Version "+TEST_CSV.version+" ["+TEST_CSV.date+"]";
    for (i=0; i<TEST_CSV.tests.length; i+= 1){
      result = TEST_CSV.testing(i);
      if (result !== TEST_CSV.results[i]){
        document.getElementById("result").innerHTML = "Failed test "+i+" returned "+result+
          " expected "+TEST_CSV.results[i];
        return "";
      }
    }
    document.getElementById("result").innerHTML = "Successfully completed all tests";
    return "";
	}
};
      
onload = TEST_CSV.start;       
