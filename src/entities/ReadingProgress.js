{
  "name": "ReadingProgress",
  "type": "object",
  "properties": {
    "year": {
      "type": "number"
    },
    "month": {
      "type": "number",
      "description": "1-12"
    },
    "book_abbrev": {
      "type": "string"
    },
    "book_name": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "not_started",
        "in_progress",
        "completed"
      ],
      "default": "not_started"
    },
    "chapters_read": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "last_chapter": {
      "type": "number"
    }
  },
  "required": [
    "year",
    "month",
    "book_abbrev",
    "book_name"
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