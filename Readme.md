## amuse_um collection management system
amuse_um is a basic collections management system suitable for a small to medium museum or an individual collector. It is written in JavaScript and uses a sub-set of JSON, HTML including HTML5 FILE API and CSS.

amuse_um JSON is a sub-set of JSON that in its simplest form uses only the basic types String and Object. At the top level of name/value pairs, only one pair with the name "objects" has an Object as its value and is used to describe each museum object in a collection. The other name/value pairs provide meta-data for the collection as a whole with a String value. 

Each name in the "objects" group of name/value pairs is that of the collection's 'object number' with an Object containing one or more name/value pairs, providing property names and their String values.

### Example of an amuse_um Object
'''
{
  "name": "Towneley watercolours collection",
  "edition": "1",
  "date": "13 Sep 2014",
  ... <more meta-data>
  "objects": {
    "waco102": {
      "briefly": "Towneley Hall by J. M. W. Turner",
      "title": "'Towneley Hall' c. 1798",
      "acquisition_method": "purchase",
      "acquisition_date": "1939",
      ... <more properties>
    },
    ... <more objects>
  }
}
'''

In the domain of museums, object number is a unique number assigned to a physical object that is part of a museum's collection, also known as a catalog or accession number. In the above example, the object number is "waco102" .

CSV text files that have unique headers in the first row may be transformed into amuse_um JSON files, either using an existing primary key as the object number or by use the CSV row number to create an object number if there is no existing primary key.

The amuse_um Object "objects" may be transformed into a CSV text file, where the first column contains object numbers, the row 0 headers contain the individual properties and subsequent rows containing the object_number#.property value. 





