{
  "name": "BibleFavorite",
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
    "reference": {
      "type": "string",
      "description": "Ex: Jo\u00e3o 3:16 \u2014 ACF"
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