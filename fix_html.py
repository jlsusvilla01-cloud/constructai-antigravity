import os

filepath = r'c:\Users\jswag\Downloads\constructai-antigravity\constructai-antigravity\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to turn the literal string sequence \\n into a real newline character \n
# and also \n into \n (some tool calls double escape, some single)
# But we must be careful not to break actual \n in strings if they were intended.
# Since these are function bodies, most \n should be real newlines.

# Look for the start of the "mega-line" block after CRM()
marker = "}\n\nfunction ERP_HUB"
# Wait, let's look at what we actually have in the file.
# My previous view_file showed: 1564: }\n\nfunction ERP_HUB(){\n  const allP...

# Let's fix it globally first as a quick attempt.
fixed_content = content.replace('\\n', '\n')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(fixed_content)
