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
  //   console.log("logging address object");
  //   console.log(address.body);
  //   const objectTest = new Object(address.body[0]);
  try {
    const response = await instance
      .post("/v1/addresses/validate", [...address.body])
      // ^^ this looks gross, but this is how I generate an array of address objects.
      // the request body itself IS an array, but it seems like axios needs some massaging to work
      .then((response) => {
        console.log(`ShipEngine address validation response:`);
        console.log(response);
        return response.data;
      });
    return response;
  } catch (error) {
    console.log("error in address validation:", error);
    throw new Error("Address validation failed");
  }
  //   return true;
};

module.exports = {
  validateAddress,
};

/*

{"name":"Mickey and Minnie Mouse","phone":"714-781-4565","company_name":"The Walt Disney Company","address_line1":"500 South Buena Vista Street","city_locality":"Burbank","state_province":"CA","postal_code":91521,"country_code":"US"}

{"name":"Mickey and Minnie Mouse","phone":"714-781-4565","company_name":"The Walt Disney Company","address_line1":"500 South Buena Vista Street","city_locality":"Burbank","state_province":"CA","postal_code":91521,"country_code":"US"}

[[{"name":"Mickey and Minnie Mouse","phone":"714-781-4565","company_name":"The Walt Disney Company","address_line1":"500 South Buena Vista Street","city_locality":"Burbank","state_province":"CA","postal_code":91521,"country_code":"US"}]]

[{"name":"Mickey and Minnie Mouse","phone":"714-781-4565","company_name":"The Walt Disney Company","address_line1":"500 South Buena Vista Street","city_locality":"Burbank","state_province":"CA","postal_code":91521,"country_code":"US"}]

*/
