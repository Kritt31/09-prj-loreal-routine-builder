/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Get reference to the selected products list */
const selectedProductsList = document.getElementById("selectedProductsList");

/* Get reference to the "Generate Routine" button */
const generateRoutineButton = document.getElementById("generateRoutine");

/* Array to store selected products */
let selectedProducts = [];

/* Array to store the conversation history */
let conversationHistory = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Load selected products from localStorage */
function loadSelectedProducts() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    selectedProducts = JSON.parse(savedProducts);
    updateSelectedProducts();
  }
}

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Create HTML for displaying selected products */
function updateSelectedProducts() {
  if (selectedProducts.length === 0) {
    // Show a message when no products are selected
    selectedProductsList.innerHTML = `
      <div class="placeholder-message">
        No products selected. Click on a product to add it here.
      </div>
    `;
  } else {
    // Display the selected products with a click-to-remove feature
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product) => `
      <div class="selected-product" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-btn" data-id="${product.id}">Remove</button>
      </div>
    `
      )
      .join("");

    // Add click event listeners to remove products from the list
    const removeButtons = document.querySelectorAll(".remove-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = parseInt(button.getAttribute("data-id"));
        const product = selectedProducts.find((p) => p.id === productId);
        toggleProductSelection(product);
      });
    });
  }

  // Save the updated list to localStorage
  saveSelectedProducts();
}

/* Clear all selected products */
function clearSelectedProducts() {
  selectedProducts = [];
  updateSelectedProducts();
}

/* Toggle product selection */
function toggleProductSelection(product) {
  const isSelected = selectedProducts.some((p) => p.id === product.id);

  if (isSelected) {
    // Remove product if already selected
    selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
  } else {
    // Add product if not selected
    selectedProducts.push(product);
  }

  updateSelectedProducts();

  // Update visual highlight for the product card
  const productCard = document.querySelector(
    `.product-card[data-id="${product.id}"]`
  );
  if (productCard) {
    productCard.classList.toggle("selected", !isSelected);
  }
}

/* Create HTML for displaying product cards with hover overlay */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-overlay">
        <p>${product.description}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = parseInt(card.getAttribute("data-id"));
      const product = products.find((p) => p.id === productId);
      toggleProductSelection(product);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

/* Replace the OpenAI API URL with the Cloudflare Worker endpoint */
const WORKER_ENDPOINT = "https://loreal-chatbot.kdeppenschmidt.workers.dev/"; // Replace with your Cloudflare Worker URL

/* Chat form submission handler for follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's input
  const userInput = document.getElementById("userInput").value.trim();

  if (!userInput) return;

  // Display the user's message in the chat window
  chatWindow.innerHTML += `
    <div class="chat-message user-message">
      ${userInput}
    </div>
  `;

  // Add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: userInput });

  // Clear the input field
  document.getElementById("userInput").value = "";

  // Display a loading message while waiting for the AI response
  chatWindow.innerHTML += `
    <div class="chat-message">
      Thinking...
    </div>
  `;

  try {
    // Send the conversation history to the Cloudflare Worker with web search enabled
    const response = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        enable_web_search: true, // Enable web search for real-time information
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides advice on skincare, haircare, makeup, fragrance, and related topics. Use real-time web search to include current information and provide links or citations when relevant.",
          },
          ...conversationHistory,
        ],
      }),
    });

    const data = await response.json();

    // Display the AI's response in the chat window, including any links or citations
    const aiResponse = data.choices[0].message.content;
    chatWindow.innerHTML += `
      <div class="chat-message">
        ${aiResponse}
      </div>
    `;

    // Add the AI's response to the conversation history
    conversationHistory.push({ role: "assistant", content: aiResponse });
  } catch (error) {
    // Handle errors and display an error message
    chatWindow.innerHTML += `
      <div class="chat-message">
        Sorry, there was an error processing your question. Please try again later.
      </div>
    `;
    console.error("Error processing follow-up question:", error);
  }

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* Function to generate a routine using the Cloudflare Worker */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    // Show a message if no products are selected
    chatWindow.innerHTML = `
      <div class="chat-message">
        Please select some products to generate a routine.
      </div>
    `;
    return;
  }

  // Prepare the data to send to the Cloudflare Worker
  const productData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // Display a loading message in the chat window
  chatWindow.innerHTML = `
    <div class="chat-message">
      Generating your routine... Please wait.
    </div>
  `;

  try {
    // Send the data to the Cloudflare Worker
    const response = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that creates skincare and beauty routines.",
          },
          {
            role: "user",
            content: `Here are the selected products: ${JSON.stringify(
              productData
            )}. Please create a detailed routine using these products.`,
          },
        ],
      }),
    });

    const data = await response.json();

    // Display the AI-generated routine in the chat window
    chatWindow.innerHTML = `
      <div class="chat-message">
        ${data.choices[0].message.content}
      </div>
    `;
  } catch (error) {
    // Handle errors and display an error message
    chatWindow.innerHTML = `
      <div class="chat-message">
        Sorry, there was an error generating your routine. Please try again later.
      </div>
    `;
    console.error("Error generating routine:", error);
  }
}

/* Add event listener to the "Generate Routine" button */
generateRoutineButton.addEventListener("click", generateRoutine);

/* Add event listener to the "Clear All" button */
const clearAllButton = document.getElementById("clearAll");
clearAllButton.addEventListener("click", clearSelectedProducts);

/* Load selected products on page load */
loadSelectedProducts();

/* Function to toggle between LTR and RTL modes */
function toggleDirection(isRTL) {
  const htmlElement = document.documentElement;
  htmlElement.dir = isRTL ? "rtl" : "ltr";
}

/* Example: Toggle to RTL mode (you can replace this with a user setting or button) */
toggleDirection(true); // Set to true for RTL, false for LTR
