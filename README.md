# OrderPost

This application is an order management system that creates shipping labels via the Shipengine API.

In future versions (most likely outside of the Austin Coding Academy Capstone), I intend write marketplace integrations starting with ShipStation's openAPI and Custom Store methods, followed by Shopify or Amazon. I will also be writing native shipping carrier integrations starting with FedEx because I know they have an easily accessible Dev environment.

## JS311 Checkpoint 2

-- Include all the routes you plan to support and what the expected input and output of each route is.
-- I'm organizing these by database table, rather than by endpoint.
-- I will decide whether I want to implement PUT or PATCH requests later, tentatively using PUT.

### warehouses:

Warehouse objects hold address information for the location(s) a user ships packages from

- GET /warehouses - returns an array of existing warehouse addresses on the account.
- GET /warehouses/:warehouseId - retrieve 1 warehouse address by its warehouseId.
- POST /warehouses - pass in address information to create a warehouse object. This creates and returns a new warehouseId.
- PUT /warehouses/:warehouseId - update an existing warehouse object.
- DELETE /warehouses/:warehouseId - delete an existing warehouse object.

### customers:

- GET /customers - returns an array of existing customers on the account (default size = 100).
- GET /customers?size={size} - query param allowing you to change the size returned (max size = 500).
- GET /customers/:customerId - retrieve 1 existing customer object by its customerId.
- POST /customers - pass in customer information to create a customer object. This creates and returns a new customerId.
- PUT /customers/:customerId - update an existing customer object.
- DELETE /customers/:customerId - delete an existing customer object.

There are many other query parameters I could implement on the customers endpoint, for example a 'starts-with' search. Further query structures will be implemented in later iterations.

- question for class: When multiple query parameters are used, does that just generate a more complex SQL statement, or is there a point where I should just manipulate the data with JS (probably using the filter method on the results)?

### Ship-to addresses:

One customers can have multiple ship-to addresses. In other words, the OrderPost_customers table has a One-to-Many relationship with the OrderPost_ship_to table. For this reason, these addresses are accessed through a path under the customers endpoint.

- GET /customers/:customerId/addresses - returns an array of existing ship-to addresses for a customerId.
- POST /customers/:customerId/addresses - pass in address information to create a ship-to object for that customerId.
- GET /customers/:customerId/addresses/:addressId - returns a single ship-to object by its addressId

### products:

- GET /products - returns an array of existing products on the account (default size = 100).
- GET /products?size={size} - returns an array of existing products on the account (max size = 500).
- POST /products
- PUT /products
  -- order_items interacts with products.
  -- I'm not sure if that should be another route

### orders:

The interaction of orders and shipments is a bit more complex, and likely will not be implemented for this Checkpoint assignment. The data layer will require requests to ShipEngine's API, so I will be working on these last.

- GET /orders - return an array of orders (default size = 100)
- GET /orders?size={size} - query param allowing you to change the size returned (max size = 500).
- GET /orders/:orderId - get a specific order object by its ID
- POST /orders - create an order object
- PUT /orders - update an order object

Deleting order objects will not be supported. There's a column in the orders table named 'order_status', and instead of deleting orders we will set them to a 'cancelled' status.

### order_items:

The order_items table has foreign key relationships to both the products and orders tables. It is an associative table between orders and products. That said, I'm not implementing endpoints specifically for order_items. Instead, order_items are a property of order objects, and will be created/read/updated/deleted by the request bodies sent to the orders endpoint.

### shipments:

Thoughts and assumptions:

- Shipment objects are a proxy for 'does this order have a label?'
- Shipment objects contain recipient, package, and item information.
- Shipping labels can be voided, which will DELETE the shipment object
- I will not support PUT requests, because a shipment object should be a static record of items from an order object that have an associated tracking number.

- GET /shipments - return an array of shipments (default size = 100)
- GET /shipments?size={size} - query param allowing you to change the size returned (max size = 500).
- POST /orders/createshipment - create a shipment from an order object. This step can only occur after a successful /v1/labels request to the ShipEngine API.
- DELETE / - void the label and delete the shipment object.
  - The success of this operation depends on the return of a PUT /v1/labels/:label_id/void request to the ShipEngine API.
  - I will need to implement a ShipEngine_label_id column on my shipments table before I can make this work.
    - a potential workaround could be querying ShipEngine by tracking number (returns label_id), then voiding the label. That may not be preferable.
  - an order object can have multiple shipment objects associated with it.
    - upon void, the items on the shipment object now need to be considered 'unshipped' again on the order record again.
      - This also means I need to implement 'shipped' and 'unshipped' items on the order object as well.

That covers all database tables and how they will be accessed from my API layer!
