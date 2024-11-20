from flask import Flask, render_template, redirect, request, jsonify, session
import os
import json
import random
import uuid

app = Flask(__name__, static_folder='static', template_folder='static')
app.secret_key = 'supersecretkey'  # Для керування сесіями

USERS_FILE = os.path.join('static', 'users.json')

if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as file:
        json.dump([], file, indent=4)

def load_users():
    with open(USERS_FILE, 'r', encoding='utf-8') as file:
        return json.load(file)

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as file:
        json.dump(users, file, ensure_ascii=False, indent=4)

@app.route('/')
def home():
    user_logged_in = 'user' in session
    return render_template('index.html', user_logged_in=user_logged_in, user=session.get('user'))

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    nickname = data.get('nickname')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not nickname or not password or not confirm_password:
        return jsonify({"error": "Усі поля обов'язкові"}), 400

    if password != confirm_password:
        return jsonify({"error": "Паролі не співпадають"}), 400

    users = load_users()
    if any(user['nickname'] == nickname for user in users):
        return jsonify({"error": "Нікнейм вже існує"}), 400

    user_id = str(uuid.uuid4())
    users.append({"id": user_id, "nickname": nickname, "password": password})
    save_users(users)

    return jsonify({"message": "Реєстрація успішна"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    nickname = data.get('nickname')
    password = data.get('password')

    if not nickname or not password:
        return jsonify({"error": "Усі поля обов'язкові"}), 400

    users = load_users()
    user = next((u for u in users if u['nickname'] == nickname and u['password'] == password), None)

    if not user:
        return jsonify({"error": "Невірний нікнейм або пароль"}), 401

    session['user'] = user['nickname']
    return jsonify({"message": "Авторизація успішна"}), 200

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/')

# Зберігає тести у пам'яті
tests = []

# Завантаження тестів із файлу
@app.route('/api/load_tests', methods=['GET'])
def load_tests():
    global tests
    file_path = os.path.join(app.static_folder, 'tests.json')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            tests = json.load(file)
        return jsonify({"message": "Тести успішно завантажено!", "tests": tests}), 200
    return jsonify({"error": "Файл tests.json не знайдено!"}), 404

# Генерація нового тесту
@app.route('/api/generate_test', methods=['POST'])
def generate_test():
    global tests
    operations = ['+', '-', '*', '/']
    num1 = random.randint(1, 100)
    num2 = random.randint(1, 100)
    operation = random.choice(operations)

    if operation == '+':
        correct_answer = num1 + num2
    elif operation == '-':
        correct_answer = num1 - num2
    elif operation == '*':
        correct_answer = num1 * num2
    elif operation == '/':
        correct_answer = round(num1 / num2, 2)

    wrong_answers = generate_wrong_answers(correct_answer, operation)
    options = random.sample([correct_answer] + wrong_answers, k=3)
    question = f"Скільки буде {num1} {operation} {num2}?"

    new_test = {"question": question, "options": options, "answer": correct_answer}
    tests.append(new_test)

    return jsonify(new_test), 201

# Додавання користувацького тесту
@app.route('/api/add_test', methods=['POST'])
def add_test():
    global tests
    data = request.json
    if "question" not in data or "options" not in data or "answer" not in data:
        return jsonify({"error": "Невірний формат даних"}), 400

    new_test = {
        "question": data["question"],
        "options": data["options"],
        "answer": data["answer"]
    }
    tests.append(new_test)

    return jsonify({"message": "Тест успішно додано!"}), 201

# Відображення всіх тестів
@app.route('/api/render_tests', methods=['GET'])
def render_tests():
    return jsonify(tests), 200

# Функція для генерації неправильних відповідей
def generate_wrong_answers(correct_answer, operation):
    wrong_answers = set()
    while len(wrong_answers) < 2:
        deviation = random.randint(-10, 10)
        if operation == '/':
            wrong_answer = round(correct_answer + deviation / 10, 2)
        else:
            wrong_answer = correct_answer + deviation

        if wrong_answer != correct_answer and wrong_answer > 0:
            wrong_answers.add(wrong_answer)
    return list(wrong_answers)

# Шлях до файлу збережених тестів
SAVED_TESTS_FILE = os.path.join('static', 'saved_tests.json')

# Ініціалізація файлу збережених тестів
if not os.path.exists(SAVED_TESTS_FILE):
    with open(SAVED_TESTS_FILE, "w") as f:
        json.dump([], f)

# Завантаження збережених тестів із файлу
def load_saved_tests():
    with open(SAVED_TESTS_FILE, "r") as f:
        return json.load(f)

# Збереження тестів до файлу
def save_tests_to_file(tests):
    with open(SAVED_TESTS_FILE, "w") as f:
        json.dump(tests, f)

# Збереження тесту
@app.route("/save-test", methods=["POST"])
def save_test():
    if 'user' not in session:
        return jsonify({"message": "Користувач не авторизований!"}), 404
    
    test = request.json  # Отримуємо дані тесту
    saved_tests = load_saved_tests()
    saved_tests.append(test)
    save_tests_to_file(saved_tests)
    return jsonify({"message": "Тест збережено!"})

# API: Завантаження збережених тестів
@app.route("/api/saved-tests", methods=["GET"])
def api_get_saved_tests():
    saved_tests = load_saved_tests()
    return jsonify(saved_tests)

# API: Видалення тесту за індексом
@app.route("/api/delete-test/<int:test_index>", methods=["DELETE"])
def api_delete_test(test_index):
    saved_tests = load_saved_tests()
    if 0 <= test_index < len(saved_tests):
        del saved_tests[test_index]
        save_tests_to_file(saved_tests)
        return jsonify({"message": "Тест видалено!"})
    return jsonify({"error": "Тест не знайдено!"}), 404

# Рендеринг сторінки saved_tests.html
@app.route("/saved-tests")
def saved_tests():
    return render_template("saved_tests.html")

if __name__ == '__main__':
    app.run(debug=True)
