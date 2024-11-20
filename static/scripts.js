// Глобальний масив для зберігання тестів
const tests = [];

// Завантаження тестів із сервера
function loadTests() {
    fetch('/api/load_tests')
        .then(response => response.json())
        .then(data => {
            if (data.tests) {
                tests.push(...data.tests);
                console.log("Тести завантажені з сервера:", tests);
                renderTests();
            } else {
                alert("Помилка завантаження тестів: " + data.error);
            }
        })
        .catch(error => console.error("Помилка завантаження тестів:", error));
}

// Генерація нового тесту
function generateTest() {
    fetch('/api/generate_test', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(newTest => {
        tests.push(newTest);
        console.log("Новий тест згенеровано:", newTest);
        renderTests();
    })
    .catch(error => console.error("Помилка генерації тесту:", error));
}

function addTest() {
    const question = prompt('Введіть питання:');
    const options = prompt('Введіть варіанти відповідей через кому:').split(',');
    const answer = prompt('Введіть правильну відповідь:');

    fetch('/api/add_test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options, answer }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);

        // Додаємо новий тест у локальний масив
        tests.push({ question, options, answer });

        // Рендеримо оновлений список тестів
        renderTests();
    })
    .catch(error => console.error("Помилка додавання тесту:", error));
}


// Рендеринг тестів на сторінку
function renderTests() {
    const testContainer = document.getElementById('tests');
    testContainer.innerHTML = '';

    tests.forEach((test, index) => {
        const testDiv = document.createElement('div');
        testDiv.innerHTML = `
            <h3>Тест ${index + 1}: ${test.question}</h3>
            <ul>
                ${test.options.map((option, optIndex) => `
                    <li>
                        <input type="radio" name="test-${index}" id="test-${index}-${optIndex}" value="${option}">
                        <label for="test-${index}-${optIndex}">${option}</label>
                    </li>
                `).join('')}
            </ul>
            <button onclick="checkAnswer(${index})">Перевірити відповідь</button>
            <button onclick="saveTest(${index})">Зберегти</button>
            <p id="result-${index}" class="result"></p>
        `;
        testContainer.appendChild(testDiv);
    });
}

// Перевірка відповіді
function checkAnswer(testIndex) {
    const selectedOption = document.querySelector(`input[name="test-${testIndex}"]:checked`);
    const resultElement = document.getElementById(`result-${testIndex}`);

    if (!selectedOption) {
        resultElement.textContent = "Оберіть варіант відповіді!";
        resultElement.style.color = "orange";
        return;
    }

    const selectedAnswer = parseFloat(selectedOption.value);
    const correctAnswer = tests[testIndex].answer;

    if (selectedAnswer == correctAnswer) {
        resultElement.textContent = "Правильно!";
        resultElement.style.color = "green";
    } else {
        resultElement.textContent = `Неправильно. Правильна відповідь: ${correctAnswer}`;
        resultElement.style.color = "red";
    }
}

function showRegisterForm() {
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function register() {
    const nickname = document.getElementById('reg-nickname').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password, confirm_password: confirmPassword }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Реєстрація успішна!');
            window.location.href = '/';
        }
    });
}

function login() {
    const nickname = document.getElementById('login-nickname').value;
    const password = document.getElementById('login-password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Авторизація успішна!');
            window.location.href = '/';
        }
    });
}

function saveTest(index) {
    const test = tests[index];
    fetch("/save-test", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(test)
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        });
}

// Функція для видалення тесту
function deleteTest(index) {
    fetch(`/delete-test/${index}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка видалення');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            location.reload(); // Оновлення сторінки після успішного видалення
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при видаленні тесту.');
        });
}

// Ініціалізація подій для кнопок видалення
document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-test-btn');

    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index'); // Отримання індексу з data-атрибуту
            deleteTest(index);
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const checkButtons = document.querySelectorAll('.check-test-answer-btn');
    checkButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index'); // Отримання індексу з data-атрибуту
            checkAnswer(index);
        });
    });
});