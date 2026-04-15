#!/usr/bin/env python
"""
Test LM Studio + Mistral directly
"""

from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:1234/v1",
    api_key="lm-studio"
)

MODEL = "mistralai/mistral-7b-instruct-v0.3"

print("Testing LM Studio with Mistral...")
print(f"Model: {MODEL}")
print()

# Test with a simple question
test_question = "What is the best book genre for learning history?"

prompt = f"""[INST] You are a helpful book assistant. Answer this question concisely.

Question: {test_question}

Answer: [/INST]"""

try:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.3,
    )
    answer = response.choices[0].message.content.strip()
    print(f"✅ SUCCESS! LM Studio responded:")
    print(f"Answer: {answer}")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("\nPlease check:")
    print("1. Is LM Studio running?")
    print("2. Is the Local Server started on port 1234?")
    print("3. Is the model 'mistralai/mistral-7b-instruct-v0.3' loaded?")
    print("4. Check LM Studio → Local Server → Model selection")