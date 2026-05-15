{
  "name": "Note",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "T\u00edtulo da nota"
    },
    "content": {
      "type": "string",
      "description": "Conte\u00fado rico da nota (HTML)"
    },
    "folder_id": {
      "type": "string",
      "description": "ID da pasta onde a nota est\u00e1"
    },
    "cover_color": {
      "type": "string",
      "description": "Cor de destaque da nota"
    },
    "icon": {
      "type": "string",
      "description": "Emoji da nota"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tags da nota"
    },
    "favorito": {
      "type": "boolean",
      "default": false,
      "description": "Nota favoritada"
    },
    "pregado": {
      "type": "boolean",
      "default": false,
      "description": "J\u00e1 foi pregada"
    },
    "data_pregacao": {
      "type": "string",
      "format": "date",
      "description": "Data em que foi pregada"
    },
    "fixado": {
      "type": "boolean",
      "default": false,
      "description": "Nota fixada no topo"
    }
  },
  "required": [
    "title"
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