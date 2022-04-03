import View from './View.js';
import icons from 'url:../../img/icons.svg'; // Parcel 2

class CalendarView extends View {
  _parentElement = document.querySelector('.days__list');
  test = document.querySelector('.recipe__details');
  _errorMessage = 'Nothing in calendar';
  _message = '';

  addHandlerRender(handler) {
    window.addEventListener('load', handler);
  }

  _generateMarkup() {
    return this._data
      .map(day => {
        const id = window.location.hash.slice(1);

        const date = this._generateDate(day.date);

        return `
        <li class="preview">
            <a class="preview__link preview__link ${
              day.id === id ? 'preview__link--active' : ''
            }" href="#${day.id}">
                <figure class="preview__fig">
                    <img src="${day.image}" alt="Result image" />     
                </figure>
              <div class="preview__data">
                <h4 class="preview__title">${day.title}</h4>
                <p class="preview__publisher">${day.publisher}</p>
                <p class="preview__date">${date}</p>
                <div class="preview__user-generated ${day.key ? '' : 'hidden'}">
                  <svg>
                    <use href="${icons}#icon-user"></use>
                  </svg>
                </div>    
              </div>
            </a>
        </li>
          `;
      })
      .join('');
  }

  _generateDate(date) {
    const today = Date.now();

    const timeToDate = Math.ceil((date - today) / 24 / 60 / 60 / 1000);

    if (timeToDate <= -1) return 'Outdated';

    if (timeToDate > -1 && timeToDate < 1) return 'Today';
    if (timeToDate >= 1 && timeToDate < 2) return 'Tomorrow';
    if (timeToDate >= 2) return `in ${timeToDate} days`;
  }
}

export default new CalendarView();
