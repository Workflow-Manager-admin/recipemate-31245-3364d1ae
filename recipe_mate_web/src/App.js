import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * Color theme from requirements:
 *  primary: #fda5f1
 *  secondary: #FFFFFF
 *  accent: #121212
 */

// PUBLIC_INTERFACE
function App() {
  // State hooks
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientList, setIngredientList] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState([]);
  const [walmartResults, setWalmartResults] = useState([]);
  const [stepTimer, setStepTimer] = useState({}); // {stepIdx, secondsLeft}
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // API credentials (replace with your API keys)
  const SPOONACULAR_API_KEY = "YOUR_SPOONACULAR_API_KEY";
  const WALMART_API_KEY = "YOUR_WALMART_API_KEY";
  const isSpoonacularConfigured = SPOONACULAR_API_KEY && SPOONACULAR_API_KEY !== "YOUR_SPOONACULAR_API_KEY";

  // Helper for timer ref
  const timerRef = useRef(null);

  // Add an ingredient from input
  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredientList.includes(trimmed)) {
      setIngredientList([...ingredientList, trimmed]);
      setIngredientInput("");
    }
  };

  // Remove ingredient from the list
  const handleRemoveIngredient = (ingredient) => {
    setIngredientList(ingredientList.filter((ing) => ing !== ingredient));
  };

  // Search for recipes using Spoonacular API
  // PUBLIC_INTERFACE
  const handleSearchRecipes = async () => {
    if (!ingredientList.length) return;
    setLoading(true);
    setRecipes([]);
    setSelectedRecipe(null);

    // Example API: https://api.spoonacular.com/recipes/findByIngredients?ingredients=apple,flour,sugar&number=10&apiKey=API_KEY
    const searchUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientList
      .join(",")
      .toLowerCase()}&number=6&ranking=1&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`;

    try {
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error("Recipe API error");
      const recipesData = await searchRes.json();

      // Fetch full details for each recipe for instructions and nutrition
      const detailedRecipes = await Promise.all(
        recipesData.map((rec) =>
          fetch(
            `https://api.spoonacular.com/recipes/${rec.id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
          ).then((r) => r.json())
        )
      );
      setRecipes(detailedRecipes);
    } catch (error) {
      alert("Failed to fetch recipes.");
    }
    setLoading(false);
  };

  // Reset search
  const handleReset = () => {
    setIngredientInput("");
    setIngredientList([]);
    setRecipes([]);
    setSelectedRecipe(null);
    setShowInstructions(false);
    setShowOrderModal(false);
    setMissingIngredients([]);
    setWalmartResults([]);
    setActiveStepIdx(0);
    setStepTimer({});
    clearTimeout(timerRef.current);
  };

  // Step-by-step timer logic
  useEffect(() => {
    if (
      showInstructions &&
      selectedRecipe &&
      stepTimer.secondsLeft > 0 &&
      stepTimer.stepIdx === activeStepIdx
    ) {
      timerRef.current = setTimeout(() => {
        setStepTimer((s) => ({
          ...s,
          secondsLeft: s.secondsLeft - 1,
        }));
      }, 1000);
      return () => clearTimeout(timerRef.current);
    }
  }, [showInstructions, selectedRecipe, stepTimer, activeStepIdx]);

  // Open step-by-step modal
  const handleOpenInstructions = (recipe) => {
    setSelectedRecipe(recipe);
    setShowInstructions(true);
    setActiveStepIdx(0);

    clearTimeout(timerRef.current);
    setStepTimer({});
  };

  // Advance to next or previous step
  const handleStepChange = (delta) => {
    if (!selectedRecipe) return;
    let nextIdx = activeStepIdx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= selectedRecipe.analyzedInstructions?.[0]?.steps?.length)
      nextIdx = selectedRecipe.analyzedInstructions[0].steps.length - 1;
    setActiveStepIdx(nextIdx);
    clearTimeout(timerRef.current);
    setStepTimer({});
  };

  // Start step timer for the given step (in seconds)
  const handleStartStepTimer = (seconds) => {
    setStepTimer({ stepIdx: activeStepIdx, secondsLeft: seconds });
  };

  // Finish cooking close modal
  const handleCloseInstructions = () => {
    setShowInstructions(false);
    setActiveStepIdx(0);
    setStepTimer({});
    clearTimeout(timerRef.current);
  };

  // Compute missing ingredients for selected recipe
  const handleShowOrderModal = () => {
    if (!selectedRecipe) return;
    // Find missedIngredients as reported by Spoonacular for this recipe
    const missing = (selectedRecipe.extendedIngredients || []).filter(
      (ii) =>
        !ingredientList
          .map((ing) => ing.toLowerCase())
          .includes(ii.name?.toLowerCase())
    );
    setMissingIngredients(missing);
    setShowOrderModal(true);

    // Optionally, do search on Walmart API
    searchWalmartProducts(missing);
  };

  // Search missing ingredients in Walmart API
  const searchWalmartProducts = async (missingList) => {
    if (!missingList.length) {
      setWalmartResults([]);
      return;
    }
    // Example endpoint (you must replace with actual Walmart API integration and key)
    // For demo, this will just build a fake object
    setWalmartResults(
      missingList.map((ing) => ({
        name: ing.name,
        price: (Math.random() * 4 + 1).toFixed(2),
        available: true,
        url: "#",
      }))
    );
    // Uncomment for actual Walmart call
    /*
    const results = await Promise.all(missingList.map(async (item) => {
      const resp = await fetch(
        `https://api.walmart.com/v3/items?query=${item.name}&apiKey=${WALMART_API_KEY}`
      );
      // ...process Walmart response, setWalmartResults([...])
    }));
    */
  };

  // Order item handler (simulate)
  const handleOrderIngredient = (item) => {
    alert(`Ordering "${item.name}" at $${item.price} each from Walmart!`);
  };

  // Responsive color style
  const recipeAccent = "#fda5f1";
  const recipeLight = "#fff";
  const recipeDark = "#121212";

  // Renders
  return (
    <div className="app" style={{ background: "#fff", color: recipeDark }}>
      <nav
        className="navbar"
        style={{ backgroundColor: recipeAccent, color: recipeDark }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div className="logo" style={{ color: recipeDark }}>
              <span className="logo-symbol" style={{ color: recipeDark }}>
                🥕
              </span>
              <span style={{ fontWeight: 700, letterSpacing: 1 }}>
                RecipeMate
              </span>
            </div>
            <button
              className="btn"
              style={{
                background: "#fff",
                color: recipeAccent,
                fontWeight: 700,
                border: `2px solid ${recipeAccent}`,
              }}
              onClick={handleReset}
            >
              Reset All
            </button>
          </div>
        </div>
      </nav>

      <main>
        <div
          className="container"
          style={{
            paddingTop: 110,
            paddingBottom: 32,
            minHeight: "80vh",
            maxWidth: 1000,
          }}
        >
          {/* Ingredient Input Area */}
          <section
            style={{
              background: recipeLight,
              borderRadius: 14,
              boxShadow: "0 0 16px #eee",
              padding: 32,
              marginBottom: 32,
            }}
          >
            <div>
              <h1 style={{ color: recipeAccent, marginBottom: 8, fontSize: 36 }}>
                What ingredients do you have?
              </h1>
              <p style={{ color: recipeDark, marginBottom: 16 }}>
                Enter ingredients on hand and find delicious recipes
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: 12,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Add an ingredient"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddIngredient();
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    fontSize: 16,
                    border: `1.5px solid ${recipeAccent}`,
                    borderRadius: 5,
                    marginRight: 5,
                  }}
                  aria-label="Ingredient input"
                  data-testid="ingredient-input"
                />
                <button
                  className="btn"
                  style={{
                    background: recipeAccent,
                    color: "#fff",
                    minWidth: 100,
                  }}
                  onClick={handleAddIngredient}
                  data-testid="add-ingredient-btn"
                >
                  Add
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ingredientList.map((ing) => (
                  <span
                    key={ing}
                    style={{
                      background: recipeAccent,
                      color: "#fff",
                      borderRadius: 50,
                      padding: "5px 16px",
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      margin: "2px 0",
                    }}
                  >
                    {ing}
                    <button
                      aria-label={`Remove ${ing}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#fff",
                        fontWeight: "bold",
                        marginLeft: 7,
                        cursor: "pointer",
                        fontSize: 17,
                      }}
                      onClick={() => handleRemoveIngredient(ing)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div>
                <button
                  className="btn btn-large"
                  style={{
                    background: recipeAccent,
                    color: "#fff",
                    padding: "12px 30px",
                    fontWeight: 700,
                    marginTop: 18,
                    fontSize: 18,
                  }}
                  onClick={handleSearchRecipes}
                  disabled={!ingredientList.length || loading}
                  data-testid="search-btn"
                >
                  {loading ? "Searching..." : "Find Recipes"}
                </button>
              </div>
            </div>
          </section>

          {/* Recipe result section */}
          <section>
            {recipes.length > 0 && (
              <div>
                <h2
                  style={{
                    color: recipeAccent,
                    fontWeight: 500,
                    marginBottom: 14,
                  }}
                >
                  Recipes Found
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                    gap: 20,
                  }}
                >
                  {recipes.map((rec) => (
                    <RecipeCard
                      key={rec.id}
                      recipe={rec}
                      accent={recipeAccent}
                      onInstructions={() => handleOpenInstructions(rec)}
                    />
                  ))}
                </div>
              </div>
            )}
            {!recipes.length && !loading && ingredientList.length > 0 && (
              <div
                style={{
                  color: recipeDark,
                  marginTop: 32,
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                No recipes yet. Click "Find Recipes" to search!
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Step-by-Step Instructions Modal */}
      {showInstructions && selectedRecipe && (
        <InstructionModal
          recipe={selectedRecipe}
          accent={recipeAccent}
          stepIdx={activeStepIdx}
          onPrevStep={() => handleStepChange(-1)}
          onNextStep={() => handleStepChange(1)}
          onClose={handleCloseInstructions}
          stepTimer={stepTimer}
          setStepTimer={handleStartStepTimer}
          orderIngredients={handleShowOrderModal}
        />
      )}

      {/* Order Missing Ingredients Modal */}
      {showOrderModal && (
        <OrderModal
          missingIngredients={missingIngredients}
          products={walmartResults}
          accent={recipeAccent}
          onOrder={handleOrderIngredient}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Footer/brand */}
      <footer
        style={{
          textAlign: "center",
          background: "#f2f2f7",
          color: recipeDark,
          padding: 20,
          fontWeight: 500,
        }}
      >
        &copy; {new Date().getFullYear()} RecipeMate &mdash; AI Cooking Assistant
      </footer>
    </div>
  );
}

// --- Recipe Card Component ---
/**
 * RecipeCard displays a single recipe with preview, title, etc.
 * @param {*} { recipe, accent, onInstructions }
 */
const RecipeCard = ({ recipe, accent, onInstructions }) => {
  const missedCount = recipe.missedIngredientCount || 0;

  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 2px 18px #eee",
        padding: 16,
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <img
        src={recipe.image}
        alt={recipe.title}
        style={{
          width: "100%",
          height: 150,
          objectFit: "cover",
          borderRadius: 9,
          marginBottom: 10,
        }}
      />
      <h3 style={{ color: accent, marginBottom: 4, fontSize: 20 }}>
        {recipe.title}
      </h3>
      <div style={{ fontSize: 15, color: "#333", marginBottom: 5 }}>
        <strong>
          {recipe.readyInMinutes
            ? `Ready in ${recipe.readyInMinutes} min`
            : ""}
        </strong>
        {recipe.servings ? ` • Serves ${recipe.servings}` : ""}
      </div>
      <div style={{ fontSize: 14, color: "#888", marginBottom: 7 }}>
        {missedCount > 0 && (
          <>
            <span role="img" aria-label="alert" style={{ fontSize: 17 }}>
              ⚠️
            </span>{" "}
            {missedCount} ingredient{missedCount > 1 ? "s" : ""} missing
          </>
        )}
      </div>
      <div style={{ flex: 1 }}></div>
      <button
        className="btn"
        style={{
          background: accent,
          color: "#fff",
          marginTop: 12,
          fontWeight: 600,
          width: "100%",
          fontSize: 16,
        }}
        onClick={onInstructions}
      >
        View Instructions &amp; Nutrition
      </button>
    </div>
  );
};

// --- Instruction Modal Component ---
/**
 * Modal to step through the cooking process.
 */
const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 3001,
  background: "rgba(0,0,0,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dialogStyle = {
  width: "95%",
  maxWidth: 560,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 38px #d0d0d0",
  padding: 28,
  position: "relative",
  display: "flex",
  flexDirection: "column",
};

function InstructionModal({
  recipe,
  accent,
  stepIdx,
  onPrevStep,
  onNextStep,
  onClose,
  stepTimer,
  setStepTimer,
  orderIngredients,
}) {
  // Find instruction steps
  const steps = recipe.analyzedInstructions?.[0]?.steps || [];
  const step = steps[stepIdx] || {};
  const totalSteps = steps.length;

  // Nutrition info
  const nutrition = recipe.nutrition;
  const showTimer =
    Boolean(step.length) &&
    // Try to parse time from step string (look for "for 5 minutes" etc.)
    /(\d+)\s*(minute|min|second|sec)/i.test(step.step);

  // Extract time in seconds if possible
  let parseTime = null;
  if (showTimer) {
    const m = /(\d+)\s*(minute|min)/i.exec(step.step || "");
    if (m) parseTime = parseInt(m[1]) * 60;
    else {
      const s = /(\d+)\s*(second|sec)/i.exec(step.step || "");
      if (s) parseTime = parseInt(s[1]);
    }
  }

  function handleTimerClick() {
    if (parseTime && (!stepTimer.secondsLeft || stepTimer.stepIdx !== stepIdx))
      setStepTimer(parseTime);
  }

  return (
    <div style={modalStyle} role="dialog" aria-modal="true">
      <div style={dialogStyle}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 20,
            background: "transparent",
            border: "none",
            fontSize: 28,
            color: "#ccc",
            cursor: "pointer",
          }}
          aria-label="Close"
        >
          ×
        </button>
        <h2 style={{ color: accent, fontWeight: 600, marginBottom: 6 }}>
          {recipe.title}
        </h2>
        <div
          style={{
            fontSize: 15,
            color: "#777",
            marginBottom: 12,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {recipe.readyInMinutes && (
            <span>⏰ {recipe.readyInMinutes} min</span>
          )}
          {recipe.servings && <span>🍽️ {recipe.servings} servings</span>}
        </div>
        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <p style={{ color: "#111", fontWeight: 500, marginBottom: 6 }}>
              Step {stepIdx + 1} of {totalSteps}
            </p>
            <div
              style={{
                background: "#faf7fa",
                border: `1.5px solid ${accent}`,
                borderRadius: 8,
                padding: "15px 16px",
                minHeight: 62,
                fontSize: 18,
                color: "#222",
                marginBottom: 14,
              }}
            >
              {step.step}
            </div>
            {/* Step timer (if possible to extract time) */}
            {showTimer && (
              <div>
                {stepTimer.secondsLeft && stepTimer.stepIdx === stepIdx ? (
                  <div
                    style={{
                      color: accent,
                      fontSize: 19,
                      fontWeight: 600,
                      marginBottom: 7,
                    }}
                  >
                    Timer: {Math.floor(stepTimer.secondsLeft / 60)}:
                    {(stepTimer.secondsLeft % 60).toString().padStart(2, "0")}
                  </div>
                ) : (
                  <button
                    className="btn"
                    style={{
                      background: accent,
                      color: "#fff",
                      fontWeight: 600,
                      marginBottom: 7,
                    }}
                    onClick={handleTimerClick}
                  >
                    Start Timer for Step ({parseTime / 60 >= 1
                      ? `${parseTime / 60} min`
                      : `${parseTime} sec`}
                    )
                  </button>
                )}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 6,
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn"
                style={{ background: "#eee", color: "#444" }}
                disabled={stepIdx === 0}
                onClick={onPrevStep}
              >
                Previous
              </button>
              <button
                className="btn"
                style={{ background: accent, color: "#fff" }}
                disabled={stepIdx === totalSteps - 1}
                onClick={onNextStep}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Nutrition info */}
        {nutrition && nutrition.nutrients && (
          <div style={{ background: "#f2edf6", marginTop: 22, padding: 14, borderRadius: 8 }}>
            <p style={{ color: "#6d3282", fontWeight: 600, marginBottom: 7 }}>Nutrition (per serving):</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 13 }}>
              {nutrition.nutrients.slice(0, 5).map((n) => (
                <span key={n.name} style={{
                  background: "#fff", borderRadius: 7, border: `1px solid ${accent}`,
                  padding: "4px 9px", color: "#444", fontSize: 15,
                }}>{n.name}: {n.amount}{n.unit}</span>
              ))}
            </div>
          </div>
        )}

        {/* Order Missing Ingredients */}
        <button
          className="btn"
          onClick={orderIngredients}
          style={{
            background: accent,
            color: "#fff",
            fontWeight: 600,
            marginTop: 25,
            width: "100%",
            fontSize: 16,
          }}
        >
          Order Missing Ingredients
        </button>
      </div>
    </div>
  );
}

// --- Order Modal Component ---
/**
 * Modal to review and order the missing ingredients (integration with Walmart API).
 */
function OrderModal({
  missingIngredients,
  products,
  accent,
  onOrder,
  onClose,
}) {
  return (
    <div style={modalStyle} role="dialog" aria-modal="true">
      <div style={{ ...dialogStyle, maxWidth: 500 }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 20,
            background: "transparent",
            border: "none",
            fontSize: 28,
            color: "#ccc",
            cursor: "pointer",
          }}
          aria-label="Close"
        >
          ×
        </button>
        <h2 style={{ color: accent, fontWeight: 600 }}>
          Order Missing Ingredients
        </h2>
        <div>
          <p style={{ color: "#222" }}>
            {missingIngredients.length === 0
              ? "You have all ingredients!"
              : "The following ingredients are missing:"}
          </p>
          <ul style={{ marginLeft: 10, color: "#222" }}>
            {missingIngredients.length > 0 &&
              missingIngredients.map((ing) => (
                <li key={ing.name} style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{ing.name}</span>
                </li>
              ))}
          </ul>
        </div>
        {/* Product pricing/offers (simulate Walmart) */}
        {products?.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h4 style={{ color: accent, fontWeight: 700, marginBottom: 8 }}>
              Shop at Walmart:
            </h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {products.map((item) => (
                <li
                  key={item.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fdf9fd",
                    borderRadius: 6,
                    marginBottom: 7,
                    padding: "9px 11px",
                    border: `1px solid ${accent}22`,
                  }}
                >
                  <span>
                    {item.name}{" "}
                    {item.available ? (
                      <span style={{ color: "#00b700", fontWeight: 600 }}>
                        ${item.price}
                      </span>
                    ) : (
                      <span style={{ color: "#b70000" }}>Unavailable</span>
                    )}
                  </span>
                  <button
                    className="btn"
                    disabled={!item.available}
                    style={{
                      background: accent,
                      color: "#fff",
                      fontWeight: 600,
                      minWidth: 70,
                      padding: "4px 12px",
                    }}
                    onClick={() => onOrder(item)}
                  >
                    Order
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;