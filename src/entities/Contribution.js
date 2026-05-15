{
  "name": "Contribution",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome do contribuinte"
    },
    "description": {
      "type": "string",
      "description": "Descri\u00e7\u00e3o da contribui\u00e7\u00e3o/sugest\u00e3o"
    },
    "user_email": {
      "type": "string",
      "description": "Email do usu\u00e1rio que enviou"
    },
    "status": {
      "type": "string",
      "enum": [
        "pending",
        "reviewed",
        "done"
      ],
      "default": "pending"
    }
  },
  "required": [
    "name",
    "description"
  ],
  "rls": {
    "create": {},
    "read": {
      "$or": [
        {
          "created_by": "{{user.email}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    },
    "update": {
      "$or": [
        {
          "created_by": "{{user.email}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    },
    "delete": {
      "$or": [
        {
          "created_by": "{{user.email}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    }
  }
}