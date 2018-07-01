const GOODREADS_KEY = process.env.GOODREADS_KEY;
const cors = "https://cors-anywhere.herokuapp.com/";
const goodreads = "https://www.goodreads.com/";
const goodreadsURL = cors + goodreads + "search/index.xml?";
const bookURL = cors + goodreads + "book/show.xml?";

const fetch = require('isomorphic-fetch');
var fastXmlParser = require('fast-xml-parser');
const similarBooks = [];
const mainBook = {};

function init() {
    const node = document.querySelector(".searchInput");
    node.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            removePreviousResults();
            const progressBar = document.createElement('progress');
            progressBar.className = "progress";
            container.appendChild(progressBar);

            const query = {
                q: node.value,
                field: "title",
                key: GOODREADS_KEY
            }


            const path = goodreadsURL + stringifyQuery(query);
            fetch(path)
                .then(res => {
                    return res.text();
                })
                .then(xmlData => {
                    return fastXmlParser.parse(xmlData);
                })
                .then(jsonData => {
                    const id = jsonData.GoodreadsResponse.search.results.work[0].best_book.id;
                    const author = jsonData.GoodreadsResponse.search.results.work[0].best_book.author.name;
                    mainBook["id"] = id;
                    mainBook["author"] = author;
                    return id;
                })
                .then(id => {

                    const query = {
                        format: 'xml',
                        id: id,
                        key: GOODREADS_KEY,
                    }
                    const path = bookURL + stringifyQuery(query);
                    return fetch(path);
                })
                .then(res => {
                    return res.text();
                })
                .then(xmlData => {
                    return fastXmlParser.parse(xmlData);
                })
                .then(jsonData => {
                    const searchBook = jsonData.GoodreadsResponse.book;

                    mainBook["name"] = searchBook.title;
                    mainBook["image"] = searchBook["image_url"]
                    mainBook["rating"] = searchBook["average_rating"]
                    mainBook["pages"] = searchBook["num_pages"]

                    addBookToPage(mainBook);

                    const simBooks = jsonData.GoodreadsResponse.book.similar_books.book;

                    simBooks.forEach(book => {
                        const bookToBeAdded = {
                            name: book.title,
                            id: book.id,
                            link: book.link,
                            image: book["image_url"],
                            author: book.authors.author.name,
                            pages: book["num_pages"],
                            rating: book["average_rating"]
                        };

                        similarBooks.push(bookToBeAdded);
                    });

                    addSimilarBooks();
                })
                .catch(err => {
                    hideProgressBar();
                    showSnackbar("Couldn't find any books!");
                });
        }
    });
}

function showSnackbar(message) {
    const snackbar = document.createElement('div');
    snackbar.className = "snackbar";
    snackbar.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(snackbar);
    snackbar.style.bottom = "1vh";
    setTimeout(() => {
        snackbar.style.display = "none";
    }, 2000);
}

function hideProgressBar() {
    const element = document.querySelector('.progress');
    deleteElement(element);
}


function removePreviousResults() {
    const similarBooksSection = document.querySelector('.similarBooksSection');

    const singleBook = document.querySelector('.book');

    if(similarBooksSection){
        deleteElement(similarBooksSection);
    }

    if(singleBook){
        deleteElement(singleBook);
    }
}

function deleteElement(element){
    element.parentNode.removeChild(element);
}


function addBookToPage(book) {
    const bookElement = createBook(book);
    hideProgressBar();
    container.appendChild(bookElement);
    return;
}

function addSimilarBooks() {
    const similarBooksSection = document.createElement('div');
    similarBooksSection.className = "similarBooksSection";

    const h1 = document.createElement('h1');
    h1.innerHTML = "Similar Books";
    h1.style.textAlign = "center";
    similarBooksSection.appendChild(h1);

    similarBooks.forEach(book => {
        similarBooksSection.appendChild(createBook(book));
    });

    container.appendChild(similarBooksSection);
}

function createBook(book) {

    const bookElement = document.createElement('div');
    bookElement.className = "book";

    bookElement.innerHTML = `
    <img src=${book.image} alt="book_cover" widht="50" height="75" class="bookImage"/>
    <div class="bookInfo">
    <p class="title">
        <a href=${book.link === undefined ? "" : book.link}><b>${book.name}</b></a> &mdash;
        <span class="author">
            <em>${book.author}</em>
        </span>
    </p>
    <p class="pages">Pages:
        <span class="extraContent">${book.pages}</span>
    </p>
    <p class="rating">Rating:
        <span class="extraContent">${book.rating}</span>
    </p>
    </div>`;

    return bookElement;
}

/**
 * 
 * @param {string} query 
 */
function stringifyQuery(query) {
    let result = "";
    for (let key in query) {
        result += key + "=" + query[key] + "&";
    }
    return result.slice(0, -1);
}

window.onload = init;