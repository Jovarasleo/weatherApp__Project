import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";
dotenv.config();

const connect = process.env.MONGO_CONNECTION_STRING;
const mongoClient = new MongoClient(connect);
const port = process.env.port;

const app = express();
app.use(express.json());
app.use(cors());
app.listen(port, () => {
  console.log(`works ${port}`);
});
function convertTime(time) {
  let getDate = new Date(time);
  getDate.setMinutes(getDate.getMinutes() - getDate.getTimezoneOffset());
  return getDate.toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });
}
const d = new Date();
let diff = d.getTimezoneOffset() / 60;

let addOffset = d.getTimezoneOffset() * 60 * 1000;
function toTimestamp(strDate) {
  let datum = Date.parse(strDate);
  return datum / (1000 * 60 * 60) - diff;
}
app.get("/forcast/:place", async (req, res) => {
  const connection = await mongoClient.connect();
  const place = req.params.place;
  const currentTime = Math.floor(Date.now() / (1000 * 60 * 60));
  const doesItExist = await connection
    .db("forcasts")
    .collection("searched")
    .find({ city: place })
    .toArray();

  if (doesItExist.length === 0) {
    let fetchResponse = await fetch(
      `https://api.meteo.lt/v1/places/${place}/forecasts/long-term`
    );
    let responseJSON = await fetchResponse.json();
    let forcast = responseJSON.forecastTimestamps;

    console.log(
      "time:",
      currentTime,
      "||",
      place,
      "resource was fetched first time"
    );
    if (forcast) {
      forcast.forEach((obj) => {
        let objTime = toTimestamp(obj.forecastTimeUtc);
        let timeForUser = convertTime(obj.forecastTimeUtc);
        if (objTime == currentTime) {
          connection.db("forcasts").collection("searched").insertOne({
            city: place.toLocaleLowerCase(),
            temperature: obj.airTemperature,
            time: obj.forecastTimeUtc,
            userTime: timeForUser,
            updateTime: currentTime,
          });
        }
      });
      const getTemp = await connection
        .db("forcasts")
        .collection("searched")
        .find({ city: place })
        .toArray();
      res.send(getTemp[0]);
    }
    if (!forcast) {
      res.send({ error: "city doesn't exist or has no available data" });
    }
  } else if (
    doesItExist.length != 0 &&
    doesItExist[0].updateTime === currentTime
  ) {
    const getTemp = await connection
      .db("forcasts")
      .collection("searched")
      .find({ city: place.toLocaleLowerCase() })
      .toArray();
    console.log(
      "timeStamp:",
      currentTime,
      "||",
      place,
      "data from dataBase, no API requests"
    );
    res.send(getTemp[0]);
  } else {
    let fetchResponse = await fetch(
      `https://api.meteo.lt/v1/places/${place}/forecasts/long-term`
    );
    let responseJSON = await fetchResponse.json();
    let forcast = responseJSON.forecastTimestamps;

    console.log(
      "time:",
      currentTime,
      "||",
      place,
      "resource was fetched and updates existing object in DB"
    );

    forcast.forEach((obj) => {
      let objTime = toTimestamp(obj.forecastTimeUtc);
      let timeForUser = convertTime(obj.forecastTimeUtc);
      if (objTime == currentTime && forcast.length) {
        connection
          .db("forcasts")
          .collection("searched")
          .updateOne(
            { city: place.toLocaleLowerCase() },
            {
              $set: {
                city: place.toLocaleLowerCase(),
                temperature: obj.airTemperature,
                time: obj.forecastTimeUtc,
                userTime: timeForUser,
                updateTime: currentTime,
              },
            }
        );
      }
    });
    const getTemp = await connection
      .db("forcasts")
      .collection("searched")
      .find({ city: place })
      .toArray();
    res.send(getTemp[0]);
  }
});
