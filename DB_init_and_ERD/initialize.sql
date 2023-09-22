-- insert (or retrieve) customer placing the order -> creates customerId
-- insert (or retrieve) ship_to address, referencing customerId
-- insert (or retrieve) Order, referencing customerId

-- optional: retrieve products (get productId)

-- insert (or retrieve) orderItems for each item. reference orderId and productId (nullable)

-- optional: create payments table (might not do this at all)
    -- insert into payments referencing orderId

DROP TABLE IF EXISTS OrderPost_ship_to;
DROP TABLE IF EXISTS OrderPost_order_items;
DROP TABLE IF EXISTS OrderPost_products;
DROP TABLE IF EXISTS OrderPost_shipments;
DROP TABLE IF EXISTS OrderPost_orders;
DROP TABLE IF EXISTS OrderPost_customers;
DROP TABLE IF EXISTS OrderPost_warehouses;
DROP TABLE IF EXISTS OrderPost_users;
-- this deletion order works

CREATE TABLE OrderPost_users (
    user_id INT PRIMARY KEY auto_increment,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(40),
    last_name VARCHAR(40),
    email VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE OrderPost_customers (
    customer_id INT PRIMARY KEY auto_increment,
    first_name VARCHAR (40),
    last_name VARCHAR (40),
    phone VARCHAR(15),
    email VARCHAR (50),
    user_id INT,
    FOREIGN KEY (user_id) 
    REFERENCES OrderPost_users(user_id) ON DELETE SET NULL
);

CREATE TABLE OrderPost_ship_to (
    ship_to_id INT PRIMARY KEY auto_increment,
    customer_id INT,
    first_name VARCHAR (40),
    last_name VARCHAR (40),
    phone VARCHAR(15),
    email VARCHAR (50),
    company_name VARCHAR (30),
    address_line1 VARCHAR (50),
    address_line2 VARCHAR (50),
    address_line3 VARCHAR (50),
    city_locality VARCHAR (40),
    state_province VARCHAR (30),
    postal_code VARCHAR (20),
    country_code VARCHAR (10),
    address_residential_indicator BOOLEAN,
    FOREIGN KEY (customer_id) 
    REFERENCES OrderPost_customers (customer_id)
    ON DELETE SET NULL
);

CREATE TABLE OrderPost_warehouses (
    warehouse_id INT PRIMARY KEY auto_increment,
    user_id INT,
    first_name VARCHAR (40),
    last_name VARCHAR (40),
    nick_name VARCHAR (20),
    phone VARCHAR(15),
    email VARCHAR (50),
    company_name VARCHAR (30),
    address_line1 VARCHAR (50),
    address_line2 VARCHAR (50),
    address_line3 VARCHAR (50),
    city_locality VARCHAR (40),
    state_province VARCHAR (30),
    postal_code VARCHAR (20),
    country_code VARCHAR (10),
    address_residential_indicator BOOLEAN,
    FOREIGN KEY (user_id) 
    REFERENCES OrderPost_users (user_id)
    ON DELETE SET NULL
);

CREATE TABLE OrderPost_products (
    product_id INT PRIMARY KEY auto_increment,
    user_id INT,
    product_name VARCHAR (30),
    price DECIMAL (10,2),
    description VARCHAR (150),
    UNIQUE (user_id, product_name),
    FOREIGN KEY (user_id) 
    REFERENCES OrderPost_users (user_id)
    ON DELETE SET NULL
);

-- updated UNIQUE constraint to be unique per product_name per user_id

CREATE TABLE OrderPost_orders (
    order_id INT PRIMARY KEY auto_increment,
    customer_id INT,
    order_number VARCHAR (20) NOT NULL,
    order_date CHAR (24),
        -- Date.prototype.toISOString()
    total_amount DECIMAL (10,2),
        -- The first argument specifies the maximum number of digits, while the second argument specifies how many should appear after the decimal. The number of digits before the decimal is determined by the first value subtracted by the second.
    order_status VARCHAR (15),
    ship_by_date DECIMAL (10,2),
    carrier_code VARCHAR (15),
    service_code VARCHAR (15),
    package_code VARCHAR (15),
    confirmation VARCHAR (15),
    order_weight DECIMAL (6,2),
    weight_units VARCHAR (5),
    dimension_x FLOAT (5,2),
    dimension_y FLOAT (5,2),
    dimension_z FLOAT (5,2),
    dimension_units VARCHAR (5),
    warehouses_id INT,
    FOREIGN KEY (warehouses_id)
    REFERENCES OrderPost_warehouses (warehouse_id)
    ON DELETE SET NULL,
        -- (M,D) means than values can be stored with up to M digits in total, of which D digits may be after the decimal point
     FOREIGN KEY (customer_id) 
     REFERENCES OrderPost_customers (customer_id)
     ON DELETE SET NULL
);

-- re-testing comment


    -- current instance of DB had unique altered. this could fail.

CREATE TABLE OrderPost_order_items (
    order_item_id INT PRIMARY KEY auto_increment,
    order_id INT,
    product_id INT,
    quantity INT,

    FOREIGN KEY (order_id)
    REFERENCES OrderPost_orders (order_id)
    ON DELETE SET NULL,
    FOREIGN KEY (product_id)
    REFERENCES 
    OrderPost_products (product_id)
    ON DELETE SET NULL
);

-- once a shipping label is created, we can insert into Shipments table
CREATE TABLE OrderPost_shipments (
    shipment_id INT PRIMARY KEY auto_increment,
    -- Shipments are generated from orders, not customers
    -- customer_id INT,
    order_id INT,
    order_number VARCHAR (20) NOT NULL,
    order_date CHAR (24),
        -- Date.prototype.toISOString()
    total_amount DECIMAL (10,2),
        -- The first argument specifies the maximum number of digits, while the second argument specifies how many should appear after the decimal. The number of digits before the decimal is determined by the first value subtracted by the second.
    ship_by_date DECIMAL (10,2),
    carrier_code VARCHAR (15),
    service_code VARCHAR (15),
    package_code VARCHAR (15),
    confirmation VARCHAR (15),
    order_weight DECIMAL (6,2),
    weight_units VARCHAR (5),
    dimension_x FLOAT (5,2),
    dimension_y FLOAT (5,2),
    dimension_z FLOAT (5,2),
    dimension_units VARCHAR (5),
        -- (M,D) means than values can be stored with up to M digits in total, of which D digits may be after the decimal point
    -- still needs tracking and label_id    
     FOREIGN KEY (order_id)
     REFERENCES OrderPost_orders (order_id)
     ON DELETE SET NULL
);

-- I somehow completely forgot that there needs to be a users table

-- CREATE TABLE OrderPost_users (
--     user_id INT PRIMARY KEY auto_increment,
--     username VARCHAR(50) NOT NULL,
--     password VARCHAR(255) NOT NULL,
--     first_name VARCHAR(40),
--     last_name VARCHAR(40),
--     email VARCHAR(50) UNIQUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- I also will add a reference to users inside the customers table

-- ALTER TABLE OrderPost_customers ADD COLUMN user_id INT;

-- ALTER TABLE OrderPost_customers 
-- ADD FOREIGN KEY (user_id) REFERENCES OrderPost_users(user_id) 
-- ON DELETE SET NULL;
