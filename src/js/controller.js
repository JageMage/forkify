import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';
import calendarView from './views/calendarView.js';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { async } from 'regenerator-runtime/runtime';

// if (module.hot) {
//   module.hot.accept();
// }

const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);

    if (!id) return;
    recipeView.renderSpinner();

    // 0) Update results view to mark selected search result
    resultsView.update(model.getSearchResultsPage());
    bookmarksView.update(model.state.bookmarks);

    // 1) Loading recipe
    await model.loadRecipe(id);
    // await model.getAllCal(model.state.recipe.ingredients);

    const getAllCal = async function (ingredients) {
      console.log(ingredients);
      const arr = [];

      for (el of ingredients) {
        console.log(el);
        let amount = el.quantity;
        if (amount === null) amount = 1;

        const food = el.description;
        const item = await model.getCalJSON(food, amount);
        arr.push(item);
      }

      console.log(arr);

      const cleanArr = arr.filter(el => el !== undefined);

      const calArr = [];

      console.log(cleanArr);

      for (el of cleanArr) {
        if (!el) return;
        if (el !== undefined) {
          console.log(Object.values(el)[1]);
          calArr.push(Object.values(el)[1]);
        }
      }

      console.log(calArr);
      if (!calArr) return;

      console.log(calories);

      const calories = calArr.reduce((partialSum, a) => partialSum + a, 0);

      if (!calories) return;

      // WTF IS WRONK!!!!!!!!

      state.recipe.calories = calories;
    };

    await getAllCal(model.state.recipe.ingredients);

    // 2) Rendering recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    console.log(err);
    recipeView.renderError();
  }
};

const controlSearchResults = async function () {
  try {
    resultsView.renderSpinner();

    // Get search query
    const query = searchView.getQuery();
    if (!query) return;

    // Load search
    await model.loadSearchResults(query);

    // Render results
    resultsView.render(model.getSearchResultsPage());

    // Render initial pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlPagination = function (goToPage) {
  // Render new results
  resultsView.render(model.getSearchResultsPage(goToPage));

  // Render new pagination buttons
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // Update recipe servings (in state)
  model.updateServings(newServings);
  // Update the recipe view
  // recipeView.render(model.state.recipe);
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  // 1) Add/remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  // Update recipe view
  recipeView.update(model.state.recipe);

  // 3) Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // Upload recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // Render spinner
    addRecipeView.renderSpinner();

    // Render recipe
    recipeView.render(model.state.recipe);

    // Success message
    addRecipeView.renderMessage();

    // Render bookmark view
    bookmarksView.render(model.state.bookmarks);

    // Change ID in URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close form window
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    console.log('🔥', err);
    addRecipeView.renderError(err.message);
  }
};

const controlAddIngredient = function () {
  addRecipeView.addIngredient(model.state.ingPlace);
  model.updateIngplace();
};

const controlCalendar = function () {
  // Clean of outdated days
  model.cleanCalendar(model.state.calendar);

  calendarView.render(model.state.calendar);
};

const controlAddCalendar = function () {
  try {
    // 1) Add/remove calendered item
    if (!model.state.recipe.calendered) model.addCalendar(model.state.recipe);
    else model.deleteCalendar(model.state.recipe.id);

    // sort
    model.sortCalendar(model.state.calendar);

    // Update recipe view
    recipeView.update(model.state.recipe);

    // 2) Render calendered items
    calendarView.render(model.state.calendar);
  } catch (err) {
    recipeView.renderError(err);
    setTimeout(function () {
      model.deleteCalendar(model.state.recipe.id);
      recipeView.render(model.state.recipe);
    }, 2 * 1000);
  }
};

const newFeature = function () {
  console.log('Welcome to the application');
};

const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  calendarView.addHandlerRender(controlCalendar);

  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  recipeView.addHandlerAddCalendar(controlAddCalendar);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
  addRecipeView.addHandlerAddIngredient(controlAddIngredient);
  newFeature();
};
init();
