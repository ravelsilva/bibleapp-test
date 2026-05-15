{
  "name": "NoteFile",
  "type": "object",
  "properties": {
    "note_id": {
      "type": "string",
      "description": "ID da nota a qual o arquivo pertence"
    },
    "file_name": {
      "type": "string",
      "description": "Nome do arquivo"
    },
    "file_url": {
      "type": "string",
      "description": "URL do arquivo (PDF, imagem)"
    },
    "file_type": {
      "type": "string",
      "enum": [
        "pdf",
        "image",
        "other"
      ],
      "description": "Tipo do arquivo"
    },
    "file_size": {
      "type": "number",
      "description": "Tamanho do arquivo em bytes"
    },
    "annotation": {
      "type": "string",
      "description": "Anota\u00e7\u00f5es sobre o arquivo"
    }
  },
  "required": [
    "note_id",
    "file_name",
    "file_url"
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