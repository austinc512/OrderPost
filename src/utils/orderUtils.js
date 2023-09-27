const validateOrderInfo = (order) => {
  let {
    order_date,
    total_amount,
    order_status,
    ship_by_date,
    carrier_code,
    service_code,
    package_code,
    confirmation,
    order_weight,
    weight_units,
    dimension_x,
    dimension_y,
    dimension_z,
    dimension_units,
  } = order;

  // A note about service_code:
  // frontend should have logic to only show the relevant service_codes I support based on carrier_code
  // I'm not writing the conditional logic to match carrier/service for my MVP

  const errors = [];

  if (order_date) {
    const testDate = new Date(order_date);
    if (isNaN(testDate)) {
      errors.push({
        status: "error",
        message:
          "order_date must be in ISO format, for example '2023-10-01T00:00:00.000Z'",
        code: 400,
      });
    }
  }

  if (total_amount) {
    total_amount = +total_amount;
    const checkNaN = isNaN(total_amount);
    if (checkNaN) {
      errors.push({
        status: "error",
        message: "total_amount is not a number",
        code: 400,
      });
    } else if (!checkNaN && +total_amount.toFixed(2) !== total_amount) {
      errors.push({
        status: "error",
        message: "total_amount can only have a max of 2 decimal places",
        code: 400,
      });
    }
  }

  // possible values for order_status: "shipped", "unshipped"
  if (order_status) {
    if (
      order_status !== "shipped" &&
      order_status !== "unshipped" &&
      order_status !== "cancelled"
    ) {
      errors.push({
        status: "error",
        message:
          "Invalid order_status property. Possible values are: 'shipped', 'unshipped', or 'cancelled'",
        code: 400,
      });
    }
  }

  // ship_by_date: Storing as .toISOString() because that's what ShipEngine wants.
  if (ship_by_date) {
    const testDate = new Date(ship_by_date);
    if (isNaN(testDate)) {
      errors.push({
        status: "error",
        message:
          "ship_by_date must be in ISO format, for example '2023-10-01T00:00:00.000Z'",
        code: 400,
      });
    }
  }

  // possible carrier_code values: "stamps_com", "fedex", "ups"
  if (carrier_code) {
    if (
      carrier_code !== "stamps_com" &&
      carrier_code !== "fedex" &&
      carrier_code !== "ups"
    ) {
      errors.push({
        status: "error",
        message:
          "Invalid carrier_code. Possible values are: 'stamps_com', 'fedex', or 'ups'.",
        code: 400,
      });
    }
  }

  if (service_code) {
    if (typeof service_code !== "string" || service_code.length > 30) {
      errors.push({
        status: "error",
        message:
          "Invalid service_code. It must be a string <= 30 characters in length",
        code: 400,
      });
    }
  }

  // I'm only gonna support "package" at this time
  if (package_code) {
    if (package_code !== "package") {
      errors.push({
        status: "error",
        message:
          "Invalid package_code. Only 'package' is supported at this time.",
        code: 400,
      });
    }
  }

  // confirmation
  // only supporting "none"
  if (confirmation) {
    if (confirmation !== "none") {
      errors.push({
        status: "error",
        message: "Invalid confirmation. Only 'none' is supported at this time.",
        code: 400,
      });
    }
  }

  // order_weight
  if (order_weight) {
    order_weight = +order_weight;
    const checkNaN = isNaN(order_weight);
    if (checkNaN) {
      errors.push({
        status: "error",
        message: "order_weight is not a number",
        code: 400,
      });
    }
  }

  // possible weight_units: "pound" "ounce" "gram" "kilogram"
  if (weight_units) {
    if (
      weight_units !== "pound" &&
      weight_units !== "ounce" &&
      weight_units !== "gram" &&
      weight_units !== "kilogram"
    ) {
      errors.push({
        status: "error",
        message:
          "weight_units is incorrect. Possible values: 'pound', 'ounce', 'gram', or 'kilogram'",
        code: 400,
      });
    }
  }

  if (dimension_x) {
    dimension_x = +dimension_x;
    const checkNaN = isNaN(dimension_x);
    if (checkNaN) {
      errors.push({
        status: "error",
        message: "dimension_x must be a number.",
        code: 400,
      });
    }
  }

  if (dimension_y) {
    dimension_y = +dimension_y;
    const checkNaN = isNaN(dimension_y);
    if (checkNaN) {
      errors.push({
        status: "error",
        message: "dimension_y must be a number.",
        code: 400,
      });
    }
  }

  if (dimension_z) {
    dimension_z = +dimension_z;
    const checkNaN = isNaN(dimension_z);
    if (checkNaN) {
      errors.push({
        status: "error",
        message: "dimension_z must be a number.",
        code: 400,
      });
    }
  }

  if (dimension_units) {
    if (dimension_units !== "inch" && dimension_units !== "centimeter") {
      errors.push({
        status: "error",
        message:
          "Invalid dimension_units. Possible values are 'inch' or 'centimeter'.",
        code: 400,
      });
    }
  }

  if (errors.length) {
    return errors;
  } else {
    return 0;
  }
};

module.exports = {
  validateOrderInfo,
};
