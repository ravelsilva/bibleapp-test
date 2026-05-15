{
  "name": "QuickIdea",
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Conte\u00fado da ideia r\u00e1pida"
    },
    "converted": {
      "type": "boolean",
      "default": false,
      "description": "Se foi convertida em nota"
    },
    "note_id": {
      "type": "string",
      "description": "ID da nota gerada a partir desta ideia"
    }
  },
  "required": [
    "content"
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