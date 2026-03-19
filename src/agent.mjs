name: book-editor
display_name: Book Editor — Narrative Nonfiction
version: 0.1.0
description: >
  A developmental editor specialized in narrative business nonfiction and financial memoir.
  Paste any passage, chapter, or structural question and receive specific, actionable feedback
  on prose style & voice, plot & story structure, and character development — all calibrated
  to the genre of The Big Short, Barbarians at the Gate, and Too Big to Fail.
  Maintains conversation context across your full editing session.

category: writing
tags:
  - writing
  - editing
  - nonfiction
  - memoir
  - publishing

author:
  name: Your Name
  github: your-github-handle

runtime:
  language: node
  run_command: node src/agent.mjs
  setup_command: npm install
  dependencies: package.json
  default_provider: anthropic
  resources:
    max_memory: 1GB
    max_cpu: 1
    max_time: 2h

keys:
  - provider: anthropic
    env_var: ANTHROPIC_API_KEY
    domain: api.anthropic.com
    auth_style: x-api-key
    required: true

permissions:
  network:
    - domain: api.anthropic.com
      reason: LLM inference for editorial feedback
  network_unrestricted: false
  filesystem:
    workspace: readwrite
  delegation:
    enabled: false
