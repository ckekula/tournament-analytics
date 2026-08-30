## NOTE

You can control the number of transaction logs that Neo4j keeps to back up the database using the parameter db.tx_log.rotation.retention_policy. This configuration setting is dynamic and can be changed at runtime.

The default value is 2 days 2G, which means Neo4j keeps logical logs that contain any transaction committed within 2 days from the current time and within the allocated log space (2G) and prunes the ones that are older or larger.

CDC is not available in the Neo4j Community Edition. It requires Neo4j Enterprise Edition or a paid Aura Enterprise tier.
Built-in procedures (db.cdc.*) and integrations like the Kafka connector only function on Enterprise deployments.

To implement application-level events in Python, you should execute the Neo4j query and publish the event to Kafka within a single logical block.
The example below uses the official neo4j and confluent-kafka packages to create a node and emit a corresponding change event.

## Code Boilerplate

```python
import jsonfrom confluent_kafka
import Producerfrom neo4j
import GraphDatabase
# Configure Kafka Producerkafka_config = {'bootstrap.servers': 'localhost:9092'}producer = Producer(kafka_config)
# Configure Neo4j Driverneo4j_uri = "bolt://localhost:7687"neo4j_auth = ("neo4j", "your_password")driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
def delivery_report(err, msg):
    """ Optional callback to confirm Kafka delivery """
    if err is not None:
        print(f"Message delivery failed: {err}")
def create_user_and_emit_event(tx, username, email):
    # 1. Execute the Neo4j Write Query
    query = """
    CREATE (u:User {username: $username, email: $email})
    RETURN id(u) AS node_id, u.username AS username
    """
    result = tx.run(query, username=username, email=email)
    record = result.single()
    
    if record:
        # 2. Construct the CDC-like payload
        event_payload = {
            "meta": {"operation": "CREATE", "label": "User"},
            "after": {
                "id": record["node_id"],
                "properties": {"username": record["username"], "email": email}
            }
        }
        
        # 3. Publish to Kafka
        producer.produce(
            topic='neo4j-mutations', 
            key=str(record["node_id"]), 
            value=json.dumps(event_payload),
            callback=delivery_report
        )
        producer.flush() # Ensure message is sent
# Executionwith driver.session() as session:
    session.execute_write(create_user_and_emit_event, "john_doe", "john@example.com")

driver.close()
```

## Why This Mimics Native Enterprise CDC

* Payload Structure: Wrapping properties inside an after block matches the payload format used by the Neo4j Kafka Source Connector.
* Key Alignment: Using the internal Neo4j ID (or a UUID) as the Kafka message key ensures message ordering per node, exactly like native CDC.
