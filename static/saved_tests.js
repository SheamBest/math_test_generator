// Масив для збережених тестів
let savedTests = [];

// Завантаження тестів із сервера
function loadSavedTests() {
    fetch('/api/saved-tests')
        .then(response => response.json())
        .then(data => {
            savedTests = data;
            renderSavedTests();
        })
        .catch(error => console.error("Помилка завантаження тестів:", error));
}

// Рендеринг тестів
function renderSavedTests() {
    const testContainer = document.getElementById('tests');
    testContainer.innerHTML = ''; // Очищуємо контейнер

    if (savedTests.length === 0) {
        testContainer.innerHTML = '<p>Збережених тестів немає.</p>';
        return;
    }

    savedTests.forEach((test, index) => {
        const testDiv = document.createElement('div');
        testDiv.classList.add('test');
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
            <button onclick="checkTestAnswer(${index})">Перевірити відповідь</button>
            <button onclick="deleteTest(${index})">Видалити</button>
            <p id="result-${index}" class="result"></p>
        `;
        testContainer.appendChild(testDiv);
    });
}

// Перевірка відповіді
function checkTestAnswer(testIndex) {
    const selectedOption = document.querySelector(`input[name="test-${testIndex}"]:checked`);
    const resultElement = document.getElementById(`result-${testIndex}`);

    if (!selectedOption) {
        resultElement.textContent = "Оберіть варіант відповіді!";
        resultElement.style.color = "orange";
        return;
    }

    const selectedAnswer = parseFloat(selectedOption.value);
    const correctAnswer = savedTests[testIndex].answer;

    if (selectedAnswer === correctAnswer) {
        resultElement.textContent = "Правильно!";
        resultElement.style.color = "green";
    } else {
        resultElement.textContent = `Неправильно. Правильна відповідь: ${correctAnswer}`;
        resultElement.style.color = "red";
    }
}

// Видалення тесту
function deleteTest(testIndex) {
    fetch(`/api/delete-test/${testIndex}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            savedTests.splice(testIndex, 1); // Видаляємо тест із масиву
            renderSavedTests(); // Оновлюємо список
        })
        .catch(error => console.error("Помилка видалення тесту:", error));
}

// Завантаження тестів після завантаження сторінки
document.addEventListener('DOMContentLoaded', loadSavedTests);
