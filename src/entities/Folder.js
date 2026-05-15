{
  "name": "Folder",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome da pasta"
    },
    "color": {
      "type": "string",
      "description": "Cor da pasta (hex ou nome)"
    },
    "parent_id": {
      "type": "string",
      "description": "ID da pasta pai (para subpastas)"
    },
    "icon": {
      "type": "string",
      "description": "Emoji ou \u00edcone da pasta"
    },
    "fixado": {
      "type": "boolean",
      "default": false,
      "description": "Pasta fixada no topo"
    }
  },
  "required": [
    "name"
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