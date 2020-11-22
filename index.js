require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");
const axios = require("axios");
const md5 = require("md5");

// ADD MONGOOSE IF WE WANT TO SAVE USER INFO IN DB

const app = express();
app.use(formidable());
app.use(cors());

// MARVEL API KEY
const privateKey = process.env.PRIVATE_KEY;

app.post("/", async (req, res) => {
  const { publicKey, page, search } = req.fields;
  let date = new Date();
  let ts = Date.parse(date).toString();
  let hash = md5(ts + privateKey + publicKey);
  let offset = (page - 1) * 100;
  let filter = "";
  search === "" ? (filter = "") : (filter = `&nameStartsWith=${search}`);
  try {
    const response = await axios.get(
      `http://gateway.marvel.com/v1/public/characters?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=100&offset=${offset}${filter}`
    );
    res.json(response.data);
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/comics", async (req, res) => {
  const { publicKey, page, search, period } = req.fields;
  let date = new Date();
  let ts = Date.parse(date).toString();
  let hash = md5(ts + privateKey + publicKey);
  let offset = (page - 1) * 100;
  let filter = "";
  let range = "";
  search === "" ? (filter = "") : (filter = `&titleStartsWith=${search}`);
  period === ""
    ? (range = "")
    : (range = `&dateRange=${period}-01-01,${parseInt(period) + 9}-12-31`);

  try {
    const response = await axios.get(
      `http://gateway.marvel.com/v1/public/comics?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=100&offset=${offset}${filter}${range}`
    );
    res.json(response.data);
  } catch (error) {
    console.log(error.message);
    res.json(error.message);
  }
});

app.post("/character/comics", async (req, res) => {
  const { publicKey, characterId, page } = req.fields;

  let date = new Date();
  let ts = Date.parse(date).toString();
  let hash = md5(ts + privateKey + publicKey);
  let offset = (page - 1) * 100;

  try {
    // THE DATA TO TRANSFER ARE IN THE API, WE NEED TO DO THE REQ HERE:
    const response = await axios.get(
      `http://gateway.marvel.com/v1/public/characters/${characterId}/comics?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=100&offset=${offset}`
    );

    res.json(response.data);
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/favorits", async (req, res) => {
  let { publicKey, page, searchCharacters, searchComics } = req.fields;

  // CONVERT INTO ARRAY OF NUMBER
  console.log(searchComics);

  searchCharacters !== 0 &&
    (searchCharacters = searchCharacters.slice(1, -1).split(",").map(Number));
  searchComics !== 0 &&
    (searchComics = searchComics.slice(1, -1).split(",").map(Number));

  console.log("first char ID to look for" + searchCharacters[0]);
  console.log("first comic ID to look for" + searchComics[0]);

  let date = new Date();
  let ts = Date.parse(date).toString();
  let hash = md5(ts + privateKey + publicKey);
  let offset = (page - 1) * 100;

  let tableForCharacters = [];
  let tableForComics = [];
  try {
    // MAP OVER THE 2 ARRAYS, RETURN DATA IN THE RESPONSE
    for (let i = 0; i < searchCharacters.length; i++) {
      if (searchCharacters[i] !== 0) {
        const response = await axios.get(
          `http://gateway.marvel.com/v1/public/characters/${searchCharacters[i]}?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=100&offset=${offset}`
        );
        tableForCharacters.push(response.data.data.results);
      }
    }
    for (let i = 0; i < searchComics.length; i++) {
      if (searchComics[i] !== 0) {
        const response = await axios.get(
          `http://gateway.marvel.com/v1/public/comics/${searchComics[i]}?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=100&offset=${offset}`
        );
        tableForComics.push(response.data.data.results);
      }
    }
    res.json({ tableForCharacters, tableForComics });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server Started on port : " + process.env.PORT);
});
