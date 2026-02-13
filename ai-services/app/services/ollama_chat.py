import ollama

history = []
model = "deepseek-r1:7b"
while True:
    user_input = input("You: ")
    if user_input == "exit" or user_input == "quit" or user_input == "exit()" or user_input == "quit()" or user_input == "exit()" or user_input == "quit()":
        break
    history.append({"role": "user", "content": user_input})
    response = ollama.chat(model=model, messages=history)
    history.append({"role": "assistant", "content": response["message"]["content"]})
    print("AI: ", response["message"]["content"])   