var amuse_TEST = {
  "edition": "3",
  "date": "04 Oct 2014",
  "objects": {
    "Test1": {
      "briefly": "Test object one",
      "description_note": "testing only",
      "content_summary": "Testing for unicode characters &amp; £ € © ç ö ÿ ¼ ½ ¾",
      "$characters": [
        "UTF-8: keystroke Alt+0160 to 0172, 0174, 0175  ¡¢£¤¥¦§¨©ª«¬®¯",
        "UTF-8: keystroke Alt+0176 to 0191 °±²³´µ¶·¸¹º»¼½¾¿",
        "UTF-8: keystroke Alt+0192 to 0207 ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ",
        "UTF-8: keystroke Alt+0208 to 0223 ÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß",
        "UTF-8: keystroke Alt+0224 to 0239 àáâãäåæçèéêëìíîï",
        "UTF-8: keystroke Alt+0240 to 0255 ðñòóôõö÷øùúûüýþÿ",
        "This has been written with amused_hta using only ASCII characters.",
        "Alt+0173 was omitted as JSLint reports it as an unsafe character"
      ]
    },
    "Test2": {
      "briefly": "Test object two - ceramic trio",
      "has_parts": "tea cup, saucer and plate",
      "acquisition_method": "gift",
      "donor": "Mrs Towneley",
      "acquisition_date": "1900-01-01"
    },
    "Test3": {
      "briefly": "tea cup",
      "part_of": "Test2",
      "current_location": "store",
      "exhibit_note": "stored",
      "normal_location": "store"
    },
    "Test4": {
      "briefly": "saucer",
      "part_of": "Test2",
      "normal_location": "store",
      "current_location": "store",
      "exhibit_note": "stored"
    },
    "Test5": {
      "briefly": "plate",
      "part_of": "Test2",
      "normal_location": "store",
      "current_location": "store",
      "exhibit_note": "stored"
    }
  },
  "name": "amuse_um TEST collection",
  "$props": [
    "briefly",
    "has_parts",
    "part_of",
    "oef_number",
    "acquisition_method",
    "donor",
    "acquisition_date",
    "credit_line",
    "image",
    "current_location",
    "normal_location",
    "$location_history",
    "exhibit_note",
    "location_reservation",
    "$doc_links",
    "disposal_date",
    "disposal_method",
    "disposal_note",
    "disposal_reference_number",
    "exit_reference_number",
    "$tags",
    "dimensions",
    "condition_note",
    "condition",
    "description_note",
    "production_note",
    "creator",
    "artist_note",
    "place_made",
    "content_summary",
    "$characters"
  ],
  "$groups": [
    "$identity",
    "$description",
    "$location",
    "$production",
    "$acquisition",
    "$other_info",
    "$disposal"
  ],
  "$identity": [
    "briefly",
    "has_parts",
    "part_of"
  ],
  "$description": [
    "content_summary",
    "dimensions",
    "condition_note",
    "condition",
    "description_note",
    "$doc_links"
  ],
  "$location": [
    "current_location",
    "normal_location",
    "$location_history",
    "exhibit_note",
    "location_reservation"
  ],
  "$production": [
    "production_note",
    "creator",
    "artist_note",
    "place_made"
  ],
  "$acquisition": [
    "oef_number",
    "acquisition_method",
    "donor",
    "acquisition_date",
    "credit_line"
  ],
  "$other_info": [
    "$characters",
    "image",
    "$tags"
  ],
  "$disposal": [
    "disposal_date",
    "disposal_method",
    "disposal_note",
    "disposal_reference_number",
    "exit_reference_number"
  ],
  "manual": "false"
};
