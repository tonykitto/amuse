## amuse_um collection management system
amuse_um is a basic collections management system suitable for a small to medium museum or an individual collector. It is written in JavaScript and uses a sub-set of JSON, HTML including HTML5 FILE API and CSS.

amuse_um JSON is a sub-set of JSON that in its simplest form uses only the basic types String and Object. At the top level of name/value pairs, only one pair with the name "objects" has an Object as its value and is used to describe each museum object in a collection. The other name/value pairs provide meta-data for the collection as a whole with String values. 

Each name in the "objects" group of name/value pairs is that of the collection's 'object number' with an Object containing one or more name/value pairs, providing property names and their String values.

### Example of an amuse_um Object
```
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
```

In the domain of museums, object number is a unique number assigned to a physical object that is part of a museum's collection, also known as a catalog or accession number. In the above example, the object number is "waco102" .

CSV text files that have unique headers in the first row may be transformed into amuse_um JSON files, either using an existing primary key as the object number or by use the CSV row number to create an object number if there is no existing primary key.

The schema for an amuse_um JSON file created from a CSV text file is simply a list of all the properties extracted from the CSV headers. In order to include the list of properties in the amuse_um JSON file, amuse_um JSON is extended to include an Array value in place of a String value in any of the meta-data name/value pairs in the form of a list of strings. The Array value may only be one-dimensional and may contain only Strings. It has been decided that a list of strings can also be used as values for museum object properties. 

One aim in the design of amuse_um is to make it easy to read amuse_um JSON and so it has been decided that the names of properties with Array values must begin with $ so they are clearly identified by the reader. The list of all the objects in an amuse_um JSON Object is named **"$props"** .  A further requirement, when viewing an object with large numbers of properties in a browser, is to arrange the properties into groups. The list of groups is named **"$groups"** and initially has a single entry *"$props"* . There is no restriction on the names of groups other than they must be unique identifiers beginning with $ and the list may only contain existing property names. 

There are many choices for viewing amuse_um JSON Objects including a spreadsheet type grid but the one most appropriate for Objects with large numbers of properties is a master-detail layout where the master list contains entries for each museum object number together with a brief description of the object. The brief description is taken from the object's property value for the property that is first string in *"$props"* . The detail part will display all the property values for the selected object in the order determined by *"$groups"* .

The current **VIEW** object uses a master-detail layout with the ability to filter the master list based on simple text matches across all properties and sorting propert values against a selected property.

The current **EDIT** object provides for simple editing for existing property values including use of controlled vocabularies, which themselves are editable amuse_um JSON objects, and also recording further museum objects as they are added to the collection.










