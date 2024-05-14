const fs = require("fs");
const http = require("http");
const url = require("url");

const filePath = "./books.json";

function readBooks() {
    try {
        const booksData = fs.readFileSync(filePath, "utf8");
        return JSON.parse(booksData);
    } catch (err) {
        console.error("Kitoblar ro'yxatini o'qishda xatolik yuz berdi: ", err);
    }
}

function saveBooks(books) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(books, null, 2), "utf8");
    } catch (err) {
        console.error("Kitoblar ro'yxatini saqlashda xatolik yuz berdi: ", err);
    }
}

const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);

    // GET - /books
    if (req.method === "GET" && reqUrl.pathname === "/books") {
        const books = readBooks();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(books));
    }

    // GET - /books/:id
    else if (req.method === "GET" && reqUrl.pathname.startsWith("/books/")) {
        const id = parseInt(reqUrl.pathname.substring(7));
        const books = readBooks();
        const book = books.find((book) => book.id === id);
        if (book) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(book));
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end("Kitob topilmadi");
        }
    }

    // POST - /books
    else if (req.method === "POST" && reqUrl.pathname === "/books") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const newBook = JSON.parse(body);
            const books = readBooks();
            const existingBook = books.find((book) => book.title === newBook.title);
            if (existingBook) {
                res.writeHead(409, { "Content-Type": "application/json" });
                res.end("Bu kitob bazada mavjud");
            } else {
                const maxId = Math.max(...books.map((book) => book.id), 0);
                newBook.id = maxId + 1;
                books.push(newBook);
                saveBooks(books);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(newBook));
            }
        });
    }

    // PUT - /books/:id
    else if (req.method === "PUT" && reqUrl.pathname.startsWith("/books/")) {
        const id = parseInt(reqUrl.pathname.substring(7));
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const updatedBook = JSON.parse(body);
            const books = readBooks();
            const index = books.findIndex((book) => book.id === id);
            if (index !== -1) {
                books[index] = { id, ...updatedBook };
                saveBooks(books);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(books[index]));
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end("Kitob topilmadi");
            }
        });
    }

    // DELETE - /books/:id
    else if (req.method === "DELETE" && reqUrl.pathname.startsWith("/books/")) {
        const id = parseInt(reqUrl.pathname.substring(7));
        const books = readBooks();
        const index = books.findIndex((book) => book.id === id);
        if (index !== -1) {
            books.splice(index, 1);
            saveBooks(books);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("Kitob o'chirildi");
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end("Kitob topilmadi");
        }
    } else {
        res.writeHead(404, { "Content-type": "application/json" });
        res.end("Notog'ri URL");
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
