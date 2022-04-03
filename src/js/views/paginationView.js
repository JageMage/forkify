import View from './View.js';
import icons from 'url:../../img/icons.svg';

class PaginationView extends View {
  _parentElement = document.querySelector('.pagination');

  addHandlerClick(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn--inline');
      if (!btn) return;

      const goToPage = Number(btn.dataset.goto);

      handler(goToPage);
    });
  }

  _generateButton(type) {
    const curPage = this._data.page;

    if (type === 'left') {
      return `
    <button data-goto="${
      curPage - 1
    }" class="btn--inline pagination__btn--prev">
        <svg class="search__icon">
            <use href="${icons}#icon-arrow-left"></use>
        </svg>
        <span>Page ${curPage - 1}</span>
    </button>
      `;
    }

    if (type === 'right') {
      return `
    <button data-goto="${
      curPage + 1
    }" class="btn--inline pagination__btn--next">
        <span>Page ${curPage + 1}</span>
        <svg class="search__icon">
            <use href="${icons}#icon-arrow-right"></use>
        </svg>
    </button> 
      `;
    }
  }

  _generateMarkup() {
    const numPages = Math.ceil(
      this._data.results.length / this._data.resultsPerPage
    );
    console.log(numPages);

    // Page 1 and other pages
    if (this._data.page === 1 && numPages > 1) {
      return this._generateButton('right');
    }

    // Last page
    if (this._data.page === numPages && numPages > 1) {
      return this._generateButton('left');
    }

    // Other page
    if (this._data.page < numPages) {
      return this._generateButton('left') + this._generateButton('right');
    }

    // page 1 and no other pages
    return '';
  }
}
export default new PaginationView();
