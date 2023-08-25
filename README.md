# OrderPost

This application is an order management system that creates shipping labels from the Shipengine API.

In future versions (likely outside of the Austin Coding Academy Capstone), I intend write marketplace integrations starting with ShipStation's openAPI and Custom Store methods, followed by Shopify or Amazon. I will also be writing native carrier integrations starting with FedEx because I know they have an easily accessible Dev environment.

## JS311 Checkpoint 2

-- Include all the routes you plan to support and what the expected input and output of each route is.
-- I'm roughly organizing these by database table, rather than by endpoint.

### warehouses:

Warehouse objects hold address information for the location(s) a user ships packages from

- GET /warehouses - returns an array of existing warehouse addresses on the account.
- GET /warehouses/:id - retrieve 1 warehouse address by its ID.
- POST /warehouses - create a warehouse object.
- PUT /warehouses/:id - update a warehouse object.

### customers:

- GET /
- POST /
- PUT /
  - ship_to will be another route from this endpoint
  - customers can have multiple ship_to addresses
- GET /
- POST /
- PUT /

### products:

- GET /products
- POST /products
- PUT /products
  -- order_items interacts with products.
  -- I'm not sure if that should be another route

### orders:

The interaction of orders and shipments is a bit more complex, and will not be implemented for this Checkpoint assignment. The data layer will require requests to ShipEngine's API, so I will be working on these last.

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

this covers interacting with all tables from my API
