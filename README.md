# OrderPost

This application is an order management system that creates shipping labels from the Shipengine API.

## 311 Checkpoint 2

Include all the routes you plan to support and what the expected input and output of each route is.

For example:

- GET /recipes - This route returns an array of recipe objects that hold the id, name and description of each recipe. This route does not need any input

- GET /recipes/:recipeId - This route returns a single recipe object that includes all the details of a recipe including the list of ingredients and instructions. This route takes in the recipe id as a path parameter.

### ship_from:

These object hold address information for a CloneStation user's ship from locations.

- GET /shipfrom - returns an array of existing ship_from addresses on the account.
- GET /shipfrom/:id - retrieve 1 ship from address by its ID.
- POST /shipfrom - create a ship_from object.
- PUT /shipfrom - update a ship_from object.

### orders:

- GET /orders - return an array of orders (default size = 100)
- GET /orders?size=500 - query param allowing you to change the size returned.
- GET /orders/:id - get a specific order object by its ID
- POST /orders - create an order object
- PUT /orders - update an order object

order_items interacts with products and orders, but is more related to the orders endpoint. That said, I'm not implementing endpoints specifically for order_items objects.

### shipments:

Shipments are a proxy for 'does this order have a label?'
We can delete (void label), but cannot update shipments after they have been created.

- GET /shipments - return an array of shipments (default size = 100)
- POST /orders/createshipment - create a shipment from an order object
- DELETE / - void the label and delete the shipment object.

### customers:

- GET /
- POST /
- PUT /
  -- ship_to will be another route from this endpoint
  -- customers can have multiple ship_to addresses

- GET /
- POST /
- PUT /

### products:

- GET /products
- POST /products
- PUT /products
  -- order_items interacts with products.
  -- I'm not sure if that should be another route

this covers interacting with all tables from my API
