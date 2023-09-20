const axios = require("axios");
require("dotenv").config();

const shipEngineKey = process.env.shipengine_api_key;

const instance = axios.create({
  baseURL: "https://api.shipengine.com",
  headers: { "API-Key": shipEngineKey },
  timeout: 50000,
  ContentType: "application/json",
});

const validateAddress = async (address) => {
  try {
    const response = await instance.post("/v1/addresses/validate", [
      address.body,
    ]);
    // ** Note 1
    console.log(response);
    return response;
  } catch (error) {
    console.log("error in address validation:", error.response);
    return error.response;
  }
};

module.exports = {
  validateAddress,
};

/*
Note 1:
the request to ShipEngine needs to be an array
my warehouses/verify endpoint only accepts 1 address object
if multiple, can use:
    const response = await instance.post("/v1/addresses/validate", [
      ... address.body,
    ]);
      ^^ looks gross, but works.

Inside warehouseControllers.js
    res.json(response.data[0]);
    should be changed to
    res.json(response.data);

then my /warehouses/verify endpoint can support an array of address objects
(like how the request would be formatted to ShipEngine)
*/
