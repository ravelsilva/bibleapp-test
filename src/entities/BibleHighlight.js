{
  "name": "BibleHighlight",
  "type": "object",
  "properties": {
    "version": {
      "type": "string"
    },
    "book_abbrev": {
      "type": "string"
    },
    "book_name": {
      "type": "string"
    },
    "chapter": {
      "type": "number"
    },
    "verse": {
      "type": "number"
    },
    "verse_text": {
      "type": "string"
    },
    "color": {
      "type": "string",
      "enum": [
        "yellow",
        "green",
        "blue",
        "red",
        "purple"
      ],
      "description": "yellow=Promessas, green=F\u00e9, blue=Sabedoria, red=Doutrina, purple=Prega\u00e7\u00e3o"
    },
    "annotation": {
      "type": "string",
      "description": "Anota\u00e7\u00e3o pessoal do vers\u00edculo"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "version",
    "book_abbrev",
    "chapter",
    "verse",
    "verse_text"
  ],
  "rls": {
    "create": {
      "created_by": "{{user.email}}"
    },
    "read": {
      "created_by": "{{user.email}}"
    },
    "update": {
      "created_by": "{{user.email}}"
    },
    "delete": {
      "created_by": "{{user.email}}"
    }
  }
}