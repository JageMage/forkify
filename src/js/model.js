import { async } from 'regenerator-runtime';
import { API_URL, RES_PER_PAGE, KEY, MODAL_CLOSE_SEC } from './config.js';
import { AJAX } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: RES_PER_PAGE,
    page: 1,
  },
  ingPlace: 2,
  bookmarks: [],
  calendar: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    if (state.calendar.some(day => day.id === id))
      state.recipe.calendered = true;
    else state.recipe.calendered = false;
  } catch (err) {
    throw err;
  }
};
export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        sourceUrl: rec.source_url,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
  } catch (err) {
    console.log(`${err} 👌`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = 1) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; // 0;
  const end = page * state.search.resultsPerPage; // 10;

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    // newQt = oldQt * newServings / oldServings //
  });

  state.recipe.servings = newServings;
};

const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  // Add bookmark
  state.bookmarks.push(recipe);

  // Mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBookmarks();
};

export const deleteBookmark = function (id) {
  // Delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  // Mark current recipe as NOT bookmarked
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  console.log(state.recipe.bookmarked);

  persistBookmarks();
};

const clearStorage = function () {
  localStorage.clear('bookmarks');
  localStorage.clear('calendar');
};
// clearStorage();

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format! Please use the correct format'
          );
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });
    const recipe = {
      title: newRecipe.title,
      publisher: newRecipe.publisher,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      servings: +newRecipe.servings,
      cooking_time: +newRecipe.cookingTime,
      ingredients,
    };

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};

export const updateIngplace = function () {
  state.ingPlace++;
};

const persistCalendar = function () {
  localStorage.setItem('calendered', JSON.stringify(state.calendar));
};

export const setDate = function () {
  let calendar = document.getElementById('calendar');

  const today = Date.now();
  const date = Date.parse(new Date(calendar.value));

  const timeToDate = Math.ceil((date - today) / 24 / 60 / 60 / 1000);

  if (timeToDate <= -1) throw new Error('Select correct date');

  if (date) state.recipe.date = date;
  calendar.value = '';
};

export const addCalendar = function (recipe) {
  // Add calendered item
  state.calendar.push(recipe);

  // Mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.calendered = true;

  setDate();

  if (state.recipe.date < -1 || state.recipe.date === undefined)
    throw new Error('Select correct date');

  persistCalendar();

  console.log(state.recipe.date);

  return;
};

export const deleteCalendar = function (id) {
  // Delete bookmark
  const index = state.calendar.findIndex(el => el.id === id);
  state.calendar.splice(index, 1);

  // Mark current recipe as NOT bookmarked
  if (id === state.recipe.id) state.recipe.calendered = false;

  persistCalendar();
};

export const sortCalendar = function (calendar) {
  state.bookmarks = calendar.sort((a, b) => {
    console.log(a.date);
    return a.date - b.date;
  });
  console.log(state.bookmarks);

  persistCalendar();
};

export const cleanCalendar = function (calendar) {
  const today = Date.now();

  calendar.forEach(day => {
    const timeToDate = Math.ceil((day.date - today) / 24 / 60 / 60 / 1000);

    if (timeToDate <= -1) deleteCalendar(day.id);
  });

  persistCalendar();
};

const getID = async function (food) {
  try {
    const idData = await fetch(
      `https://api.spoonacular.com/food/ingredients/search?apiKey=fc174ebfc63740a2a3cfc9bb6af66759&query=${food}&number=1`
    );

    // key=99801944b3eb4872a56e86637f24166c&
    // fc174ebfc63740a2a3cfc9bb6af66759

    const res = await idData.json();
    if (res.status === 'failure') return;

    const id = res.results[0].id;
    if (!id) return;

    return id;
  } catch (err) {
    throw err;
  }
};

const getCalJSON = async function (food, amount = 1) {
  try {
    const id = await getID(food);

    if (!id) return;

    const url = `https://api.spoonacular.com/food/ingredients/${id}/information?apiKey=fc174ebfc63740a2a3cfc9bb6af66759&amount=${amount}`;

    const fetchPro = await fetch(url);
    const res2 = await fetchPro.json();
    const calories = res2.nutrition.nutrients.find(
      el => el.name === 'Calories'
    );
    return calories;
  } catch (err) {
    console.log(err);
  }
};

export const getAllCal = async function (ingredients) {
  console.log(ingredients);
  const arr = [];

  for (el of ingredients) {
    let amount = el.quantity;
    if (amount === null) amount = 1;

    const food = el.description;
    const item = await getCalJSON(food, amount);
    arr.push(item);
  }

  const cleanArr = arr.filter(el => el !== undefined);

  const calArr = [];

  console.log(cleanArr);

  cleanArr.forEach((el, i) => {
    if (!el) return;
    if (el !== undefined) {
      console.log(Object.values(el)[1]);
      calArr.push(Object.values(el)[1]);
    }
  });

  console.log(calArr);
  if (!calArr) return;

  /////////////////
  ///////////////
  //////////////
  // return to not testing values
  /////////////////
  ////////////////

  const calories = calArr.reduce((partialSum, a) => partialSum + a, 0);

  state.recipe.calories = calories;
  console.log(calories);
};

const init = function () {
  const calendar = localStorage.getItem('calendered');
  if (calendar) state.calendar = JSON.parse(calendar);
  const bookmarks = localStorage.getItem('bookmarks');
  if (bookmarks) state.bookmarks = JSON.parse(bookmarks);
};
init();
