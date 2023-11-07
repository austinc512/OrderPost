const axios = require("axios");
require("dotenv").config();

const shipEngineKey = process.env.shipengine_api_key;

const stamps_carrier_id = process.env.stamps_carrier_id;
const ups_carrier_id = process.env.ups_carrier_id;
const fedex_carrier_id = process.env.fedex_carrier_id;

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
    console.log(error.response.data);
    return error.response;
  }
};

const createLabel = async (shipment) => {
  try {
    const response = await instance.post("/v1/labels", shipment);
    // console.log(response);
    return response;
  } catch (error) {
    console.log(`error in createLabel:`);
    console.log(error.response);
    console.log(`Isolating ShipEngine errors:`);
    console.log(error.response.data);
    // throw new Error(error.response.data);
    return {
      errors: [error.response.data],
    };
  }
};

const rates = async (shipment) => {
  // testing errors
  // shipment = {};

  // need to add carrier_code to this
  // shipment.rate_options.service_codes.includes

  // note this logic is supposed to ONLY return 1 rate option
  // this logic is only going to target 1 carrier code.
  if (shipment.rate_options?.service_codes.includes("usps_priority_mail")) {
    shipment.rate_options?.carrier_ids.push(stamps_carrier_id);
  } else if (shipment.rate_options?.service_codes.includes("ups_ground")) {
    shipment.rate_options?.carrier_ids.push(ups_carrier_id);
  } else if (shipment.rate_options?.service_codes.includes("fedex_ground")) {
    shipment.rate_options?.carrier_ids.push(fedex_carrier_id);
  }
  try {
    const response = await instance.post("/v1/rates", shipment);
    console.log(`LOGGING RESPONSE`);
    console.log(response);
    return response;
  } catch (error) {
    console.log(`error in getRate:`);
    console.log(error);
    console.log(`Isolating ShipEngine errors:`);
    console.log(error.response.data);
    // throw new Error(error.response.data);
    return error.response.data;
  }
};

module.exports = {
  validateAddress,
  createLabel,
  rates,
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
