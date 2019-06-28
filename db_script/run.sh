echo  "Creating and inserting data..."
mysql -h localhost -u root -proot < create_structure.sql;
mysql -h localhost -u root -proot < insert_data.sql;
