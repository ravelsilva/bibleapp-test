{
  "name": "DeletedNote",
  "type": "object",
  "properties": {
    "original_id": {
      "type": "string",
      "description": "ID original da nota"
    },
    "title": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "folder_id": {
      "type": "string"
    },
    "icon": {
      "type": "string"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "favorito": {
      "type": "boolean"
    },
    "pregado": {
      "type": "boolean"
    },
    "data_pregacao": {
      "type": "string"
    },
    "fixado": {
      "type": "boolean"
    },
    "deleted_at": {
      "type": "string",
      "description": "ISO timestamp da exclus\u00e3o"
    },
    "expires_at": {
      "type": "string",
      "description": "ISO timestamp de expira\u00e7\u00e3o (48h)"
    }
  },
  "required": [
    "title",
    "deleted_at",
    "expires_at"
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