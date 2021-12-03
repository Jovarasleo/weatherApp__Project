const app = document.querySelector("#app");
const currentBtn = document.querySelector(".current__btn");
const forecastBtn = document.querySelector(".forecast__btn");

function createEl(tagName, attributes) {
  const el = document.createElement(tagName);

  if (attributes) {
    Object.entries(attributes).forEach((keyValuePair) => {
      el[keyValuePair[0]] = keyValuePair[1];
    });
  }
  return el;
}

let place = "";

async function getData() {
  let fetchResponse = await fetch(`http://localhost:3000/forcast/${place}`);
  let responseJSON = await fetchResponse.json();
  console.log(responseJSON);
  return responseJSON;
}
async function render(object) {
  let objDiv = document.createElement("div");
  let objP = document.createElement("p");
  objP.textContent = `${object.city} temperature: ${object.temperature}C, time:${object.userTime}`;
  objDiv.append(objP);
  objDiv.classList = "outPut";
  app.append(objDiv);
}
async function fetchAndRender() {
  const data = await getData();
  await render(data);
}
currentBtn.addEventListener("click", () => {
  forecastBtn.classList.remove("selected");
  currentBtn.classList.remove("selectedEffects");
  forecastBtn.classList.add("selectedEffects");
  currentBtn.classList.add("selected");
  app.innerHTML = null;
  current();
});
forecastBtn.addEventListener("click", () => {
  currentBtn.classList.remove("selected");
  forecastBtn.classList.remove("selectedEffects");
  currentBtn.classList.add("selectedEffects");
  forecastBtn.classList.add("selected");
  app.innerHTML = null;
});
function current() {
  const input = createEl("input", {
    name: "city",
    type: "text",
    class: "inputCity",
  });
  const inputWrapper = document.createElement("div");
  const searchBtn = createEl("button", {
    class: "searchBtn",
    textContent: "search",
  });
  const inputLabel = createEl("label", {
    textContent: "Enter city:",
  });
  input.classList = "inputCity";
  searchBtn.classList = "searchBtn";
  inputWrapper.classList = "inputWrapper";
  inputLabel.setAttribute("for", "city");
  inputWrapper.append(input, searchBtn);
  app.append(inputLabel, inputWrapper);
  searchBtn.addEventListener("click", () => {
    console.log(input.value);
    place = input.value.toLowerCase();
    fetchAndRender();
  });
}
